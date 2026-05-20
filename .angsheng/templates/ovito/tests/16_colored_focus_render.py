from ovito.io import import_file
from ovito.modifiers import (
    AssignColorModifier,
    DeleteSelectedModifier,
    ExpressionSelectionModifier,
)
from ovito.vis import TachyonRenderer, Viewport

pipeline = import_file("input.dump")
pipeline.modifiers.append(
    ExpressionSelectionModifier(expression="Position.X < 0.0 || Position.X > 50.0")
)
pipeline.modifiers.append(DeleteSelectedModifier())
pipeline.modifiers.append(AssignColorModifier(color=(0.95, 0.45, 0.10)))

pipeline.add_to_scene()
viewport = Viewport(type=Viewport.Type.Perspective)
viewport.zoom_all()
viewport.render_image(
    filename="colored_focus_render.png",
    size=(1280, 720),
    renderer=TachyonRenderer(),
)
pipeline.remove_from_scene()
