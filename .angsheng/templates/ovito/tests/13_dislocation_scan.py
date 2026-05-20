from ovito.io import import_file
from ovito.modifiers import DislocationAnalysisModifier

pipeline = import_file("input.dump")
modifier = DislocationAnalysisModifier()
modifier.input_crystal_structure = DislocationAnalysisModifier.Lattice.FCC
pipeline.modifiers.append(modifier)

data = pipeline.compute()
total_length = data.attributes.get("DislocationAnalysis.total_line_length", 0.0)
cell_volume = data.attributes.get("DislocationAnalysis.cell_volume", 0.0)

with open("dislocation_scan.txt", "w", encoding="utf-8") as stream:
    stream.write(f"total_line_length {total_length}\n")
    stream.write(f"cell_volume {cell_volume}\n")
    if cell_volume:
        stream.write(f"line_density {total_length / cell_volume}\n")
