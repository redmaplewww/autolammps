from ovito.io import import_file
from ovito.modifiers import CoordinationAnalysisModifier

pipeline = import_file("trajectory.dump")
pipeline.modifiers.append(CoordinationAnalysisModifier(cutoff=6.0, number_of_bins=120))
num_frames = getattr(pipeline.source, "num_frames", 1)

with open("framewise_rdf_peak.txt", "w", encoding="utf-8") as stream:
    stream.write("frame peak_r peak_g\n")
    for frame in range(num_frames):
        data = pipeline.compute(frame)
        rdf = data.tables["coordination-rdf"].xy()
        if len(rdf):
            peak_index = int(rdf[:, 1].argmax())
            stream.write(f"{frame} {rdf[peak_index, 0]} {rdf[peak_index, 1]}\n")
        else:
            stream.write(f"{frame} 0.0 0.0\n")
