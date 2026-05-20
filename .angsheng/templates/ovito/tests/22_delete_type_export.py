from ovito.io import export_file, import_file
from ovito.modifiers import DeleteSelectedModifier, SelectTypeModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(SelectTypeModifier(types={99}))
pipeline.modifiers.append(DeleteSelectedModifier())

export_file(
    pipeline,
    "filtered.xyz",
    "xyz",
    columns=["Particle Type", "Position.X", "Position.Y", "Position.Z"],
)
