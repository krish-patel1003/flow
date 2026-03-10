from __future__ import annotations

import os
import traceback
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock
from uuid import uuid4

from ..schemas import NodeRunState, Pipeline, RunStatusResponse
from .executors import (
    execute_file_sink,
    execute_file_source,
    execute_manual_trigger,
    execute_python_transform,
)
from .planner import topological_order
from .storage import ensure_run_paths, write_json


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class RuntimeContext:
    run_id: str
    paths: dict[str, Path]


class RunManager:
    def __init__(self) -> None:
        self._runs: dict[str, dict] = {}
        self._lock = Lock()
        self._running = False

    def _base_runs_dir(self) -> Path:
        configured = os.getenv("RUNS_DIR")
        if configured:
            return Path(configured)
        return Path(__file__).resolve().parent.parent / ".runs"

    def create_and_run(self, pipeline: Pipeline) -> str:
        with self._lock:
            if self._running:
                raise RuntimeError("A run is already in progress")
            self._running = True

        run_id = f"run_{uuid4().hex[:10]}"
        paths = ensure_run_paths(self._base_runs_dir(), run_id)
        node_states = {node.id: NodeRunState(status="pending").model_dump() for node in pipeline.nodes}
        run_state = {
            "run_id": run_id,
            "status": "pending",
            "created_at": _now_iso(),
            "started_at": None,
            "finished_at": None,
            "pipeline_id": pipeline.id,
            "node_states": node_states,
        }
        self._runs[run_id] = run_state
        write_json(paths["run_json"], run_state)
        write_json(paths["manifest"], {"run_id": run_id, "artifacts": []})

        context = RuntimeContext(run_id=run_id, paths=paths)
        try:
            self._execute_pipeline(pipeline, context)
        finally:
            with self._lock:
                self._running = False
        return run_id

    def _set_run_status(self, run_id: str, status: str) -> None:
        run = self._runs[run_id]
        run["status"] = status

    def _persist(self, run_id: str, context: RuntimeContext) -> None:
        write_json(context.paths["run_json"], self._runs[run_id])

    def _incoming_for_node(self, pipeline: Pipeline, node_id: str, node_outputs: dict[str, object]) -> object:
        incoming = [
            node_outputs[edge.source.node_id]
            for edge in pipeline.edges
            if edge.target.node_id == node_id and edge.source.node_id in node_outputs
        ]
        if not incoming:
            return None
        if len(incoming) == 1:
            return incoming[0]
        return incoming

    def _append_log(self, context: RuntimeContext, node_id: str, text: str) -> None:
        log_path = context.paths["logs"] / f"{node_id}.log"
        with log_path.open("a") as fh:
            fh.write(text)
            if not text.endswith("\n"):
                fh.write("\n")

    def _append_artifact(self, context: RuntimeContext, node_id: str, artifact_type: str, value: str) -> None:
        manifest_path = context.paths["manifest"]
        payload = {
            "run_id": context.run_id,
            "artifacts": [],
        }
        if manifest_path.exists():
            import json

            payload = json.loads(manifest_path.read_text())
        payload["artifacts"].append({"node_id": node_id, "type": artifact_type, "value": value})
        write_json(manifest_path, payload)

    def _execute_pipeline(self, pipeline: Pipeline, context: RuntimeContext) -> None:
        run = self._runs[context.run_id]
        run["status"] = "running"
        run["started_at"] = _now_iso()
        self._persist(context.run_id, context)

        ordered = topological_order(pipeline)
        by_id = {node.id: node for node in pipeline.nodes}
        node_outputs: dict[str, object] = {}

        for node_id in ordered:
            node = by_id[node_id]
            node_state = run["node_states"][node_id]
            node_state["status"] = "running"
            node_state["started_at"] = _now_iso()
            self._persist(context.run_id, context)

            incoming = self._incoming_for_node(pipeline, node_id, node_outputs)

            try:
                extra_logs = ""
                if node.type == "manual_trigger":
                    output = execute_manual_trigger(node.config, incoming)
                elif node.type == "file_source":
                    output = execute_file_source(node.config, incoming)
                    self._append_artifact(context, node.id, "file_source", node.config["path"])
                elif node.type == "python_transform":
                    output, extra_logs = execute_python_transform(node.config, incoming, context.paths["run_root"])
                elif node.type == "file_sink":
                    output = execute_file_sink(node.config, incoming)
                    self._append_artifact(context, node.id, "file_sink", output)
                else:
                    raise RuntimeError(f"Unsupported node type at runtime: {node.type}")

                node_outputs[node_id] = output
                node_state["status"] = "succeeded"
                node_state["finished_at"] = _now_iso()
                if extra_logs:
                    self._append_log(context, node.id, extra_logs)
                self._append_log(context, node.id, f"Node {node_id} completed")
            except Exception as exc:
                node_state["status"] = "failed"
                node_state["finished_at"] = _now_iso()
                node_state["error"] = str(exc)
                self._append_log(context, node.id, traceback.format_exc())
                run["status"] = "failed"
                run["finished_at"] = _now_iso()
                self._persist(context.run_id, context)
                return

            self._persist(context.run_id, context)

        run["status"] = "succeeded"
        run["finished_at"] = _now_iso()
        self._persist(context.run_id, context)

    def get_run(self, run_id: str) -> dict | None:
        return self._runs.get(run_id)

    def get_log_text(self, run_id: str, node_id: str) -> str | None:
        run = self._runs.get(run_id)
        if run is None:
            return None
        log_path = ensure_run_paths(self._base_runs_dir(), run_id)["logs"] / f"{node_id}.log"
        if not log_path.exists():
            return ""
        return log_path.read_text()

    def get_artifacts(self, run_id: str) -> dict | None:
        run = self._runs.get(run_id)
        if run is None:
            return None
        manifest_path = ensure_run_paths(self._base_runs_dir(), run_id)["manifest"]
        if not manifest_path.exists():
            return {"run_id": run_id, "artifacts": []}
        import json

        return json.loads(manifest_path.read_text())

    def get_status_response(self, run_id: str) -> RunStatusResponse | None:
        run = self.get_run(run_id)
        if run is None:
            return None
        return RunStatusResponse.model_validate(run)
