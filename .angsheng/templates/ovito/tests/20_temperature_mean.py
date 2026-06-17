from ovito.io import import_file
from ovito.modifiers import ComputePropertyModifier

pipeline = import_file("input.xyz")
pipeline.modifiers.append(
    ComputePropertyModifier(
        output_property="SmoothedTemp",
        expressions={"TEMP": "v_temp / (NumNeighbors+1)"},
        neighbor_expressions=("v_temp / (NumNeighbors+1)"),
        cutoff_radius=5.0,
    )
)

data = pipeline.compute()
values = data.particles["SmoothedTemp"][:]
mean_value = float(values.mean()) if len(values) else 0.0

with open("temperature_mean.txt", "w", encoding="utf-8") as stream:
    stream.write(f"smoothed_temperature_mean {mean_value}\n")
