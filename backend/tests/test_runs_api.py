from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


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
                "config": {"script": script},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": output_path, "mode": "text"},
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

    status = client.get(f"/runs/{run_id}")
    assert status.status_code == 200
    data = status.json()
    assert data["status"] == "succeeded"

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

    status = client.get(f"/runs/{run_id}")
    assert status.status_code == 200
    data = status.json()
    assert data["status"] == "failed"

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

    status = client.get(f"/runs/{run_id}")
    assert status.status_code == 200
    data = status.json()
    assert data["status"] == "succeeded"
    assert output_file.read_text() == "3.0"
