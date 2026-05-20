from pathlib import Path

from render_engine import RenderEngine
from ovito.modifiers import DislocationAnalysisModifier

INPUT_FILE = "dump.lammpstrj"
OUTPUT_FILE = Path("dislocation_summary.txt")
CRYSTAL_STRUCTURE = DislocationAnalysisModifier.Lattice.FCC

engine = RenderEngine(INPUT_FILE, multiple_frames=True)

modifier = DislocationAnalysisModifier()
modifier.input_crystal_structure = CRYSTAL_STRUCTURE
engine.add_modifier(modifier)

data = engine.compute(0)
dislocations = getattr(data, "dislocations", None)

with OUTPUT_FILE.open("w", encoding="utf-8") as f:
    if dislocations is None:
        f.write("No dislocations object available.\n")
    else:
        f.write("id\tlength\tburgers\n")
        for line in dislocations.lines:
            f.write(f"{line.id}\t{line.length:.4f}\t{line.true_burgers_vector}\n")

meta = engine.render(
    filename="dislocation_render.png",
    frame=engine.num_frames - 1,
    renderer="opengl",
)
print(meta)
