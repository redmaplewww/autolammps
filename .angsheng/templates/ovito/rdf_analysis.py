from render_engine import RenderEngine
from ovito.modifiers import CoordinationAnalysisModifier

engine = RenderEngine("dump.lammpstrj")

engine.add_modifier(CoordinationAnalysisModifier(cutoff=5.0, number_of_bins=100))

data = engine.compute(0)
rdf_table = data.tables["coordination-rdf"]
rdf_xy = rdf_table.xy()

with open("rdf_data.txt", "w", encoding="utf-8") as f:
    f.write("r\tg(r)\n")
    for r, g in rdf_xy:
        f.write(f"{r:.6f}\t{g:.6f}\n")

print(f"RDF exported: {len(rdf_xy)} bins")
