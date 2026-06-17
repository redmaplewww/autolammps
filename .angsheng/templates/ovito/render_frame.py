from render_engine import RenderEngine

FRAME = 0

engine = RenderEngine("dump.lammpstrj", multiple_frames=True)

meta = engine.render(
    filename=f"frame_{FRAME:04d}.png",
    frame=FRAME,
    renderer="opengl",
)
print(meta)

tachyon_meta = engine.render(
    filename=f"frame_{FRAME:04d}_tachyon.png",
    frame=FRAME,
    renderer="tachyon",
)
print(tachyon_meta)
