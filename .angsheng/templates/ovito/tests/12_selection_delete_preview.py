from ovito.io import import_file
from ovito.modifiers import DeleteSelectedModifier, ExpressionSelectionModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(
    ExpressionSelectionModifier(expression="Position.Z < 0.0 || Position.Z > 50.0")
)
pipeline.modifiers.append(DeleteSelectedModifier())

data = pipeline.compute()

with open("selection_delete_preview.txt", "w", encoding="utf-8") as stream:
    stream.write(f"remaining_particles {data.particles.count}\n")
