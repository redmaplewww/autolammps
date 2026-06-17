"""Manifest helpers for OVITO post-processing scripts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def write_manifest(manifest: Dict[str, Any], output_dir: str | Path) -> Path:
    """Write render_manifest.json and return its path."""
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "render_manifest.json"
    path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return path


def default_manifest(
    input_file: str, output_dir: str | Path, frame: int
) -> Dict[str, Any]:
    """Create the base manifest structure used by all scripts."""
    return {
        "input_file": str(input_file),
        "output_dir": str(output_dir),
        "frame": frame,
        "views": [],
        "modifiers": [],
        "renderer": None,
        "image_size": None,
        "color_policy": {
            "mode": "ovito_default",
            "custom_colors": False,
        },
        "fallbacks": [],
    }
