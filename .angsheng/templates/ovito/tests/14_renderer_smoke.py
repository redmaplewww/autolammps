from ovito.io import import_file
from ovito.vis import AnariRenderer, OSPRayRenderer, TachyonRenderer, Viewport

pipeline = import_file("input.dump")
pipeline.add_to_scene()

viewport = Viewport(type=Viewport.Type.Perspective)
viewport.zoom_all()

renderers = [
    ("tachyon", TachyonRenderer()),
    ("ospray", OSPRayRenderer()),
    ("anari", AnariRenderer()),
]

for name, renderer in renderers:
    viewport.render_image(
        filename=f"renderer_{name}.png",
        size=(1024, 768),
        renderer=renderer,
    )

pipeline.remove_from_scene()
