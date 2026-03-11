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

    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class FileSourceConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    mode: Literal["text", "json"] = "text"
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class PythonTransformConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    script: str
    timeout_seconds: int = Field(default=5, ge=1, le=30)
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class FileSinkConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    mode: Literal["text", "json"] = "text"
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class TextConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    template: str = "{{input}}"
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class MathConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: Literal["add", "subtract", "multiply", "divide"] = "add"
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class ConditionalConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operator: Literal["==", "!=", ">", "<", ">=", "<="] = "=="
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class APIRequestConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"] = "GET"
    url: str
    headers: Dict[str, str] = Field(default_factory=dict)
    body: str | None = None
    timeout_seconds: int = Field(default=10, ge=1, le=60)
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class LLMConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["mock", "echo", "ollama"] = "mock"
    systemPrompt: str = ""
    model: str = "llama3.2:1b"
    baseUrl: str | None = None
    temperature: float = Field(default=0.2, ge=0, le=2)
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class ImageProcessingConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation: Literal["grayscale", "blur", "sharpen"] = "grayscale"
    outputPath: str
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


class DataAggregationConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    aggregationType: Literal["sum", "average", "max", "min", "concat"] = "sum"
    values: List[Any] = Field(default_factory=list)
    retries: int = Field(default=0, ge=0, le=3)
    retry_backoff_seconds: float = Field(default=0, ge=0, le=10)


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


NodeConfig = Union[
    ManualTriggerConfig,
    FileSourceConfig,
    PythonTransformConfig,
    FileSinkConfig,
    TextConfig,
    MathConfig,
    ConditionalConfig,
    APIRequestConfig,
    LLMConfig,
    ImageProcessingConfig,
    DataAggregationConfig,
    Dict[str, Any],
]


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
    status: Literal["pending", "running", "succeeded", "failed", "cancelled"]
    attempts: int = 0
    started_at: str | None = None
    finished_at: str | None = None
    error: str | None = None


class RunStatusResponse(BaseModel):
    run_id: str
    status: Literal["pending", "running", "succeeded", "failed", "cancelled"]
    created_at: str
    started_at: str | None = None
    finished_at: str | None = None
    pipeline_id: str
    node_states: Dict[str, NodeRunState]


class RunsListResponse(BaseModel):
    runs: List[RunStatusResponse]


class NodeRegistryEntry(BaseModel):
    type: str
    label: str
    executable: bool
    inputs: List[Dict[str, str]]
    outputs: List[Dict[str, str]]
    defaults: Dict[str, Any] = Field(default_factory=dict)


class NodeRegistryResponse(BaseModel):
    nodes: List[NodeRegistryEntry]


def is_known_node_type(node_type: str) -> bool:
    return node_type in ALL_NODE_TYPES
