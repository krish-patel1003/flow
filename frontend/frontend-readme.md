# Frontend

Pipeline builder UI for mini-sagemaker v1.

## Run

```bash
npm install
npm start
```

By default it calls `http://127.0.0.1:8000`.

Use `REACT_APP_API_BASE` to override backend URL.

## Supported v1 nodes

- `Manual Trigger`
- `File Source`
- `Python Transform`
- `File Sink`
- `Text`
- `Math`
- `Conditional`
- `API Request`
- `LLM`
- `Image Processing`
- `Data Aggregation`

Other nodes intentionally disabled with "Coming soon": `Input`, `Output`.

## Demo templates

Toolbar includes a `Load Demo Pipeline` dropdown with ready-to-run templates.
Default output paths point to `backend/.runs/demo/`.

`Aggregate + LLM` demo uses backend defaults for Ollama base URL.
Set backend env var `OLLAMA_BASE_URL` to control endpoint.

Additional large-data ETL demos:

- `ETL Chunked CSV (Large)`
- `ETL Incremental Watermark`
- `ETL API Chained (Cars)`

Both demos load config/data from `backend/.runs/demo/*` so they work in both local and Docker runs.

Run Monitor supports per-node output preview for `file_sink` nodes after a run.

## Docker

Use root compose file:

```bash
docker compose up --build
```

Frontend runs on `http://localhost:3000`.

## Test

```bash
CI=true npm test -- --watch=false
```
