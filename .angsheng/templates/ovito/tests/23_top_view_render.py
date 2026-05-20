from ovito.io import import_file
from ovito.vis import TachyonRenderer, Viewport

pipeline = import_file("input.dump")
pipeline.add_to_scene()

viewport = Viewport(type=Viewport.Type.Top)
viewport.zoom_all()
viewport.render_image(
    filename="top_view.png",
    size=(1280, 720),
    renderer=TachyonRenderer(),
)

pipeline.remove_from_scene()
