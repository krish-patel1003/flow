from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def run_transform_script(script: str, input_data, timeout_seconds: int, workdir: Path) -> tuple[object, str]:
    runner_script = workdir / "_transform_runner.py"
    payload_path = workdir / "_transform_payload.json"
    result_path = workdir / "_transform_result.json"

    payload_path.write_text(json.dumps({"input": input_data, "script": script}))
    runner_script.write_text(
        """
import json
import traceback
from pathlib import Path

payload = json.loads(Path('_transform_payload.json').read_text())
scope = {}
logs = []
try:
    exec(payload['script'], scope)
    fn = scope.get('transform')
    if not callable(fn):
        raise ValueError('Script must define transform(input_data)')
    output = fn(payload['input'])
    Path('_transform_result.json').write_text(json.dumps({'ok': True, 'output': output}))
except Exception as exc:
    Path('_transform_result.json').write_text(json.dumps({'ok': False, 'error': str(exc), 'traceback': traceback.format_exc()}))
""".strip()
    )

    completed = subprocess.run(
        [sys.executable, str(runner_script.name)],
        cwd=workdir,
        capture_output=True,
        text=True,
        timeout=timeout_seconds,
        check=False,
    )

    if not result_path.exists():
        raise RuntimeError(f"Transform process failed: {completed.stderr.strip()}")

    result = json.loads(result_path.read_text())
    if not result.get("ok"):
        raise RuntimeError(result.get("traceback") or result.get("error") or "Transform failed")
    return result.get("output"), (completed.stdout or "") + (completed.stderr or "")
