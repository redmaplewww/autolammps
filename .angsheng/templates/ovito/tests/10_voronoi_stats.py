from ovito.io import import_file
from ovito.modifiers import VoronoiAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(VoronoiAnalysisModifier(compute_indices=True))

data = pipeline.compute()
volumes = data.particles["Atomic Volume"][:]

average_volume = float(volumes.mean()) if len(volumes) else 0.0
maximum_volume = float(volumes.max()) if len(volumes) else 0.0

with open("voronoi_stats.txt", "w", encoding="utf-8") as stream:
    stream.write(f"average_atomic_volume {average_volume}\n")
    stream.write(f"max_atomic_volume {maximum_volume}\n")
