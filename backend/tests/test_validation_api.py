from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def make_pipeline() -> dict:
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
                "config": {"path": "input.txt", "mode": "text"},
            },
            {
                "id": "n3",
                "type": "python_transform",
                "position": {"x": 20, "y": 0},
                "config": {"script": "def transform(input_data):\n    return str(input_data).upper()"},
            },
            {
                "id": "n4",
                "type": "file_sink",
                "position": {"x": 30, "y": 0},
                "config": {"path": "output.txt", "mode": "text"},
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


def test_validate_pipeline_success() -> None:
    response = client.post("/pipelines/validate", json=make_pipeline())
    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is True
    assert payload["errors"] == []


def test_validate_pipeline_rejects_bad_port() -> None:
    pipeline = make_pipeline()
    pipeline["edges"][0]["source"]["port"] = "bad"

    response = client.post("/pipelines/validate", json=pipeline)

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert any(e["code"] == "invalid_source_port" for e in payload["errors"])


def test_validate_pipeline_rejects_cycle() -> None:
    pipeline = make_pipeline()
    pipeline["edges"].append(
        {
            "id": "e4",
            "source": {"node_id": "n3", "port": "output"},
            "target": {"node_id": "n2", "port": "trigger"},
        }
    )

    response = client.post("/pipelines/validate", json=pipeline)

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert any(e["code"] == "cycle_detected" for e in payload["errors"])


def test_validate_pipeline_rejects_coming_soon_nodes() -> None:
    pipeline = make_pipeline()
    pipeline["nodes"].append(
        {"id": "n5", "type": "llm", "position": {"x": 40, "y": 0}, "config": {}}
    )

    response = client.post("/pipelines/validate", json=pipeline)

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert any(e["code"] == "node_type_not_supported" for e in payload["errors"])
