from ovito.io import import_file
from ovito.modifiers import CoordinationAnalysisModifier

pipeline = import_file("input.dump")
pipeline.modifiers.append(CoordinationAnalysisModifier(cutoff=6.0, number_of_bins=120))

data = pipeline.compute()
rdf = data.tables["coordination-rdf"].xy()

with open("rdf_table.txt", "w", encoding="utf-8") as stream:
    for radius, g_r in rdf:
        stream.write(f"{radius} {g_r}\n")
