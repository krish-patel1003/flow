from __future__ import annotations

import json
import time
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def wait_for_run(run_id: str, timeout_seconds: float = 5.0) -> dict:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        status = client.get(f"/runs/{run_id}")
        assert status.status_code == 200
        payload = status.json()
        if payload["status"] in {"succeeded", "failed", "cancelled"}:
            return payload
        time.sleep(0.05)
    raise AssertionError(f"Run {run_id} did not finish in time")


def make_pipeline(input_path: str, output_path: str, script: str) -> dict:
    return {
        "id": "pipe-1",
        "name": "Demo",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "file_source",
                "position": {"x": 10, "y": 0},
                "config": {"path": input_path, "mode": "text"},
            },
            {
                "id": "n3",
                "type": "python_transform",
                "position": {"x": 20, "y": 0},
                "config": {"script": script, "retries": 0, "retry_backoff_seconds": 0},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": output_path, "mode": "text", "retries": 0, "retry_backoff_seconds": 0},
            },
        ],
        "edges": [
            {
                "id": "e1",
                "source": {"node_id": "n1", "port": "start"},
                "target": {"node_id": "n2", "port": "trigger"},
            },
            {
                "id": "e2",
                "source": {"node_id": "n2", "port": "data"},
                "target": {"node_id": "n3", "port": "input"},
            },
            {
                "id": "e3",
                "source": {"node_id": "n3", "port": "output"},
                "target": {"node_id": "n4", "port": "input"},
            },
        ],
    }


def test_run_pipeline_success(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            "def transform(input_data):\n    return str(input_data).upper()",
        )
    }
    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]

    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"
    assert data["node_states"]["n3"]["attempts"] == 1

    assert output_file.read_text() == "HELLO"

    artifacts = client.get(f"/runs/{run_id}/artifacts")
    assert artifacts.status_code == 200
    manifest = artifacts.json()
    assert "artifacts" in manifest

    run_json = run_dir / run_id / "run.json"
    assert run_json.exists()
    persisted = json.loads(run_json.read_text())
    assert persisted["status"] == "succeeded"


def test_run_pipeline_transform_failure(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            "def transform(input_data):\n    raise ValueError('boom')",
        )
    }

    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]

    data = wait_for_run(run_id)
    assert data["status"] == "failed"
    assert data["node_states"]["n3"]["attempts"] == 1

    logs = client.get(f"/runs/{run_id}/logs/n3")
    assert logs.status_code == 200
    assert "boom" in logs.text


def test_run_pipeline_transform_allows_imports(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("9")
    output_file = tmp_path / "output.txt"

    script = "import math\n\ndef transform(input_data):\n    return math.sqrt(float(input_data))"
    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            script,
        )
    }

    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]

    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"
    assert data["node_states"]["n3"]["attempts"] == 1
    assert output_file.read_text() == "3.0"


def test_list_runs_endpoint(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"
    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            "def transform(input_data):\n    return str(input_data).upper()",
        )
    }

    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    wait_for_run(run_id)

    listing = client.get("/runs")
    assert listing.status_code == 200
    runs = listing.json()["runs"]
    assert any(run["run_id"] == run_id for run in runs)


def test_run_pipeline_retries_transform_then_succeeds(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    marker = tmp_path / "marker.txt"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    pipeline = make_pipeline(
        str(input_file),
        str(output_file),
        (
            f"from pathlib import Path\n"
            f"marker = Path(r'{marker}')\n"
            "def transform(input_data):\n"
            "    if not marker.exists():\n"
            "        marker.write_text('seen')\n"
            "        raise ValueError('first failure')\n"
            "    return str(input_data).upper()\n"
        ),
    )
    pipeline["nodes"][2]["config"]["retries"] = 1
    pipeline["nodes"][2]["config"]["retry_backoff_seconds"] = 0

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]

    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"
    assert data["node_states"]["n3"]["attempts"] == 2
    assert output_file.read_text() == "HELLO"


def test_run_pipeline_cancel_request(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    pipeline = make_pipeline(
        str(input_file),
        str(output_file),
        "import time\n\ndef transform(input_data):\n    time.sleep(2)\n    return input_data",
    )

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]

    cancel = client.post(f"/runs/{run_id}/cancel")
    assert cancel.status_code == 200

    data = wait_for_run(run_id, timeout_seconds=8)
    assert data["status"] == "cancelled"
    assert any(state["status"] == "cancelled" for state in data["node_states"].values())


def test_run_parallel_ready_nodes_completes_quickly(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))
    monkeypatch.setenv("RUN_MAX_WORKERS", "4")

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file_a = tmp_path / "out_a.txt"
    output_file_b = tmp_path / "out_b.txt"

    pipeline = {
        "id": "pipe-parallel",
        "name": "Parallel",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "file_source",
                "position": {"x": 10, "y": 0},
                "config": {"path": str(input_file), "mode": "text"},
            },
            {
                "id": "n3",
                "type": "python_transform",
                "position": {"x": 20, "y": 0},
                "config": {
                    "script": "import time\n\ndef transform(input_data):\n    time.sleep(1)\n    return str(input_data).upper()",
                    "retries": 0,
                    "retry_backoff_seconds": 0,
                },
            },
            {
                "id": "n4",
                "type": "python_transform",
                "position": {"x": 20, "y": 20},
                "config": {
                    "script": "import time\n\ndef transform(input_data):\n    time.sleep(1)\n    return str(input_data).lower()",
                    "retries": 0,
                    "retry_backoff_seconds": 0,
                },
            },
            {
                "id": "n5",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": str(output_file_a), "mode": "text", "retries": 0, "retry_backoff_seconds": 0},
            },
            {
                "id": "n6",
                "type": "file_sink",
                "position": {"x": 30, "y": 20},
                "config": {"path": str(output_file_b), "mode": "text", "retries": 0, "retry_backoff_seconds": 0},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "trigger"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "data"}, "target": {"node_id": "n3", "port": "input"}},
            {"id": "e3", "source": {"node_id": "n2", "port": "data"}, "target": {"node_id": "n4", "port": "input"}},
            {"id": "e4", "source": {"node_id": "n3", "port": "output"}, "target": {"node_id": "n5", "port": "input"}},
            {"id": "e5", "source": {"node_id": "n4", "port": "output"}, "target": {"node_id": "n6", "port": "input"}},
        ],
    }

    started = time.time()
    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id, timeout_seconds=8)
    duration = time.time() - started

    assert data["status"] == "succeeded"
    assert duration < 2.5
    assert output_file_a.read_text() == "HELLO"
    assert output_file_b.read_text() == "hello"


def test_run_pipeline_data_aggregation_then_llm_mock(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    output_file = tmp_path / "summary.txt"

    pipeline = {
        "id": "pipe-agg-llm",
        "name": "Aggregation to LLM",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "dataAggregation",
                "position": {"x": 20, "y": 0},
                "config": {"aggregationType": "sum", "values": [2, 3, 5]},
            },
            {
                "id": "n3",
                "type": "llm",
                "position": {"x": 40, "y": 0},
                "config": {"mode": "mock", "systemPrompt": "helpful assistant"},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 60, "y": 0},
                "config": {"path": str(output_file), "mode": "text"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "data1"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "aggregated"}, "target": {"node_id": "n3", "port": "prompt"}},
            {"id": "e3", "source": {"node_id": "n3", "port": "response"}, "target": {"node_id": "n4", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"
    assert "Mock LLM response" in output_file.read_text()


def test_get_file_sink_output_preview(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            "def transform(input_data):\n    return str(input_data).upper()",
        )
    }
    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    wait_for_run(run_id)

    preview = client.get(f"/runs/{run_id}/outputs/n4")
    assert preview.status_code == 200
    body = preview.json()
    assert body["node_id"] == "n4"
    assert body["path"] == str(output_file)
    assert body["content"] == "HELLO"
    assert body["missing"] is False


def test_get_file_sink_output_preview_missing_node_artifact(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "input.txt"
    input_file.write_text("hello")
    output_file = tmp_path / "output.txt"

    payload = {
        "pipeline": make_pipeline(
            str(input_file),
            str(output_file),
            "def transform(input_data):\n    return str(input_data).upper()",
        )
    }
    create = client.post("/runs", json=payload)
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    wait_for_run(run_id)

    preview = client.get(f"/runs/{run_id}/outputs/n3")
    assert preview.status_code == 404


def test_run_pipeline_json_extract_to_file_sink(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    input_file = tmp_path / "payload.json"
    input_file.write_text('{"user":{"name":"Ada"}}')
    output_file = tmp_path / "name.txt"

    pipeline = {
        "id": "pipe-json-extract",
        "name": "JSON Extract",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "file_source",
                "position": {"x": 10, "y": 0},
                "config": {"path": str(input_file), "mode": "json"},
            },
            {
                "id": "n3",
                "type": "json_extract",
                "position": {"x": 20, "y": 0},
                "config": {"path": "user.name"},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": str(output_file), "mode": "text"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "trigger"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "data"}, "target": {"node_id": "n3", "port": "input"}},
            {"id": "e3", "source": {"node_id": "n3", "port": "value"}, "target": {"node_id": "n4", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"
    assert output_file.read_text() == "Ada"


def test_run_pipeline_join_merge_and_schema_validate(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    output_file = tmp_path / "result.json"

    pipeline = {
        "id": "pipe-merge-validate",
        "name": "Join and validate",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "python_transform",
                "position": {"x": 10, "y": 0},
                "config": {"script": "def transform(input_data):\n    return {'first': 'Ada'}"},
            },
            {
                "id": "n3",
                "type": "python_transform",
                "position": {"x": 10, "y": 20},
                "config": {"script": "def transform(input_data):\n    return {'last': 'Lovelace'}"},
            },
            {
                "id": "n4",
                "type": "join_merge",
                "position": {"x": 20, "y": 0},
                "config": {"strategy": "object_merge"},
            },
            {
                "id": "n5",
                "type": "schema_validate",
                "position": {"x": 30, "y": 0},
                "config": {"schema_type": "required_keys", "required_keys": ["first", "last"]},
            },
            {
                "id": "n6",
                "type": "file_sink",
                "position": {"x": 40, "y": 0},
                "config": {"path": str(output_file), "mode": "json"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "input"}},
            {"id": "e2", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n3", "port": "input"}},
            {"id": "e3", "source": {"node_id": "n2", "port": "output"}, "target": {"node_id": "n4", "port": "left"}},
            {"id": "e4", "source": {"node_id": "n3", "port": "output"}, "target": {"node_id": "n4", "port": "right"}},
            {"id": "e5", "source": {"node_id": "n4", "port": "merged"}, "target": {"node_id": "n5", "port": "input"}},
            {"id": "e6", "source": {"node_id": "n5", "port": "result"}, "target": {"node_id": "n6", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"

    payload = json.loads(output_file.read_text())
    assert payload["valid"] is True
    assert payload["value"]["first"] == "Ada"
    assert payload["value"]["last"] == "Lovelace"


def test_run_pipeline_filter_node_outputs_match_payload(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    output_file = tmp_path / "filter_result.json"
    pipeline = {
        "id": "pipe-filter",
        "name": "Filter",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "python_transform",
                "position": {"x": 10, "y": 0},
                "config": {"script": "def transform(input_data):\n    return {'score': 91, 'name': 'Ada'}"},
            },
            {
                "id": "n3",
                "type": "filter",
                "position": {"x": 20, "y": 0},
                "config": {"field": "score", "operator": ">=", "value": 80},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": str(output_file), "mode": "json"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "input"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "output"}, "target": {"node_id": "n3", "port": "input"}},
            {"id": "e3", "source": {"node_id": "n3", "port": "pass"}, "target": {"node_id": "n4", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"

    payload = json.loads(output_file.read_text())
    assert payload["matched"] is True
    assert payload["pass"]["name"] == "Ada"


def test_run_pipeline_notification_log_channel(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    output_file = tmp_path / "notify_result.json"
    pipeline = {
        "id": "pipe-notify",
        "name": "Notification",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "notification",
                "position": {"x": 10, "y": 0},
                "config": {"channel": "log", "template": "hello {{input}}"},
            },
            {
                "id": "n3",
                "type": "file_sink",
                "position": {"x": 20, "y": 0},
                "config": {"path": str(output_file), "mode": "json"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n2", "port": "message"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "status"}, "target": {"node_id": "n3", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"

    payload = json.loads(output_file.read_text())
    assert payload["status"] == "sent"
    assert payload["channel"] == "log"


def test_run_pipeline_scheduler_and_webhook_triggers(tmp_path: Path, monkeypatch) -> None:
    run_dir = tmp_path / ".runs"
    monkeypatch.setenv("RUNS_DIR", str(run_dir))

    output_file = tmp_path / "trigger_payload.json"
    pipeline = {
        "id": "pipe-triggers",
        "name": "Triggers pipeline",
        "version": "v1",
        "nodes": [
            {
                "id": "n1",
                "type": "scheduler_trigger",
                "position": {"x": 0, "y": 0},
                "config": {"cron": "0 * * * *", "timezone": "UTC", "enabled": True},
            },
            {
                "id": "n2",
                "type": "webhook_trigger",
                "position": {"x": 0, "y": 40},
                "config": {
                    "path": "/hooks/demo",
                    "method": "POST",
                    "sample_payload": {"customer": "Ada", "priority": "high"},
                },
            },
            {
                "id": "n3",
                "type": "join_merge",
                "position": {"x": 20, "y": 20},
                "config": {"strategy": "object_merge"},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 40, "y": 20},
                "config": {"path": str(output_file), "mode": "json"},
            },
        ],
        "edges": [
            {"id": "e1", "source": {"node_id": "n1", "port": "start"}, "target": {"node_id": "n3", "port": "left"}},
            {"id": "e2", "source": {"node_id": "n2", "port": "payload"}, "target": {"node_id": "n3", "port": "right"}},
            {"id": "e3", "source": {"node_id": "n3", "port": "merged"}, "target": {"node_id": "n4", "port": "input"}},
        ],
    }

    create = client.post("/runs", json={"pipeline": pipeline})
    assert create.status_code == 200
    run_id = create.json()["run_id"]
    data = wait_for_run(run_id)
    assert data["status"] == "succeeded"

    payload = json.loads(output_file.read_text())
    assert payload["source"] == "webhook_trigger"
    assert payload["payload"]["customer"] == "Ada"
    assert payload["triggered"] is True
