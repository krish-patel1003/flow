from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, FrozenSet


EXECUTABLE_NODE_TYPES: FrozenSet[str] = frozenset(
    {"manual_trigger", "file_source", "python_transform", "file_sink"}
)


COMING_SOON_NODE_TYPES: FrozenSet[str] = frozenset(
    {
        "customInput",
        "customOutput",
        "llm",
        "text",
        "math",
        "imageProcessing",
        "dataAggregation",
        "conditional",
        "api",
    }
)


@dataclass(frozen=True)
class NodePorts:
    inputs: FrozenSet[str]
    outputs: FrozenSet[str]


NODE_PORTS: Dict[str, NodePorts] = {
    "manual_trigger": NodePorts(inputs=frozenset(), outputs=frozenset({"start"})),
    "file_source": NodePorts(inputs=frozenset({"trigger"}), outputs=frozenset({"data"})),
    "python_transform": NodePorts(inputs=frozenset({"input"}), outputs=frozenset({"output"})),
    "file_sink": NodePorts(inputs=frozenset({"input"}), outputs=frozenset()),
}


ALL_NODE_TYPES: FrozenSet[str] = frozenset(set(EXECUTABLE_NODE_TYPES) | set(COMING_SOON_NODE_TYPES))
