from ovito.io import import_file
from ovito.modifiers import SliceModifier
from ovito.vis import TachyonRenderer, Viewport

pipeline = import_file("input.dump")
pipeline.modifiers.append(SliceModifier(normal=(0.0, 1.0, 0.0), distance=0.0))

pipeline.add_to_scene()
viewport = Viewport(type=Viewport.Type.Perspective)
viewport.zoom_all()
viewport.render_image(
    filename="slice_render.png",
    size=(1280, 720),
    renderer=TachyonRenderer(),
)
pipeline.remove_from_scene()
