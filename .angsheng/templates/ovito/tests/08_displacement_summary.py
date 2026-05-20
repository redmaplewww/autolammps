from ovito.io import import_file
from ovito.modifiers import CalculateDisplacementsModifier

pipeline = import_file("trajectory.dump")
pipeline.modifiers.append(CalculateDisplacementsModifier())

num_frames = getattr(pipeline.source, "num_frames", 1)
frame = max(0, num_frames - 1)
data = pipeline.compute(frame)
displacement = data.particles["Displacement Magnitude"]

values = displacement[:]
minimum = float(values.min()) if len(values) else 0.0
maximum = float(values.max()) if len(values) else 0.0
average = float(values.mean()) if len(values) else 0.0

with open("displacement_summary.txt", "w", encoding="utf-8") as stream:
    stream.write(f"frame {frame}\n")
    stream.write(f"min {minimum}\n")
    stream.write(f"max {maximum}\n")
    stream.write(f"mean {average}\n")
