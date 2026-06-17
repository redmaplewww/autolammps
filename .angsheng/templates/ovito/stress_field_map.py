from render_engine import RenderEngine
from ovito.modifiers import ComputePropertyModifier, ColorCodingModifier
from ovito.vis import ColorLegendOverlay

engine = RenderEngine("input.xyz")

engine.add_modifier(
    ComputePropertyModifier(
        output_property="Averaged_Stress",
        expressions={"Stress": "v_atomicstressx / (NumNeighbors+1)"},
        neighbor_expressions=("v_atomicstressx / (NumNeighbors+1)"),
        cutoff_radius=5,
    )
)
engine.add_modifier(
    ColorCodingModifier(
        property="Averaged_Stress",
        gradient=ColorCodingModifier.Rainbow(),
    )
)

engine.add_to_scene()

from ovito.vis import Viewport

vp = Viewport(type=Viewport.Type.Ortho)
vp.overlays.append(ColorLegendOverlay(title="Stress"))

bbox_min, bbox_max = engine.bbox(0)
cam = engine._camera_from_bbox(bbox_min, bbox_max, 1600 / 1200, "z")
vp.camera_pos = cam["camera_pos"]
vp.camera_dir = cam["camera_dir"]
vp.fov = cam["fov_height"]

vp.render_image(
    filename="stress_map.png",
    size=(1600, 1200),
    background=(1, 1, 1),
)
