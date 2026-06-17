from render_engine import RenderEngine

engine = RenderEngine("dump.lammpstrj", multiple_frames=True)
engine.add_to_scene()

meta = engine.render(
    filename="snapshot.png",
    frame=0,
    renderer="opengl",
)
print(meta)

tachyon_meta = engine.render(
    filename="snapshot_tachyon.png",
    frame=0,
    renderer="tachyon",
)
print(tachyon_meta)
