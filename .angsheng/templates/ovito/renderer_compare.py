from render_engine import RenderEngine

engine = RenderEngine("input.lmp")
engine.add_to_scene()

engine.render(filename="default.png", renderer="opengl")
engine.render(filename="tachyon.png", renderer="tachyon")

for renderer_name in ("ospray", "anari"):
    try:
        engine.render(filename=f"{renderer_name}.png", renderer=renderer_name)
    except Exception as e:
        print(f"{renderer_name} renderer not available, skipped: {e}")

engine.remove_from_scene()
