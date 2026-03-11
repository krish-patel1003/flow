from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, FrozenSet


EXECUTABLE_NODE_TYPES: FrozenSet[str] = frozenset(
    {
        "manual_trigger",
        "file_source",
        "python_transform",
        "file_sink",
        "text",
        "math",
        "conditional",
        "api",
        "llm",
        "imageProcessing",
        "dataAggregation",
    }
)


COMING_SOON_NODE_TYPES: FrozenSet[str] = frozenset(
    {
        "customInput",
        "customOutput",
    }
)


@dataclass(frozen=True)
class NodePorts:
    inputs: FrozenSet[str]
    outputs: FrozenSet[str]


@dataclass(frozen=True)
class NodeSpec:
    type: str
    label: str
    executable: bool
    inputs: tuple[tuple[str, str], ...]
    outputs: tuple[tuple[str, str], ...]
    defaults: dict


NODE_PORTS: Dict[str, NodePorts] = {
    "manual_trigger": NodePorts(inputs=frozenset(), outputs=frozenset({"start"})),
    "file_source": NodePorts(inputs=frozenset({"trigger"}), outputs=frozenset({"data"})),
    "python_transform": NodePorts(inputs=frozenset({"input"}), outputs=frozenset({"output"})),
    "file_sink": NodePorts(inputs=frozenset({"input"}), outputs=frozenset()),
    "text": NodePorts(inputs=frozenset({"input"}), outputs=frozenset({"text"})),
    "math": NodePorts(inputs=frozenset({"num1", "num2"}), outputs=frozenset({"result"})),
    "conditional": NodePorts(inputs=frozenset({"value1", "value2"}), outputs=frozenset({"true", "false"})),
    "api": NodePorts(inputs=frozenset({"payload"}), outputs=frozenset({"response"})),
    "llm": NodePorts(inputs=frozenset({"system", "prompt"}), outputs=frozenset({"response"})),
    "imageProcessing": NodePorts(inputs=frozenset({"image"}), outputs=frozenset({"processed"})),
    "dataAggregation": NodePorts(
        inputs=frozenset({"data1", "data2", "data3"}), outputs=frozenset({"aggregated"})
    ),
}


ALL_NODE_TYPES: FrozenSet[str] = frozenset(set(EXECUTABLE_NODE_TYPES) | set(COMING_SOON_NODE_TYPES))


NODE_SPECS: tuple[NodeSpec, ...] = (
    NodeSpec(
        type="manual_trigger",
        label="Manual Trigger",
        executable=True,
        inputs=tuple(),
        outputs=(("start", "any"),),
        defaults={},
    ),
    NodeSpec(
        type="file_source",
        label="File Source",
        executable=True,
        inputs=(("trigger", "any"),),
        outputs=(("data", "any"),),
        defaults={"path": "", "mode": "text"},
    ),
    NodeSpec(
        type="python_transform",
        label="Python Transform",
        executable=True,
        inputs=(("input", "any"),),
        outputs=(("output", "any"),),
        defaults={"script": "def transform(input_data):\n    return input_data", "timeout_seconds": 5},
    ),
    NodeSpec(
        type="file_sink",
        label="File Sink",
        executable=True,
        inputs=(("input", "any"),),
        outputs=tuple(),
        defaults={"path": "", "mode": "text"},
    ),
    NodeSpec(
        type="text",
        label="Text",
        executable=True,
        inputs=(("input", "any"),),
        outputs=(("text", "text"),),
        defaults={"template": "{{input}}"},
    ),
    NodeSpec(
        type="math",
        label="Math",
        executable=True,
        inputs=(("num1", "number"), ("num2", "number")),
        outputs=(("result", "number"),),
        defaults={"operation": "add"},
    ),
    NodeSpec(
        type="conditional",
        label="Conditional",
        executable=True,
        inputs=(("value1", "any"), ("value2", "any")),
        outputs=(("true", "any"), ("false", "any")),
        defaults={"operator": "=="},
    ),
    NodeSpec(
        type="api",
        label="API Request",
        executable=True,
        inputs=(("payload", "any"),),
        outputs=(("response", "json"),),
        defaults={"method": "GET", "url": "", "timeout_seconds": 10},
    ),
    NodeSpec(
        type="customInput",
        label="Input",
        executable=False,
        inputs=tuple(),
        outputs=(("value", "any"),),
        defaults={},
    ),
    NodeSpec(
        type="customOutput",
        label="Output",
        executable=False,
        inputs=(("value", "any"),),
        outputs=tuple(),
        defaults={},
    ),
    NodeSpec(
        type="llm",
        label="LLM",
        executable=True,
        inputs=(("system", "text"), ("prompt", "text")),
        outputs=(("response", "text"),),
        defaults={"mode": "mock", "systemPrompt": "", "temperature": 0.2},
    ),
    NodeSpec(
        type="imageProcessing",
        label="Image Processing",
        executable=True,
        inputs=(("image", "image"),),
        outputs=(("processed", "image"),),
        defaults={"operation": "grayscale", "outputPath": ""},
    ),
    NodeSpec(
        type="dataAggregation",
        label="Data Aggregation",
        executable=True,
        inputs=(("data1", "any"), ("data2", "any"), ("data3", "any")),
        outputs=(("aggregated", "any"),),
        defaults={"aggregationType": "sum", "values": []},
    ),
)
