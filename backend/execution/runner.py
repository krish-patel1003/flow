from __future__ import annotations

import json
import os
import time
import traceback
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import Lock, Thread
from uuid import uuid4

from ..schemas import NodeRunState, Pipeline, RunStatusResponse
from .executors import (
    execute_api_request,
    execute_conditional,
    execute_data_aggregation,
    execute_file_sink,
    execute_file_source,
    execute_image_processing,
    execute_json_extract,
    execute_join_merge,
    execute_llm,
    execute_manual_trigger,
    execute_math,
    execute_python_transform,
    execute_schema_validate,
    execute_text,
)
from .storage import ensure_run_paths, write_json


class RunCancelled(Exception):
    pass


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


@dataclass
class RuntimeContext:
    run_id: str
    paths: dict[str, Path]


class RunManager:
    def __init__(self) -> None:
        self._runs: dict[str, dict] = {}
        self._threads: dict[str, Thread] = {}
        self._cancel_requested: set[str] = set()
        self._active_run_id: str | None = None
        self._lock = Lock()
        self._persist_lock = Lock()

    def _max_workers(self) -> int:
        try:
            value = int(os.getenv("RUN_MAX_WORKERS", "2"))
            return max(1, value)
        except ValueError:
            return 2

    def _base_runs_dir(self) -> Path:
        configured = os.getenv("RUNS_DIR")
        if configured:
            return Path(configured)
        return Path(__file__).resolve().parent.parent / ".runs"

    def _persist(self, run_id: str, context: RuntimeContext) -> None:
        with self._persist_lock:
            write_json(context.paths["run_json"], self._runs[run_id])

    def _append_log(self, context: RuntimeContext, node_id: str, text: str) -> None:
        log_path = context.paths["logs"] / f"{node_id}.log"
        with log_path.open("a") as fh:
            fh.write(text)
            if not text.endswith("\n"):
                fh.write("\n")

    def _append_artifact(self, context: RuntimeContext, node_id: str, artifact_type: str, value: str) -> None:
        manifest_path = context.paths["manifest"]
        payload = {"run_id": context.run_id, "artifacts": []}
        if manifest_path.exists():
            payload = json.loads(manifest_path.read_text())
        payload["artifacts"].append({"node_id": node_id, "type": artifact_type, "value": value})
        write_json(manifest_path, payload)

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

    def create_and_run(self, pipeline: Pipeline) -> str:
        with self._lock:
            if self._active_run_id is not None:
                raise RuntimeError("A run is already in progress")

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
            self._active_run_id = run_id

            write_json(paths["run_json"], run_state)
            write_json(paths["manifest"], {"run_id": run_id, "artifacts": []})

            context = RuntimeContext(run_id=run_id, paths=paths)
            thread = Thread(target=self._execute_pipeline, args=(pipeline, context), daemon=True)
            self._threads[run_id] = thread
            thread.start()
            return run_id

    def _finish_run(self, run_id: str) -> None:
        with self._lock:
            if self._active_run_id == run_id:
                self._active_run_id = None
            self._cancel_requested.discard(run_id)

    def _set_cancelled_state_for_incomplete_nodes(self, run: dict) -> None:
        for state in run["node_states"].values():
            if state["status"] in {"pending", "running"}:
                state["status"] = "cancelled"
                state["finished_at"] = _now_iso()

    def _execute_node_once(self, node_type: str, node_config: dict, incoming: object, context: RuntimeContext):
        if node_type == "manual_trigger":
            return execute_manual_trigger(node_config, incoming), "", []
        if node_type == "file_source":
            output = execute_file_source(node_config, incoming)
            return output, "", [("file_source", node_config["path"])]
        if node_type == "python_transform":
            output, logs = execute_python_transform(node_config, incoming, context.paths["run_root"])
            return output, logs, []
        if node_type == "file_sink":
            output = execute_file_sink(node_config, incoming)
            return output, "", [("file_sink", output)]
        if node_type == "text":
            return execute_text(node_config, incoming), "", []
        if node_type == "math":
            return execute_math(node_config, incoming), "", []
        if node_type == "conditional":
            return execute_conditional(node_config, incoming), "", []
        if node_type == "api":
            return execute_api_request(node_config, incoming), "", []
        if node_type == "llm":
            return execute_llm(node_config, incoming), "", []
        if node_type == "dataAggregation":
            return execute_data_aggregation(node_config, incoming), "", []
        if node_type == "imageProcessing":
            output = execute_image_processing(node_config, incoming)
            return output, "", [("imageProcessing", output.get("path", ""))]
        if node_type == "json_extract":
            return execute_json_extract(node_config, incoming), "", []
        if node_type == "join_merge":
            return execute_join_merge(node_config, incoming), "", []
        if node_type == "schema_validate":
            return execute_schema_validate(node_config, incoming), "", []
        raise RuntimeError(f"Unsupported node type at runtime: {node_type}")

    def _execute_node_with_retry(self, node, node_state: dict, incoming: object, context: RuntimeContext):
        retries = int(node.config.get("retries", 0))
        backoff = float(node.config.get("retry_backoff_seconds", 0))
        attempts = max(1, retries + 1)

        last_exc: Exception | None = None
        for attempt in range(1, attempts + 1):
            if context.run_id in self._cancel_requested:
                raise RunCancelled("Run cancelled")
            node_state["attempts"] = attempt
            self._persist(context.run_id, context)
            try:
                return self._execute_node_once(node.type, node.config, incoming, context)
            except Exception as exc:  # noqa: PERF203
                last_exc = exc
                self._append_log(
                    context,
                    node.id,
                    f"Attempt {attempt}/{attempts} failed: {exc}",
                )
                if attempt == attempts:
                    break
                sleep_seconds = backoff * (2 ** (attempt - 1))
                waited = 0.0
                while waited < sleep_seconds:
                    if context.run_id in self._cancel_requested:
                        raise RunCancelled("Run cancelled")
                    chunk = min(0.1, sleep_seconds - waited)
                    time.sleep(chunk)
                    waited += chunk
        assert last_exc is not None
        raise last_exc

    def _execute_pipeline(self, pipeline: Pipeline, context: RuntimeContext) -> None:
        run = self._runs[context.run_id]
        run["status"] = "running"
        run["started_at"] = _now_iso()
        self._persist(context.run_id, context)

        nodes_by_id = {node.id: node for node in pipeline.nodes}
        indegree = {node.id: 0 for node in pipeline.nodes}
        children: dict[str, list[str]] = {node.id: [] for node in pipeline.nodes}
        for edge in pipeline.edges:
            indegree[edge.target.node_id] += 1
            children[edge.source.node_id].append(edge.target.node_id)

        ready = [node_id for node_id, degree in indegree.items() if degree == 0]
        node_outputs: dict[str, object] = {}
        running: dict[Future, str] = {}
        failed = False

        try:
            with ThreadPoolExecutor(max_workers=self._max_workers()) as executor:
                while True:
                    cancel_requested = context.run_id in self._cancel_requested
                    while ready and not failed and not cancel_requested and len(running) < self._max_workers():
                        node_id = ready.pop(0)
                        node = nodes_by_id[node_id]
                        node_state = run["node_states"][node_id]
                        node_state["status"] = "running"
                        node_state["started_at"] = _now_iso()
                        self._persist(context.run_id, context)

                        incoming = self._incoming_for_node(pipeline, node_id, node_outputs)
                        future = executor.submit(self._execute_node_with_retry, node, node_state, incoming, context)
                        running[future] = node_id

                    if not running:
                        if failed:
                            break
                        if cancel_requested:
                            break
                        if not ready:
                            break
                        continue

                    done, _ = wait(set(running.keys()), return_when=FIRST_COMPLETED)
                    for future in done:
                        node_id = running.pop(future)
                        node = nodes_by_id[node_id]
                        node_state = run["node_states"][node_id]
                        try:
                            output, extra_logs, artifacts = future.result()
                            node_outputs[node_id] = output
                            node_state["status"] = "succeeded"
                            node_state["finished_at"] = _now_iso()
                            if extra_logs:
                                self._append_log(context, node.id, extra_logs)
                            for artifact_type, value in artifacts:
                                self._append_artifact(context, node.id, artifact_type, value)
                            self._append_log(context, node.id, f"Node {node_id} completed")

                            for child_id in children[node_id]:
                                indegree[child_id] -= 1
                                if indegree[child_id] == 0:
                                    ready.append(child_id)
                        except RunCancelled:
                            node_state["status"] = "cancelled"
                            node_state["finished_at"] = _now_iso()
                        except Exception as exc:  # noqa: PERF203
                            node_state["status"] = "failed"
                            node_state["finished_at"] = _now_iso()
                            node_state["error"] = str(exc)
                            self._append_log(context, node.id, traceback.format_exc())
                            failed = True

                        self._persist(context.run_id, context)

                    if failed:
                        for future in running:
                            future.cancel()
                        break

            if failed:
                run["status"] = "failed"
            elif context.run_id in self._cancel_requested:
                self._set_cancelled_state_for_incomplete_nodes(run)
                run["status"] = "cancelled"
            else:
                run["status"] = "succeeded"

            run["finished_at"] = _now_iso()
            self._persist(context.run_id, context)
        finally:
            self._finish_run(context.run_id)

    def list_runs(self) -> list[RunStatusResponse]:
        return [RunStatusResponse.model_validate(run) for run in self._runs.values()]

    def cancel_run(self, run_id: str) -> bool:
        run = self._runs.get(run_id)
        if run is None:
            return False
        if run["status"] in {"succeeded", "failed", "cancelled"}:
            return True
        self._cancel_requested.add(run_id)
        return True

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
        return json.loads(manifest_path.read_text())

    def get_file_sink_output(self, run_id: str, node_id: str, max_chars: int = 12000) -> dict | None:
        run = self._runs.get(run_id)
        if run is None:
            return None

        manifest = self.get_artifacts(run_id) or {"artifacts": []}
        artifacts = manifest.get("artifacts", [])
        match = next(
            (
                artifact
                for artifact in reversed(artifacts)
                if artifact.get("node_id") == node_id and artifact.get("type") == "file_sink"
            ),
            None,
        )
        if not match:
            return {}

        raw_path = str(match.get("value", "")).strip()
        if not raw_path:
            return {}

        file_path = Path(raw_path)
        if not file_path.is_absolute():
            file_path = Path.cwd() / file_path

        if not file_path.exists() or not file_path.is_file():
            return {
                "node_id": node_id,
                "path": raw_path,
                "content": "",
                "truncated": False,
                "size_bytes": 0,
                "content_type": "text/plain",
                "missing": True,
            }

        with file_path.open("r", encoding="utf-8", errors="replace") as fh:
            content = fh.read(max_chars + 1)
        truncated = len(content) > max_chars
        if truncated:
            content = content[:max_chars]

        return {
            "node_id": node_id,
            "path": raw_path,
            "content": content,
            "truncated": truncated,
            "size_bytes": file_path.stat().st_size,
            "content_type": "application/json" if file_path.suffix.lower() == ".json" else "text/plain",
            "missing": False,
        }

    def get_status_response(self, run_id: str) -> RunStatusResponse | None:
        run = self.get_run(run_id)
        if run is None:
            return None
        return RunStatusResponse.model_validate(run)
