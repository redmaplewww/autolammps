from collections import Counter

from ovito.io import import_file
from ovito.modifiers import CoordinationAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(CoordinationAnalysisModifier(cutoff=3.5, number_of_bins=80))

data = pipeline.compute()
coordination = data.particles["Coordination"]
counts = Counter(int(value) for value in coordination)

with open("coordination_histogram.txt", "w", encoding="utf-8") as stream:
    stream.write("coordination count\n")
    for key in sorted(counts):
        stream.write(f"{key} {counts[key]}\n")
