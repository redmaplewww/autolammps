from ovito.io import import_file
from ovito.modifiers import SelectTypeModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(SelectTypeModifier(types={1}))

data = pipeline.compute()
selection = data.particles["Selection"][:]
selected_count = int(selection.sum()) if len(selection) else 0

with open("select_type_count.txt", "w", encoding="utf-8") as stream:
    stream.write(f"selected_particles {selected_count}\n")
