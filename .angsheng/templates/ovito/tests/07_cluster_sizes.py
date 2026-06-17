from ovito.io import import_file
from ovito.modifiers import ClusterAnalysisModifier

pipeline = import_file("input.xyz")
pipeline.modifiers.append(
    ClusterAnalysisModifier(cutoff=3.0, sort_by_size=True, compute_com=True)
)

data = pipeline.compute()
cluster_table = data.tables["clusters"]

with open("cluster_sizes.txt", "w", encoding="utf-8") as stream:
    stream.write("size\n")
    for size in cluster_table["Cluster Size"][:]:
        stream.write(f"{size}\n")
