from __future__ import annotations

from typing import Any, Dict, List, Literal, Union

from pydantic import BaseModel, ConfigDict, Field

from .registry import ALL_NODE_TYPES


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None
    node_id: str | None = None
    edge_id: str | None = None


class EndpointRef(BaseModel):
    node_id: str
    port: str


class Position(BaseModel):
    x: float
    y: float


class ManualTriggerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")


class FileSourceConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    mode: Literal["text", "json"] = "text"


class PythonTransformConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    script: str
    timeout_seconds: int = Field(default=5, ge=1, le=30)


class FileSinkConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    mode: Literal["text", "json"] = "text"


NodeType = Literal[
    "manual_trigger",
    "file_source",
    "python_transform",
    "file_sink",
    "customInput",
    "customOutput",
    "llm",
    "text",
    "math",
    "imageProcessing",
    "dataAggregation",
    "conditional",
    "api",
]


NodeConfig = Union[ManualTriggerConfig, FileSourceConfig, PythonTransformConfig, FileSinkConfig, Dict[str, Any]]


class PipelineNode(BaseModel):
    id: str
    type: NodeType
    position: Position
    config: Dict[str, Any] = Field(default_factory=dict)


class PipelineEdge(BaseModel):
    id: str
    source: EndpointRef
    target: EndpointRef


class Pipeline(BaseModel):
    id: str
    name: str
    version: str = "v1"
    nodes: List[PipelineNode]
    edges: List[PipelineEdge]


class ValidationResponse(BaseModel):
    valid: bool
    errors: List[ErrorDetail]


class RunCreateRequest(BaseModel):
    pipeline: Pipeline


class NodeRunState(BaseModel):
    status: Literal["pending", "running", "succeeded", "failed"]
    started_at: str | None = None
    finished_at: str | None = None
    error: str | None = None


class RunStatusResponse(BaseModel):
    run_id: str
    status: Literal["pending", "running", "succeeded", "failed"]
    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
    pipeline_id: str
    node_states: Dict[str, NodeRunState]


def is_known_node_type(node_type: str) -> bool:
    return node_type in ALL_NODE_TYPES
