# Frontend

Pipeline builder UI for mini-sagemaker v1.

## Run

```bash
npm install
npm start
```

By default it calls `http://127.0.0.1:8000`.

Use `REACT_APP_API_BASE` to override backend URL.

## Docker

Use root compose file:

```bash
docker compose up --build
```

## Test

```bash
CI=true npm test -- --watch=false
```
