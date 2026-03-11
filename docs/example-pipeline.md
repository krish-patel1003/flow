# Example pipeline

This is a minimal working v1 pipeline using all executable node types.

## Graph

- `manual_trigger` -> `file_source` -> `python_transform` -> `file_sink`

Port mapping:

- `manual_trigger.start -> file_source.trigger`
- `file_source.data -> python_transform.input`
- `python_transform.output -> file_sink.input`

## Example payload

```json
{
  "id": "pipe-demo",
  "name": "Demo Uppercase Pipeline",
  "version": "v1",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "manual_trigger",
      "position": { "x": 0, "y": 0 },
      "config": {}
    },
    {
      "id": "source-1",
      "type": "file_source",
      "position": { "x": 180, "y": 0 },
      "config": {
        "path": "/tmp/mini-sagemaker/input.txt",
        "mode": "text"
      }
    },
    {
      "id": "transform-1",
      "type": "python_transform",
      "position": { "x": 380, "y": 0 },
      "config": {
        "script": "def transform(input_data):\\n    return str(input_data).upper()",
        "timeout_seconds": 5
      }
    },
    {
      "id": "sink-1",
      "type": "file_sink",
      "position": { "x": 600, "y": 0 },
      "config": {
        "path": "/tmp/mini-sagemaker/output.txt",
        "mode": "text"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": { "node_id": "trigger-1", "port": "start" },
      "target": { "node_id": "source-1", "port": "trigger" }
    },
    {
      "id": "e2",
      "source": { "node_id": "source-1", "port": "data" },
      "target": { "node_id": "transform-1", "port": "input" }
    },
    {
      "id": "e3",
      "source": { "node_id": "transform-1", "port": "output" },
      "target": { "node_id": "sink-1", "port": "input" }
    }
  ]
}
```

## Run with curl

Create input file:

```bash
mkdir -p /tmp/mini-sagemaker
printf "hello world" > /tmp/mini-sagemaker/input.txt
```

Validate pipeline:

```bash
curl -sS -X POST http://127.0.0.1:8000/pipelines/validate \
  -H "Content-Type: application/json" \
  -d @pipeline.json
```

Execute run:

```bash
curl -sS -X POST http://127.0.0.1:8000/runs \
  -H "Content-Type: application/json" \
  -d "{\"pipeline\":$(cat pipeline.json)}"
```

Check output:

```bash
cat /tmp/mini-sagemaker/output.txt
```

Expected content:

```text
HELLO WORLD
```

## Extended example (text + api)

You can also run:

- `manual_trigger -> text -> api -> file_sink`

Text node template example:

```text
status={{input}}
```

API node config example:

```json
{
  "method": "GET",
  "url": "https://httpbin.org/get",
  "timeout_seconds": 10
}
```
