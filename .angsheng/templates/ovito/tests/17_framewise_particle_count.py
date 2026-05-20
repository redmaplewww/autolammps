from ovito.io import import_file

pipeline = import_file("trajectory.dump")
num_frames = getattr(pipeline.source, "num_frames", 1)

with open("framewise_particle_count.txt", "w", encoding="utf-8") as stream:
    stream.write("frame particles\n")
    for frame in range(num_frames):
        data = pipeline.compute(frame)
        stream.write(f"{frame} {data.particles.count}\n")
