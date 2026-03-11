from __future__ import annotations

import json
import os
from pathlib import Path
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest

from PIL import Image, ImageFilter

from .safe_exec import run_transform_script


def execute_manual_trigger(node_config: dict, incoming_data):
    return incoming_data


def execute_file_source(node_config: dict, incoming_data):
    path = Path(node_config["path"])
    mode = node_config.get("mode", "text")
    raw = path.read_text()
    if mode == "json":
        body = raw.strip()
        if not body:
            return {}
        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            snippet = body[:120].replace("\n", " ")
            raise ValueError(f"Invalid JSON in file_source path '{path}': {exc.msg}. Starts with: {snippet}") from exc
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
        if isinstance(incoming_data, (dict, list)):
            path.write_text(json.dumps(incoming_data, indent=2))
        else:
            path.write_text(str(incoming_data))
    return str(path)


def execute_text(node_config: dict, incoming_data):
    template = node_config.get("template", "{{input}}")
    rendered = template
    if isinstance(incoming_data, dict):
        for key, value in incoming_data.items():
            rendered = rendered.replace(f"{{{{{key}}}}}", str(value))
    rendered = rendered.replace("{{input}}", "" if incoming_data is None else str(incoming_data))
    return rendered


def execute_math(node_config: dict, incoming_data):
    operation = node_config.get("operation", "add")
    num1 = 0.0
    num2 = 0.0
    if isinstance(incoming_data, list):
        if len(incoming_data) >= 1:
            num1 = float(incoming_data[0])
        if len(incoming_data) >= 2:
            num2 = float(incoming_data[1])
    elif incoming_data is not None:
        num1 = float(incoming_data)

    if operation == "add":
        return num1 + num2
    if operation == "subtract":
        return num1 - num2
    if operation == "multiply":
        return num1 * num2
    if operation == "divide":
        if num2 == 0:
            raise ValueError("Division by zero")
        return num1 / num2
    raise ValueError(f"Unsupported math operation: {operation}")


def execute_conditional(node_config: dict, incoming_data):
    operator = node_config.get("operator", "==")
    left = None
    right = None
    if isinstance(incoming_data, list):
        if len(incoming_data) >= 1:
            left = incoming_data[0]
        if len(incoming_data) >= 2:
            right = incoming_data[1]
    else:
        left = incoming_data

    if operator == "==":
        return left == right
    if operator == "!=":
        return left != right
    if left is None or right is None:
        raise ValueError("Conditional node requires two input values")

    if operator == ">":
        return float(left) > float(right)
    if operator == "<":
        return float(left) < float(right)
    if operator == ">=":
        return float(left) >= float(right)
    if operator == "<=":
        return float(left) <= float(right)
    raise ValueError(f"Unsupported conditional operator: {operator}")


def execute_api_request(node_config: dict, incoming_data):
    method = node_config.get("method", "GET").upper()
    url = node_config["url"]
    headers = node_config.get("headers", {})
    body = node_config.get("body")
    timeout = int(node_config.get("timeout_seconds", 10))

    if method == "GET" and isinstance(incoming_data, dict) and incoming_data:
        query_string = urlparse.urlencode(incoming_data, doseq=True)
        joiner = "&" if "?" in url else "?"
        url = f"{url}{joiner}{query_string}"

    request_body = None
    if method in {"POST", "PUT", "PATCH", "DELETE"}:
        if body is not None:
            request_body = body.encode("utf-8")
        elif incoming_data is not None:
            request_body = json.dumps(incoming_data).encode("utf-8")
            headers = {"Content-Type": "application/json", **headers}

    req = urlrequest.Request(url=url, method=method, headers=headers, data=request_body)
    try:
        with urlrequest.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
            content_type = response.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return json.loads(raw)
            return {"status": response.status, "body": raw}
    except urlerror.HTTPError as exc:
        detail = exc.read().decode("utf-8") if exc.fp else str(exc)
        raise RuntimeError(f"API request failed: {exc.code} {detail}") from exc
    except urlerror.URLError as exc:
        raise RuntimeError(f"API request error: {exc.reason}") from exc


def execute_llm(node_config: dict, incoming_data):
    mode = node_config.get("mode", "mock")
    system_prompt = node_config.get("systemPrompt", "")
    prompt_text = incoming_data
    if isinstance(incoming_data, list):
        prompt_text = "\n".join(str(item) for item in incoming_data)

    if mode == "echo":
        return f"{prompt_text}"

    if mode == "ollama":
        configured_base_url = str(node_config.get("baseUrl") or "").strip().rstrip("/")
        default_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        legacy_local_defaults = {"http://127.0.0.1:11434", "http://localhost:11434"}
        if not configured_base_url:
            base_url = default_base_url
        elif configured_base_url in legacy_local_defaults and "OLLAMA_BASE_URL" in os.environ:
            base_url = default_base_url
        else:
            base_url = configured_base_url
        model = node_config.get("model", "llama3.2:1b")
        payload = {
            "model": model,
            "stream": False,
            "prompt": str(prompt_text),
            "system": str(system_prompt),
            "options": {"temperature": float(node_config.get("temperature", 0.2))},
        }
        req = urlrequest.Request(
            url=f"{base_url}/api/generate",
            method="POST",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload).encode("utf-8"),
        )
        try:
            with urlrequest.urlopen(req, timeout=60) as response:
                raw = response.read().decode("utf-8")
                parsed = json.loads(raw)
                return parsed.get("response", "")
        except urlerror.URLError as exc:
            raise RuntimeError(f"Ollama request failed: {exc.reason}") from exc

    return f"Mock LLM response: [{system_prompt}] {prompt_text}"


def execute_data_aggregation(node_config: dict, incoming_data):
    aggregation_type = node_config.get("aggregationType", "sum")
    values = list(node_config.get("values", []))
    if isinstance(incoming_data, list):
        values.extend(incoming_data)
    elif incoming_data is not None:
        values.append(incoming_data)

    if aggregation_type == "concat":
        return "".join(str(value) for value in values)

    numeric_values = [float(value) for value in values]
    if not numeric_values:
        return 0
    if aggregation_type == "sum":
        return sum(numeric_values)
    if aggregation_type == "average":
        return sum(numeric_values) / len(numeric_values)
    if aggregation_type == "max":
        return max(numeric_values)
    if aggregation_type == "min":
        return min(numeric_values)
    raise ValueError(f"Unsupported aggregation type: {aggregation_type}")


def execute_image_processing(node_config: dict, incoming_data):
    operation = node_config.get("operation", "grayscale")
    output_path = Path(node_config["outputPath"])

    if isinstance(incoming_data, dict) and incoming_data.get("path"):
        input_path = Path(incoming_data["path"])
    else:
        input_path = Path(str(incoming_data))

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(input_path) as img:
        if operation == "grayscale":
            processed = img.convert("L")
        elif operation == "blur":
            processed = img.filter(ImageFilter.BLUR)
        elif operation == "sharpen":
            processed = img.filter(ImageFilter.SHARPEN)
        else:
            raise ValueError(f"Unsupported image operation: {operation}")
        processed.save(output_path)

    return {"path": str(output_path), "operation": operation}
