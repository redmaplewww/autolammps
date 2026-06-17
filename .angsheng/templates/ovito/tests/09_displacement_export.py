from ovito.io import export_file, import_file
from ovito.modifiers import CalculateDisplacementsModifier

pipeline = import_file("trajectory.dump")
pipeline.modifiers.append(CalculateDisplacementsModifier())

export_file(
    pipeline,
    "displacement_output.dump",
    "lammps/dump",
    columns=[
        "Particle Identifier",
        "Particle Type",
        "Position.X",
        "Position.Y",
        "Position.Z",
        "Displacement.X",
        "Displacement.Y",
        "Displacement.Z",
        "Displacement Magnitude",
    ],
)
