# mini-sagemaker v1

Local, single-user pipeline runner with a visual editor and FastAPI backend.

Currently executable nodes:

- `manual_trigger`
- `scheduler_trigger`
- `webhook_trigger`
- `file_source`
- `python_transform` (inline Python script)
- `file_sink`
- `text`
- `math`
- `conditional`
- `api`
- `llm` (mock/echo)
- `imageProcessing`
- `dataAggregation`
- `json_extract`
- `join_merge`
- `schema_validate`
- `filter`
- `notification`

The UI still shows `customInput` and `customOutput` as "Coming soon".

## Quick start (Docker)

From repository root:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

Stop services:

```bash
docker compose down
```

## Quick start (local)

Backend:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
.venv/bin/python -m uvicorn backend.main:app --reload
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm start
```

Optional frontend env:

- `REACT_APP_API_BASE` (default: `http://127.0.0.1:8000`)

## Example pipeline (UI)

1. Add nodes: `Manual Trigger` -> `File Source` -> `Python Transform` -> `File Sink`
2. Connect ports:
   - `start -> trigger`
   - `data -> input`
   - `output -> input`
3. Use config:
   - `File Source`: path to input file, mode `text`
   - `Python Transform`: `def transform(input_data): return str(input_data).upper()`
   - `File Sink`: output path, mode `text`
4. Click `Submit Pipeline`

Detailed API and payload examples: `docs/example-pipeline.md`.

## Quick demo templates

Use the `Load Demo Pipeline` dropdown in the toolbar to prefill one of these graphs:

- `Uppercase File`
- `API JSON Save`
- `Parallel Branch`
- `Aggregate + LLM`
- `Public CSV ETL`
- `ETL Chunked CSV (Large)`
- `ETL Incremental Watermark`
- `ETL API Chained (Cars)`
- `Scheduled Ops Heartbeat`
- `Webhook Lead Qualification`
- `Webhook Order Validation`

Most templates write outputs to `backend/.runs/demo/*` by default.
Large ETL templates also read sample config/data from `backend/.runs/demo/*`.

`Aggregate + LLM` uses Ollama mode by default (`llama3.2:1b`).
The LLM base URL now defaults to backend env var `OLLAMA_BASE_URL`
(fallback: `http://127.0.0.1:11434`). In Docker Compose, this is set to
`http://host.docker.internal:11434` so the backend container can reach host Ollama.

## API endpoints

- `POST /pipelines/validate` validate schema + graph + ports + config
- `POST /runs` start a run asynchronously (`{"pipeline": ...}`)
- `GET /runs` list runs
- `POST /runs/{run_id}/cancel` request cancellation
- `GET /runs/{run_id}` run status + per-node states
- `GET /runs/{run_id}/logs/{node_id}` node log text
- `GET /runs/{run_id}/artifacts` run artifact manifest
- `GET /registry/nodes` list backend node registry metadata

## Run outputs

Each run persists:

- `backend/.runs/<run_id>/run.json`
- `backend/.runs/<run_id>/logs/*.log`
- `backend/.runs/<run_id>/artifacts/manifest.json`

Set `RUNS_DIR` to override output location.

## Runtime controls

- Single active run at a time
- Parallel scheduling for ready DAG nodes (worker pool)
- Node-level retries with exponential backoff
- Cooperative cancellation (`POST /runs/{run_id}/cancel`)
- UI run monitor panel with node statuses, attempts, and per-node log fetch
- UI run monitor output preview for `file_sink` artifacts

Config keys supported on executable nodes:

- `retries` (default `0`)
- `retry_backoff_seconds` (default `0`)

Environment variables:

- `RUN_MAX_WORKERS` (default `2`)
- `RUNS_DIR` (custom run output directory)

## Repo layout

- `backend/` API, validation, execution engine, tests
- `frontend/` React + React Flow UI
- `docs/v1-scope.md` supported features and boundaries
- `docs/example-pipeline.md` concrete payload and curl examples

## Test commands

Backend:

```bash
.venv/bin/python -m pytest backend/tests
```

Frontend:

```bash
cd frontend
CI=true npm test -- --watch=false
```
