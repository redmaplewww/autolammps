"""Shared OVITO rendering engine with deterministic standard views.

This module is intentionally conservative: it preserves OVITO default colors,
uses standard orthographic views, calls zoom_all when possible, and records a
manifest for every render.
"""

from __future__ import annotations

import argparse
import math
import os
from pathlib import Path
from typing import Any, Dict, Iterable, Tuple

try:
    from manifest_utils import default_manifest, write_manifest
except ImportError:  # Allows importing as scripts.render_engine from examples.
    from .manifest_utils import default_manifest, write_manifest


STANDARD_VIEWS = {
    "front": "Front",
    "side": "Left",
    "top": "Top",
}

EXTRA_VIEW_DIRECTIONS = {
    "iso": (-1.0, -1.0, -1.0),
    "diag_xy": (-1.0, -1.0, 0.0),
    "diag_xz": (-1.0, 0.0, -1.0),
}


class OvitoRenderEngine:
    """Small wrapper around OVITO import, standard view rendering, and manifesting."""

    def __init__(
        self,
        input_file: str,
        output_dir: str = "ovito_outputs",
        frame: int = -1,
        width: int = 2000,
        height: int = 1600,
        renderer: str = "tachyon",
    ) -> None:
        self.input_file = input_file
        self.output_dir = Path(output_dir)
        self.frame = frame
        self.width = width
        self.height = height
        self.renderer_name = renderer.lower()
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self._ovito: Dict[str, Any] = {}
        self.pipeline: Any = None
        self.manifest = default_manifest(input_file, self.output_dir, frame)
        self.manifest["image_size"] = [width, height]
        self._camera_records: Dict[str, Dict[str, Any]] = {}

    def load(self) -> None:
        """Import OVITO lazily and load the input file."""
        os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
        from ovito.io import import_file
        from ovito.vis import OpenGLRenderer, TachyonRenderer, Viewport

        self._ovito = {
            "Viewport": Viewport,
            "OpenGLRenderer": OpenGLRenderer,
            "TachyonRenderer": TachyonRenderer,
        }
        self.pipeline = import_file(self.input_file)

    def add_to_scene(self) -> None:
        if self.pipeline is None:
            self.load()
        self.pipeline.add_to_scene()

    def remove_from_scene(self) -> None:
        if self.pipeline is not None:
            self.pipeline.remove_from_scene()

    def add_modifier(self, modifier: Any, name: str | None = None) -> None:
        if self.pipeline is None:
            self.load()
        self.pipeline.modifiers.append(modifier)
        self.manifest["modifiers"].append(name or modifier.__class__.__name__)

    def renderer(self) -> Any:
        tachyon = self._ovito["TachyonRenderer"]
        opengl = self._ovito["OpenGLRenderer"]
        if self.renderer_name == "tachyon":
            self.manifest["renderer"] = "TachyonRenderer"
            return tachyon()
        self.manifest["renderer"] = "OpenGLRenderer"
        return opengl()

    def viewport_for(self, view: str) -> Any:
        viewport_cls = self._ovito["Viewport"]
        viewport = viewport_cls()
        viewport.type = getattr(viewport_cls.Type, STANDARD_VIEWS[view])
        return viewport

    def compute_bbox(self) -> Dict[str, Any]:
        """Compute a conservative bbox from particles, falling back to the cell."""
        if self.pipeline is None:
            self.load()
        data = self.pipeline.compute(self.frame)

        if hasattr(data, "particles") and "Position" in data.particles:
            positions = data.particles["Position"]
            coords = [tuple(row) for row in positions]
            if coords:
                mins = [min(p[i] for p in coords) for i in range(3)]
                maxs = [max(p[i] for p in coords) for i in range(3)]
                return self._bbox_dict(mins, maxs, source="particles")

        cell = data.cell
        matrix = getattr(cell, "matrix", cell)
        corners = [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 0],
            [1, 0, 1],
            [0, 1, 1],
            [1, 1, 1],
        ]
        pts = []
        for c in corners:
            pts.append(
                [
                    sum(matrix[i, j] * c[j] for j in range(3)) + matrix[i, 3]
                    for i in range(3)
                ]
            )
        mins = [min(p[i] for p in pts) for i in range(3)]
        maxs = [max(p[i] for p in pts) for i in range(3)]
        return self._bbox_dict(mins, maxs, source="cell")

    @staticmethod
    def _bbox_dict(
        mins: Iterable[float], maxs: Iterable[float], source: str
    ) -> Dict[str, Any]:
        min_list = [float(x) for x in mins]
        max_list = [float(x) for x in maxs]
        center = [(a + b) / 2.0 for a, b in zip(min_list, max_list)]
        extent = [max(b - a, 1e-9) for a, b in zip(min_list, max_list)]
        radius = math.sqrt(sum((e / 2.0) ** 2 for e in extent))
        return {
            "source": source,
            "min": min_list,
            "max": max_list,
            "center": center,
            "extent": extent,
            "radius": radius,
        }

    def render_view(
        self, view: str, prefix: str = "snapshot", zoom_method: str = "zoom_all"
    ) -> Path:
        """Render one standard view."""
        if view not in STANDARD_VIEWS and view not in EXTRA_VIEW_DIRECTIONS:
            raise ValueError(
                f"Unsupported view '{view}'. Use one of {sorted(STANDARD_VIEWS) + sorted(EXTRA_VIEW_DIRECTIONS)}"
            )
        if self.pipeline is None:
            self.load()

        self.add_to_scene()
        viewport = (
            self.viewport_for(view)
            if view in STANDARD_VIEWS
            else self.custom_viewport()
        )
        bbox = self.compute_bbox()
        zoom_used = zoom_method

        if zoom_method == "zoom_all":
            try:
                try:
                    viewport.zoom_all(size=(self.width, self.height), frame=self.frame)
                except TypeError:
                    viewport.zoom_all(size=(self.width, self.height))
            except Exception as exc:  # noqa: BLE001 - record and fallback for robustness
                zoom_used = "manual_bbox"
                self.manifest["fallbacks"].append(
                    {
                        "from": "zoom_all",
                        "to": "manual_bbox",
                        "error": str(exc),
                    }
                )
                self.apply_manual_camera(viewport, view, bbox)
        else:
            zoom_used = "manual_bbox"
            self.apply_manual_camera(viewport, view, bbox)

        output = self.output_dir / f"{prefix}_frame_{self.frame_label}_{view}.png"
        try:
            viewport.render_image(
                filename=str(output),
                size=(self.width, self.height),
                renderer=self.renderer(),
                frame=self.frame,
            )
        finally:
            self.remove_from_scene()

        view_record = {
            "name": view,
            "output": str(output),
            "viewport_type": STANDARD_VIEWS.get(view, "Custom"),
            "projection": "orthographic",
            "zoom_method": zoom_used,
            "target_fill_ratio": "70-85%",
            "bbox": bbox,
        }
        if view in self._camera_records:
            view_record["camera"] = self._camera_records[view]
        self.manifest["views"].append(view_record)
        return output

    def apply_manual_camera(
        self, viewport: Any, view: str, bbox: Dict[str, Any], margin: float = 1.2
    ) -> None:
        """Manual camera fallback based on bounding-box extent."""
        center = bbox["center"]
        extent = bbox["extent"]
        max_extent = max(extent)
        distance = max_extent * 2.5 + 1.0
        directions: Dict[str, Tuple[float, float, float]] = {
            "front": (0.0, -1.0, 0.0),
            "side": (-1.0, 0.0, 0.0),
            "top": (0.0, 0.0, -1.0),
        }
        directions.update(EXTRA_VIEW_DIRECTIONS)
        direction = self._normalize(directions[view])
        viewport.camera_pos = tuple(
            center[i] - direction[i] * distance for i in range(3)
        )
        viewport.camera_dir = direction
        viewport.fov = max_extent * margin
        self._camera_records[view] = {
            "camera_pos": [float(x) for x in viewport.camera_pos],
            "camera_dir": [float(x) for x in viewport.camera_dir],
            "fov": float(viewport.fov),
            "margin": float(margin),
            "distance": float(distance),
        }

    @property
    def frame_label(self) -> str:
        if self.frame == -1:
            return "last"
        return f"{self.frame:06d}"

    def render_standard_views(
        self, prefix: str = "snapshot", zoom_method: str = "zoom_all"
    ) -> None:
        for view in ("front", "side", "top"):
            self.render_view(view=view, prefix=prefix, zoom_method=zoom_method)

    def render_extended_views(
        self, prefix: str = "snapshot", zoom_method: str = "zoom_all"
    ) -> None:
        for view in ("front", "side", "top", "iso", "diag_xy", "diag_xz"):
            self.render_view(view=view, prefix=prefix, zoom_method=zoom_method)

    def custom_viewport(self) -> Any:
        viewport_cls = self._ovito["Viewport"]
        return viewport_cls()

    @staticmethod
    def _normalize(vector: Tuple[float, float, float]) -> Tuple[float, float, float]:
        norm = math.sqrt(sum(x * x for x in vector))
        if norm <= 0:
            return vector
        return (
            float(vector[0] / norm),
            float(vector[1] / norm),
            float(vector[2] / norm),
        )

    def write_manifest(self) -> Path:
        return write_manifest(self.manifest, self.output_dir)


def add_common_cli(parser: argparse.ArgumentParser) -> argparse.ArgumentParser:
    parser.add_argument("input_file", help="Input file readable by OVITO")
    parser.add_argument(
        "--output-dir", default="ovito_outputs", help="Output directory"
    )
    parser.add_argument(
        "--frame", type=int, default=-1, help="Frame index, -1 for last frame"
    )
    parser.add_argument("--width", type=int, default=2000, help="Image width")
    parser.add_argument("--height", type=int, default=1600, help="Image height")
    parser.add_argument("--renderer", choices=("tachyon", "opengl"), default="tachyon")
    parser.add_argument(
        "--manual-camera",
        action="store_true",
        help="Use manual bbox camera instead of zoom_all",
    )
    parser.add_argument(
        "--extended-views",
        action="store_true",
        help="Render front/side/top plus iso/diagonal views",
    )
    return parser
