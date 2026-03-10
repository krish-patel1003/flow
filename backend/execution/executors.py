from __future__ import annotations

import json
from pathlib import Path

from .safe_exec import run_transform_script


def execute_manual_trigger(node_config: dict, incoming_data):
    return incoming_data


def execute_file_source(node_config: dict, incoming_data):
    path = Path(node_config["path"])
    mode = node_config.get("mode", "text")
    raw = path.read_text()
    if mode == "json":
        return json.loads(raw)
    return raw


def execute_python_transform(node_config: dict, incoming_data, working_dir: Path):
    timeout_seconds = int(node_config.get("timeout_seconds", 5))
    script = node_config["script"]
    return run_transform_script(script, incoming_data, timeout_seconds, working_dir)


def execute_file_sink(node_config: dict, incoming_data):
    path = Path(node_config["path"])
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = node_config.get("mode", "text")
    if mode == "json":
        path.write_text(json.dumps(incoming_data, indent=2))
    else:
        path.write_text(str(incoming_data))
    return str(path)
