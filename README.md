## mini-sagemaker v1

Local, single-user, single-run pipeline execution demo.

### v1 node types

- `manual_trigger`
- `file_source`
- `python_transform` (inline script)
- `file_sink`

The UI still shows additional nodes as disabled with "Coming soon".

## Project structure

- `backend/` FastAPI API, validation, execution engine, tests
- `frontend/` React + React Flow pipeline builder
- `docs/v1-scope.md` current v1 behavior and limits

## Docker setup (recommended quick start)

From repository root:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`

Stop services:

```bash
docker compose down
```

Notes:

- Backend run outputs are persisted to `backend/.runs/` on the host.
- Frontend calls backend via `REACT_APP_API_BASE=http://localhost:8000` in compose.

## Backend setup

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

Run API:

```bash
.venv/bin/python -m uvicorn backend.main:app --reload
```

Run backend tests:

```bash
.venv/bin/python -m pytest backend/tests
```

## Frontend setup

```bash
cd frontend
npm install
npm start
```

Optional API URL override:

- `REACT_APP_API_BASE` (default: `http://127.0.0.1:8000`)

Run frontend tests:

```bash
cd frontend
CI=true npm test -- --watch=false
```

## Normalized pipeline schema

```json
{
  "id": "pipe-1",
  "name": "Demo",
  "version": "v1",
  "nodes": [
    {
      "id": "n1",
      "type": "manual_trigger",
      "position": { "x": 0, "y": 0 },
      "config": {}
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": { "node_id": "n1", "port": "start" },
      "target": { "node_id": "n2", "port": "trigger" }
    }
  ]
}
```

## API endpoints

- `POST /pipelines/validate` validate schema + graph + ports + config
- `POST /runs` create and execute one run synchronously
- `GET /runs/{run_id}` fetch run status and node states
- `GET /runs/{run_id}/logs/{node_id}` fetch node logs
- `GET /runs/{run_id}/artifacts` fetch artifact manifest

## Run outputs

Run data is persisted in:

- `backend/.runs/<run_id>/run.json`
- `backend/.runs/<run_id>/logs/*.log`
- `backend/.runs/<run_id>/artifacts/manifest.json`

If `RUNS_DIR` is set, that directory is used instead.
