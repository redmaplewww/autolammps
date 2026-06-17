"""Example: render three deterministic OVITO standard views.

Run from the skill directory or copy the command pattern into a project script.
"""

from scripts.render_engine import OvitoRenderEngine


engine = OvitoRenderEngine(
    input_file="dump.lammpstrj",
    output_dir="ovito_outputs",
    frame=-1,
    width=2000,
    height=1600,
    renderer="tachyon",
)
engine.load()
engine.render_standard_views(prefix="snapshot")
engine.write_manifest()
