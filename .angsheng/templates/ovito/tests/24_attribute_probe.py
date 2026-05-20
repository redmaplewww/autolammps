from ovito.io import import_file
from ovito.modifiers import CommonNeighborAnalysisModifier, CoordinationAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(CommonNeighborAnalysisModifier())
pipeline.modifiers.append(CoordinationAnalysisModifier(cutoff=5.0, number_of_bins=100))

data = pipeline.compute()

with open("attribute_probe.txt", "w", encoding="utf-8") as stream:
    stream.write("particle_properties\n")
    for key in data.particles.keys():
        stream.write(f"- {key}\n")
    stream.write("tables\n")
    for key in data.tables.keys():
        stream.write(f"- {key}\n")
    stream.write("attributes\n")
    for key in sorted(data.attributes.keys()):
        stream.write(f"- {key}\n")
