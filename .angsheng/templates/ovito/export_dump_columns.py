from render_engine import RenderEngine
from ovito.io import export_file
from ovito.modifiers import CommonNeighborAnalysisModifier

engine = RenderEngine("dump.lammpstrj")

engine.add_modifier(CommonNeighborAnalysisModifier())

export_file(
    engine.pipeline,
    "output_with_structure.dump",
    "lammps/dump",
    columns=[
        "Particle Identifier",
        "Particle Type",
        "Position.X",
        "Position.Y",
        "Position.Z",
        "Structure Type",
    ],
)
print("Exported dump with CNA Structure Type column.")
