"""Example: render CNA standard views while preserving OVITO default CNA colors."""

from ovito.modifiers import CommonNeighborAnalysisModifier
from scripts.render_engine import OvitoRenderEngine


engine = OvitoRenderEngine("dump.lammpstrj", output_dir="ovito_cna", frame=-1)
engine.load()
engine.add_modifier(
    CommonNeighborAnalysisModifier(), name="CommonNeighborAnalysisModifier"
)
engine.manifest["color_policy"] = {
    "mode": "ovito_default_modifier_colors",
    "custom_colors": False,
    "modifier": "CommonNeighborAnalysisModifier",
}
engine.render_standard_views(prefix="cna")
engine.write_manifest()
