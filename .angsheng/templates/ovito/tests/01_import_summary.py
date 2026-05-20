from ovito.io import import_file

pipeline = import_file("input.dump")
num_frames = getattr(pipeline.source, "num_frames", 1)
data = pipeline.compute()

with open("import_summary.txt", "w", encoding="utf-8") as stream:
    stream.write(f"frames {num_frames}\n")
    stream.write(f"particles {data.particles.count}\n")
    stream.write(f"cell {data.cell[:]}\n")
    stream.write("properties\n")
    for name in data.particles.keys():
        stream.write(f"- {name}\n")
