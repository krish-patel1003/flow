from __future__ import annotations

import json
import subprocess
import sys
from uuid import uuid4
from pathlib import Path


def run_transform_script(script: str, input_data, timeout_seconds: int, workdir: Path) -> tuple[object, str]:
    run_dir = workdir / f"_transform_{uuid4().hex}"
    run_dir.mkdir(parents=True, exist_ok=True)

    runner_script = run_dir / "runner.py"
    payload_path = run_dir / "payload.json"
    result_path = run_dir / "result.json"

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
    Path('result.json').write_text(json.dumps({'ok': True, 'output': output}))
except Exception as exc:
    Path('result.json').write_text(json.dumps({'ok': False, 'error': str(exc), 'traceback': traceback.format_exc()}))
""".replace("_transform_payload.json", "payload.json").strip()
    )

    completed = subprocess.run(
        [sys.executable, str(runner_script.name)],
        cwd=run_dir,
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
