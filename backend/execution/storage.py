from __future__ import annotations

import json
from pathlib import Path


def ensure_run_paths(base_dir: Path, run_id: str) -> dict[str, Path]:
    run_root = base_dir / run_id
    logs = run_root / "logs"
    artifacts = run_root / "artifacts"
    run_root.mkdir(parents=True, exist_ok=True)
    logs.mkdir(parents=True, exist_ok=True)
    artifacts.mkdir(parents=True, exist_ok=True)
    return {
        "run_root": run_root,
        "logs": logs,
        "artifacts": artifacts,
        "run_json": run_root / "run.json",
        "manifest": artifacts / "manifest.json",
    }


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, indent=2))
