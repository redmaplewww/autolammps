from render_engine import RenderEngine
from ovito.modifiers import (
    ComputePropertyModifier,
    ColorCodingModifier,
    ExpressionSelectionModifier,
    DeleteSelectedModifier,
)
from ovito.vis import Viewport, ColorLegendOverlay

engine = RenderEngine("input.xyz")

engine.add_modifier(ExpressionSelectionModifier(expression="Position.Y < 0"))
engine.add_modifier(DeleteSelectedModifier())

engine.add_modifier(
    ComputePropertyModifier(
        output_property="Averaged_Temp",
        expressions={"TEMP": "v_temp / (NumNeighbors+1)"},
        neighbor_expressions=("v_temp / (NumNeighbors+1)"),
        cutoff_radius=5,
    )
)
engine.add_modifier(
    ColorCodingModifier(
        property="Averaged_Temp",
        gradient=ColorCodingModifier.Jet(),
    )
)

engine.add_to_scene()

vp = Viewport(type=Viewport.Type.Ortho)
vp.overlays.append(ColorLegendOverlay(title="Temperature"))

bbox_min, bbox_max = engine.bbox(0)
cam = engine._camera_from_bbox(bbox_min, bbox_max, 1600 / 1200, "z")
vp.camera_pos = cam["camera_pos"]
vp.camera_dir = cam["camera_dir"]
vp.fov = cam["fov_height"]

vp.render_image(
    filename="temperature_map.png",
    size=(1600, 1200),
    background=(1, 1, 1),
)
