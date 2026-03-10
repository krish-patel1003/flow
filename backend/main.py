from __future__ import annotations

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from .execution import RunManager
from .schemas import Pipeline, RunCreateRequest, ValidationResponse
from .validation import validate_pipeline


app = FastAPI(title="mini-sagemaker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

run_manager = RunManager()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"service": "mini-sagemaker", "status": "ok"}


@app.post("/pipelines/validate", response_model=ValidationResponse)
def validate_pipeline_endpoint(pipeline: Pipeline) -> ValidationResponse:
    errors = validate_pipeline(pipeline)
    return ValidationResponse(valid=len(errors) == 0, errors=errors)


@app.post("/pipelines/parse", response_model=ValidationResponse)
def parse_pipeline_legacy_endpoint(pipeline: Pipeline) -> ValidationResponse:
    errors = validate_pipeline(pipeline)
    return ValidationResponse(valid=len(errors) == 0, errors=errors)


@app.post("/runs")
def create_run(request: RunCreateRequest) -> dict[str, str]:
    errors = validate_pipeline(request.pipeline)
    if errors:
        raise HTTPException(status_code=400, detail=[error.model_dump() for error in errors])
    try:
        run_id = run_manager.create_and_run(request.pipeline)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"run_id": run_id}


@app.get("/runs/{run_id}")
def get_run_status(run_id: str):
    status = run_manager.get_status_response(run_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return status


@app.get("/runs/{run_id}/logs/{node_id}")
def get_node_logs(run_id: str, node_id: str) -> Response:
    text = run_manager.get_log_text(run_id, node_id)
    if text is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return Response(content=text, media_type="text/plain")


@app.get("/runs/{run_id}/artifacts")
def get_run_artifacts(run_id: str):
    artifacts = run_manager.get_artifacts(run_id)
    if artifacts is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return artifacts
