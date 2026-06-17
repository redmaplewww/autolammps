from ovito.io import import_file
from ovito.vis import TachyonRenderer, Viewport

pipeline = import_file("input.dump")
num_frames = getattr(pipeline.source, "num_frames", 1)
last_frame = max(0, num_frames - 1)

pipeline.add_to_scene()
viewport = Viewport(type=Viewport.Type.Perspective)
viewport.zoom_all()
viewport.render_image(
    filename="last_frame.png",
    size=(1280, 720),
    frame=last_frame,
    renderer=TachyonRenderer(),
)
pipeline.remove_from_scene()
