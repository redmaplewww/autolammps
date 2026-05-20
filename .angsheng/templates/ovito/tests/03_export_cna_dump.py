from ovito.io import export_file, import_file
from ovito.modifiers import CommonNeighborAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(CommonNeighborAnalysisModifier())

export_file(
    pipeline,
    "cna_output.dump",
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
