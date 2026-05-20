from pathlib import Path

from render_engine import RenderEngine
from ovito.modifiers import DislocationAnalysisModifier

INPUT_PATTERN = "dump.*.lammps"
OUTPUT_FILE = Path("dislocation_timeseries.txt")
CRYSTAL_STRUCTURE = DislocationAnalysisModifier.Lattice.FCC

engine = RenderEngine(INPUT_PATTERN, multiple_frames=True)

modifier = DislocationAnalysisModifier()
modifier.input_crystal_structure = CRYSTAL_STRUCTURE
engine.add_modifier(modifier)

num_frames = engine.num_frames

with OUTPUT_FILE.open("w", encoding="utf-8") as stream:
    stream.write("frame\ttotal_line_length\tcell_volume\tline_density\n")
    for frame in range(num_frames):
        data = engine.compute(frame)
        total_length = data.attributes.get("DislocationAnalysis.total_line_length", 0.0)
        cell_volume = data.attributes.get("DislocationAnalysis.cell_volume", 0.0)
        line_density = total_length / cell_volume if cell_volume else 0.0
        stream.write(
            f"{frame}\t{total_length:.4f}\t{cell_volume:.4f}\t{line_density:.6f}\n"
        )
