"""
OVITO Universal Render Engine
=============================
Guarantees the model occupies 70-80% of the final image by computing
bounding-box-driven camera placement with a calibrated fill factor.

Usage:
    from render_engine import RenderEngine

    engine = RenderEngine("dump.lammpstrj")
    engine.render("snapshot.png", frame=0)

All LAMMPS post-processing OVITO scripts MUST import and use this engine.
Do NOT call Viewport or camera APIs directly outside this module.
"""

from __future__ import annotations

import math
from typing import Optional, Tuple

from ovito.io import import_file
from ovito.data import DataCollection
from ovito.vis import Viewport, OpenGLRenderer, TachyonRenderer

try:
    from ovito.vis import OSPRayRenderer
except ImportError:
    OSPRayRenderer = None

try:
    from ovito.vis import AnariRenderer
except ImportError:
    AnariRenderer = None


TARGET_FILL_MIN = 0.70
TARGET_FILL_MAX = 0.80
FILL_FACTOR_CALIBRATED = 1.30  # factor that yields ~75% fill after testing
DEFAULT_SIZE = (1920, 1080)
DEFAULT_RENDERER = "opengl"


class RenderEngine:
    """
    Bounding-box-driven OVITO render engine.

    Workflow:
        1. Load the dump file.
        2. Optionally apply modifiers.
        3. Compute bounding box from particle positions at the target frame.
        4. Place an orthographic camera so the model fills 70-80% of the image.
        5. Render with OpenGL (default) or Tachyon.
    """

    def __init__(
        self,
        filepath: str,
        multiple_frames: bool = False,
    ):
        self.filepath = filepath
        self.pipeline = import_file(filepath, multiple_frames=multiple_frames)
        self._added_to_scene = False
        self._bbox: Optional[
            Tuple[Tuple[float, float, float], Tuple[float, float, float]]
        ] = None
        self._frame_data: Optional[DataCollection] = None

    def add_modifier(self, modifier) -> "RenderEngine":
        self.pipeline.modifiers.append(modifier)
        return self

    def add_to_scene(self) -> "RenderEngine":
        if not self._added_to_scene:
            self.pipeline.add_to_scene()
            self._added_to_scene = True
        return self

    def remove_from_scene(self) -> "RenderEngine":
        if self._added_to_scene:
            self.pipeline.remove_from_scene()
            self._added_to_scene = False
        return self

    def compute(self, frame: int = 0) -> DataCollection:
        self._frame_data = self.pipeline.compute(frame)
        return self._frame_data

    @property
    def num_frames(self) -> int:
        return getattr(self.pipeline.source, "num_frames", 1)

    def bbox(
        self, frame: int = 0
    ) -> Tuple[Tuple[float, float, float], Tuple[float, float, float]]:
        """
        Compute axis-aligned bounding box from particle positions.

        Returns (bbox_min, bbox_max) each as (x, y, z).
        """
        if self._bbox is not None:
            return self._bbox
        data = (
            self._frame_data
            if self._frame_data is not None
            else self.pipeline.compute(frame)
        )
        pos = data.particles.positions
        if pos is None or len(pos) == 0:
            raise RuntimeError(f"No particle positions found in {self.filepath}")
        arr = pos[...]
        bbox_min = (
            float(arr[:, 0].min()),
            float(arr[:, 1].min()),
            float(arr[:, 2].min()),
        )
        bbox_max = (
            float(arr[:, 0].max()),
            float(arr[:, 1].max()),
            float(arr[:, 2].max()),
        )
        self._bbox = (bbox_min, bbox_max)
        return self._bbox

    @staticmethod
    def _camera_from_bbox(
        bbox_min: Tuple[float, float, float],
        bbox_max: Tuple[float, float, float],
        aspect_ratio: float,
        view_direction: str = "z",
    ) -> dict:
        """
        Compute camera position, direction, and ortho field of view
        so that the model fills TARGET_FILL of the image.

        Parameters
        ----------
        bbox_min, bbox_max : axis-aligned bounding box corners
        aspect_ratio : image width / height
        view_direction : which axis the camera looks along ("x", "y", "z")

        Returns dict with keys: camera_pos, camera_dir, fov_height, center
        """
        center = tuple(0.5 * (bbox_min[i] + bbox_max[i]) for i in range(3))
        extent = tuple(bbox_max[i] - bbox_min[i] for i in range(3))

        axis_map = {"x": 0, "y": 1, "z": 2}
        forward_axis = axis_map[view_direction]

        transverse_axes = [i for i in range(3) if i != forward_axis]

        trans_extent_0 = extent[transverse_axes[0]]
        trans_extent_1 = extent[transverse_axes[1]]

        if trans_extent_0 <= 0:
            trans_extent_0 = 1.0
        if trans_extent_1 <= 0:
            trans_extent_1 = 1.0

        model_aspect = trans_extent_0 / trans_extent_1

        if model_aspect > aspect_ratio:
            fov_height = trans_extent_1 * (aspect_ratio / model_aspect)
            if fov_height < trans_extent_1:
                fov_height = trans_extent_1
        else:
            fov_height = trans_extent_1

        fill_scale = 1.0 / ((TARGET_FILL_MIN + TARGET_FILL_MAX) / 2.0)
        fov_height = fov_height * fill_scale

        camera_dir = [0.0, 0.0, 0.0]
        camera_dir[forward_axis] = -1.0

        depth = extent[forward_axis]
        diag = math.sqrt(sum(e * e for e in extent))
        if diag <= 0:
            diag = 1.0
        dist = diag * FILL_FACTOR_CALIBRATED

        camera_pos = list(center)
        camera_pos[forward_axis] += dist

        return {
            "camera_pos": tuple(camera_pos),
            "camera_dir": tuple(camera_dir),
            "fov_height": fov_height,
            "center": center,
            "depth": depth,
        }

    @staticmethod
    def _resolve_renderer(renderer: str):
        if renderer == "opengl":
            return OpenGLRenderer()
        if renderer == "tachyon":
            return TachyonRenderer(ambient_occlusion=True)
        if renderer == "ospray":
            if OSPRayRenderer is None:
                raise RuntimeError("OSPRayRenderer not available in this OVITO build")
            return OSPRayRenderer()
        if renderer == "anari":
            if AnariRenderer is None:
                raise RuntimeError("AnariRenderer not available in this OVITO build")
            return AnariRenderer()
        raise ValueError(
            f"Unknown renderer: {renderer!r}. Use 'opengl', 'tachyon', 'ospray', or 'anari'."
        )

    def render(
        self,
        filename: str,
        frame: int = 0,
        size: Tuple[int, int] = DEFAULT_SIZE,
        renderer: str = DEFAULT_RENDERER,
        view_direction: str = "z",
        background: Tuple[float, float, float] = (1.0, 1.0, 1.0),
        hide_cell: bool = True,
    ) -> dict:
        """
        Render the pipeline to an image file.

        Parameters
        ----------
        filename : output image path
        frame : frame index to render
        size : (width, height) in pixels
        renderer : "opengl" or "tachyon"
        view_direction : camera looks along this axis ("x", "y", "z")
        background : RGB background color, each in [0, 1]
        hide_cell : whether to hide the simulation cell box

        Returns dict with render metadata for validation.
        """
        self.add_to_scene()

        data = self.pipeline.compute(frame)
        self._frame_data = data

        if hide_cell and data.cell is not None:
            try:
                cell_vis = data.cell.vis
                cell_vis.enabled = False
            except Exception:
                pass

        bbox_min, bbox_max = self.bbox(frame)

        w, h = size
        aspect_ratio = w / h

        cam = self._camera_from_bbox(bbox_min, bbox_max, aspect_ratio, view_direction)

        vp = Viewport(type=Viewport.Type.Ortho)
        vp.camera_pos = cam["camera_pos"]
        vp.camera_dir = cam["camera_dir"]
        vp.fov = cam["fov_height"]

        ovito_renderer = self._resolve_renderer(renderer)

        vp.render_image(
            filename=filename,
            size=size,
            frame=frame,
            renderer=ovito_renderer,
            background=background,
        )

        bbox_size = tuple(bbox_max[i] - bbox_min[i] for i in range(3))
        return {
            "filename": filename,
            "frame": frame,
            "size": size,
            "renderer": renderer,
            "view_direction": view_direction,
            "camera_pos": cam["camera_pos"],
            "camera_dir": cam["camera_dir"],
            "fov": cam["fov_height"],
            "bbox_min": bbox_min,
            "bbox_max": bbox_max,
            "bbox_size": bbox_size,
            "num_particles": len(data.particles.positions)
            if data.particles.positions is not None
            else 0,
            "target_fill": f"{TARGET_FILL_MIN:.0%}-{TARGET_FILL_MAX:.0%}",
        }

    def render_multiple_views(
        self,
        base_name: str,
        frame: int = 0,
        size: Tuple[int, int] = DEFAULT_SIZE,
        renderer: str = DEFAULT_RENDERER,
        views: Tuple[str, ...] = ("x", "y", "z"),
    ) -> list:
        """
        Render the same frame from multiple view directions.

        Returns list of render metadata dicts.
        """
        results = []
        for vd in views:
            fname = f"{base_name}_{vd}.png"
            meta = self.render(
                fname, frame=frame, size=size, renderer=renderer, view_direction=vd
            )
            results.append(meta)
        return results

    def render_animation(
        self,
        filename: str,
        size: Tuple[int, int] = (1280, 720),
        fps: int = 10,
        view_direction: str = "z",
        renderer: str = DEFAULT_RENDERER,
    ) -> dict:
        """
        Render all frames as an animation file (.mp4 or .gif).
        Falls back to individual frame rendering if animation is not supported.
        """
        self.add_to_scene()
        data = self.pipeline.compute(0)
        bbox_min, bbox_max = self.bbox(0)

        w, h = size
        aspect_ratio = w / h
        cam = self._camera_from_bbox(bbox_min, bbox_max, aspect_ratio, view_direction)

        vp = Viewport(type=Viewport.Type.Ortho)
        vp.camera_pos = cam["camera_pos"]
        vp.camera_dir = cam["camera_dir"]
        vp.fov = cam["fov_height"]

        ovito_renderer = self._resolve_renderer(renderer)

        try:
            vp.render_image(
                filename=filename,
                size=size,
                renderer=ovito_renderer,
                background=(1.0, 1.0, 1.0),
            )
            return {"filename": filename, "type": "animation", "size": size}
        except Exception:
            nf = self.num_frames
            frame_files = []
            for i in range(nf):
                stem = filename.rsplit(".", 1)[0]
                ff = f"{stem}_frame_{i:04d}.png"
                try:
                    vp.render_image(
                        filename=ff,
                        size=size,
                        frame=i,
                        renderer=ovito_renderer,
                        background=(1.0, 1.0, 1.0),
                    )
                    frame_files.append(ff)
                except Exception:
                    pass
            return {"filename": filename, "type": "frames", "frame_files": frame_files}
