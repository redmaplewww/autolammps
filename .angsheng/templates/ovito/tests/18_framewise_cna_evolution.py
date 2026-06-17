from collections import Counter

from ovito.io import import_file
from ovito.modifiers import CommonNeighborAnalysisModifier

pipeline = import_file("trajectory.dump")
pipeline.modifiers.append(CommonNeighborAnalysisModifier())
num_frames = getattr(pipeline.source, "num_frames", 1)

with open("framewise_cna_evolution.txt", "w", encoding="utf-8") as stream:
    stream.write("frame other fcc bcc hcp ico\n")
    for frame in range(num_frames):
        data = pipeline.compute(frame)
        counts = Counter(int(value) for value in data.particles["Structure Type"][:])
        stream.write(
            f"{frame} {counts.get(0, 0)} {counts.get(1, 0)} {counts.get(2, 0)} {counts.get(3, 0)} {counts.get(4, 0)}\n"
        )
