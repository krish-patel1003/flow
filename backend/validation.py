from __future__ import annotations

from collections import defaultdict, deque
from typing import Dict, List, Set

from pydantic import ValidationError

from .registry import EXECUTABLE_NODE_TYPES, NODE_PORTS
from .schemas import (
    APIRequestConfig,
    ConditionalConfig,
    DataAggregationConfig,
    ErrorDetail,
    FileSinkConfig,
    FileSourceConfig,
    FilterConfig,
    ImageProcessingConfig,
    LLMConfig,
    MathConfig,
    NotificationConfig,
    Pipeline,
    PythonTransformConfig,
    JsonExtractConfig,
    JoinMergeConfig,
    SchemaValidateConfig,
    TextConfig,
)


def _validate_node_config(node_type: str, config: dict, node_id: str) -> list[ErrorDetail]:
    try:
        if node_type == "manual_trigger":
            if config:
                return [
                    ErrorDetail(
                        code="invalid_node_config",
                        message="manual_trigger does not accept config",
                        node_id=node_id,
                        field="config",
                    )
                ]
            return []
        if node_type == "file_source":
            FileSourceConfig.model_validate(config)
            return []
        if node_type == "python_transform":
            PythonTransformConfig.model_validate(config)
            return []
        if node_type == "file_sink":
            FileSinkConfig.model_validate(config)
            return []
        if node_type == "text":
            TextConfig.model_validate(config)
            return []
        if node_type == "math":
            MathConfig.model_validate(config)
            return []
        if node_type == "conditional":
            ConditionalConfig.model_validate(config)
            return []
        if node_type == "api":
            APIRequestConfig.model_validate(config)
            return []
        if node_type == "llm":
            LLMConfig.model_validate(config)
            return []
        if node_type == "imageProcessing":
            ImageProcessingConfig.model_validate(config)
            return []
        if node_type == "dataAggregation":
            DataAggregationConfig.model_validate(config)
            return []
        if node_type == "json_extract":
            JsonExtractConfig.model_validate(config)
            return []
        if node_type == "join_merge":
            JoinMergeConfig.model_validate(config)
            return []
        if node_type == "schema_validate":
            SchemaValidateConfig.model_validate(config)
            return []
        if node_type == "filter":
            FilterConfig.model_validate(config)
            return []
        if node_type == "notification":
            NotificationConfig.model_validate(config)
            return []
    except ValidationError as exc:
        first = exc.errors()[0]
        loc = first.get("loc", [])
        field = "config" if not loc else f"config.{'.'.join(str(v) for v in loc)}"
        return [
            ErrorDetail(
                code="invalid_node_config",
                message=first.get("msg", "Invalid config"),
                node_id=node_id,
                field=field,
            )
        ]
    return []


def _has_cycle(node_ids: Set[str], adjacency: Dict[str, List[str]]) -> bool:
    indegree = {node_id: 0 for node_id in node_ids}
    for src in adjacency:
        for dst in adjacency[src]:
            indegree[dst] += 1

    queue = deque([node for node, deg in indegree.items() if deg == 0])
    visited = 0
    while queue:
        current = queue.popleft()
        visited += 1
        for nxt in adjacency.get(current, []):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return visited != len(node_ids)


def validate_pipeline(pipeline: Pipeline) -> list[ErrorDetail]:
    errors: list[ErrorDetail] = []
    nodes_by_id = {n.id: n for n in pipeline.nodes}

    if len(nodes_by_id) != len(pipeline.nodes):
        errors.append(ErrorDetail(code="duplicate_node_id", message="Node IDs must be unique", field="nodes"))
        return errors

    for node in pipeline.nodes:
        if node.type not in EXECUTABLE_NODE_TYPES:
            errors.append(
                ErrorDetail(
                    code="node_type_not_supported",
                    message=f"Node type '{node.type}' is not supported in v1 execution",
                    node_id=node.id,
                    field="type",
                )
            )
            continue
        errors.extend(_validate_node_config(node.type, node.config, node.id))

    adjacency: dict[str, list[str]] = defaultdict(list)
    for edge in pipeline.edges:
        src_node = nodes_by_id.get(edge.source.node_id)
        tgt_node = nodes_by_id.get(edge.target.node_id)

        if src_node is None:
            errors.append(
                ErrorDetail(
                    code="unknown_source_node",
                    message=f"Source node '{edge.source.node_id}' not found",
                    edge_id=edge.id,
                    field="source.node_id",
                )
            )
            continue
        if tgt_node is None:
            errors.append(
                ErrorDetail(
                    code="unknown_target_node",
                    message=f"Target node '{edge.target.node_id}' not found",
                    edge_id=edge.id,
                    field="target.node_id",
                )
            )
            continue

        src_ports = NODE_PORTS.get(src_node.type)
        tgt_ports = NODE_PORTS.get(tgt_node.type)
        if src_ports and edge.source.port not in src_ports.outputs:
            errors.append(
                ErrorDetail(
                    code="invalid_source_port",
                    message=f"Port '{edge.source.port}' is not an output for '{src_node.type}'",
                    edge_id=edge.id,
                    node_id=src_node.id,
                    field="source.port",
                )
            )
        if tgt_ports and edge.target.port not in tgt_ports.inputs:
            errors.append(
                ErrorDetail(
                    code="invalid_target_port",
                    message=f"Port '{edge.target.port}' is not an input for '{tgt_node.type}'",
                    edge_id=edge.id,
                    node_id=tgt_node.id,
                    field="target.port",
                )
            )

        adjacency[edge.source.node_id].append(edge.target.node_id)

    if not errors and _has_cycle(set(nodes_by_id.keys()), adjacency):
        errors.append(ErrorDetail(code="cycle_detected", message="Pipeline graph contains a cycle", field="edges"))

    return errors
