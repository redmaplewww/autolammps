from render_engine import RenderEngine
from ovito.modifiers import CommonNeighborAnalysisModifier, ColorCodingModifier

engine = RenderEngine("dump.lammpstrj", multiple_frames=True)

engine.add_modifier(CommonNeighborAnalysisModifier())
engine.add_modifier(ColorCodingModifier(property="Structure Type"))

meta = engine.render(
    filename="cna_render.png",
    frame=0,
    renderer="tachyon",
)
print(meta)

nf = engine.num_frames
if nf > 1:
    last = nf - 1
    engine._bbox = None
    last_meta = engine.render(
        filename="cna_render_final.png",
        frame=last,
        renderer="tachyon",
    )
    print(last_meta)
