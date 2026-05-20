from render_engine import RenderEngine
from ovito.modifiers import (
    SelectTypeModifier,
    DeleteSelectedModifier,
    ExpressionSelectionModifier,
    AssignColorModifier,
)

engine = RenderEngine("dump.lammpstrj", multiple_frames=True)

engine.add_modifier(SelectTypeModifier(types={99}))
engine.add_modifier(DeleteSelectedModifier())

engine.add_modifier(
    ExpressionSelectionModifier(expression="Position.Z < -1.0 || Position.Z > 20.0")
)
engine.add_modifier(DeleteSelectedModifier())

engine.add_modifier(SelectTypeModifier(types={1}))
engine.add_modifier(AssignColorModifier(color=(0.18, 0.18, 0.18)))
engine.add_modifier(SelectTypeModifier(types={2}))
engine.add_modifier(AssignColorModifier(color=(1.00, 0.85, 0.10)))

last = engine.num_frames - 1

meta = engine.render(
    filename="focus_render.png",
    frame=last,
    renderer="tachyon",
)
print(meta)
