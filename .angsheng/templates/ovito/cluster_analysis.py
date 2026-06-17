from render_engine import RenderEngine
from ovito.modifiers import (
    ExpressionSelectionModifier,
    DeleteSelectedModifier,
    ClusterAnalysisModifier,
)

engine = RenderEngine("input.xyz")

engine.add_modifier(ExpressionSelectionModifier(expression="Position.X > 0.5"))
engine.add_modifier(DeleteSelectedModifier())
engine.add_modifier(
    ClusterAnalysisModifier(cutoff=2.8, sort_by_size=True, compute_com=True)
)

data = engine.compute(0)
cluster_table = data.tables["clusters"]

with open("cluster_sizes.txt", "w", encoding="utf-8") as f:
    f.write("Cluster Size\n")
    for size in cluster_table["Cluster Size"][:]:
        f.write(f"{size}\n")
