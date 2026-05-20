from collections import Counter

from ovito.io import import_file
from ovito.modifiers import CommonNeighborAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(CommonNeighborAnalysisModifier())

data = pipeline.compute()
structure_types = data.particles["Structure Type"]
counts = Counter(int(value) for value in structure_types)

with open("cna_structure_counts.txt", "w", encoding="utf-8") as stream:
    stream.write("type count\n")
    for key in sorted(counts):
        stream.write(f"{key} {counts[key]}\n")
