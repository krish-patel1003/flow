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
        {"id": "n5", "type": "customInput", "position": {"x": 40, "y": 0}, "config": {}}
    )

    response = client.post("/pipelines/validate", json=pipeline)

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert any(e["code"] == "node_type_not_supported" for e in payload["errors"])


def test_validate_pipeline_supports_text_math_conditional_api_nodes() -> None:
    pipeline = {
        "id": "pipe-extended",
        "name": "Extended",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "text",
                "position": {"x": 10, "y": 0},
                "config": {"template": "hello"},
            },
            {
                "id": "n3",
                "type": "math",
                "position": {"x": 20, "y": 0},
                "config": {"operation": "add"},
            },
            {
                "id": "n4",
                "type": "conditional",
                "position": {"x": 30, "y": 0},
                "config": {"operator": "=="},
            },
            {
                "id": "n5",
                "type": "api",
                "position": {"x": 40, "y": 0},
                "config": {"method": "GET", "url": "http://example.com"},
            },
        ],
        "edges": [
            {
                "id": "e1",
                "source": {"node_id": "n1", "port": "start"},
                "target": {"node_id": "n2", "port": "input"},
            },
            {
                "id": "e2",
                "source": {"node_id": "n2", "port": "text"},
                "target": {"node_id": "n3", "port": "num1"},
            },
            {
                "id": "e3",
                "source": {"node_id": "n3", "port": "result"},
                "target": {"node_id": "n4", "port": "value1"},
            },
            {
                "id": "e4",
                "source": {"node_id": "n4", "port": "true"},
                "target": {"node_id": "n5", "port": "payload"},
            },
        ],
    }

    response = client.post("/pipelines/validate", json=pipeline)
    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is True


def test_validate_pipeline_rejects_invalid_text_node_config() -> None:
    pipeline = make_pipeline()
    pipeline["nodes"].append(
        {
            "id": "n5",
            "type": "text",
            "position": {"x": 40, "y": 0},
            "config": {"bad": "value"},
        }
    )

    response = client.post("/pipelines/validate", json=pipeline)
    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert any(e["code"] == "invalid_node_config" and e["node_id"] == "n5" for e in payload["errors"])


def test_node_registry_endpoint_returns_available_nodes() -> None:
    response = client.get("/registry/nodes")
    assert response.status_code == 200
    payload = response.json()
    assert "nodes" in payload
    node_types = {node["type"] for node in payload["nodes"]}
    assert "manual_trigger" in node_types
    assert "api" in node_types


def test_validate_pipeline_supports_llm_image_aggregation_nodes() -> None:
    pipeline = {
        "id": "pipe-ai",
        "name": "AI pipeline",
        "version": "v1",
        "nodes": [
            {"id": "n1", "type": "manual_trigger", "position": {"x": 0, "y": 0}, "config": {}},
            {
                "id": "n2",
                "type": "dataAggregation",
                "position": {"x": 10, "y": 0},
                "config": {"aggregationType": "sum"},
            },
            {
                "id": "n3",
                "type": "llm",
                "position": {"x": 20, "y": 0},
                "config": {"mode": "mock", "systemPrompt": "helpful"},
            },
            {
                "id": "n4",
                "type": "imageProcessing",
                "position": {"x": 30, "y": 0},
                "config": {"operation": "grayscale", "outputPath": "out.png"},
            },
        ],
        "edges": [
            {
                "id": "e1",
                "source": {"node_id": "n1", "port": "start"},
                "target": {"node_id": "n2", "port": "data1"},
            },
            {
                "id": "e2",
                "source": {"node_id": "n2", "port": "aggregated"},
                "target": {"node_id": "n3", "port": "prompt"},
            },
        ],
    }

    response = client.post("/pipelines/validate", json=pipeline)
    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is True
