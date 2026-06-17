# Chart Selection

Choose the chart based on the scientific question, not aesthetics.

| Scientific goal | Recommended chart | Notes |
|---|---|---|
| Time/strain evolution | line plot | Use shared axes for comparable cases |
| Stress-strain curves | line plot grouped by condition | Use consistent colors by aging/orientation |
| Compare scalar metrics | bar/point plot | Prefer point+error bars over bars for measured data |
| Correlation/mechanism | scatter + regression/annotation | Show groups by color/marker |
| Distribution | histogram, KDE, box, violin | Overlay individual points when feasible |
| Matrix/correlation | heatmap | Use labeled colorbar and perceptual colormap |
| Multi-factor comparison | faceted line/scatter/bar | Keep scales consistent unless justified |
| Process/flow | Sankey/flow diagram | Use only when flow values are meaningful |
| Mechanism schematic | annotated summary figure | Separate from quantitative plots |
| Spatial scalar field | OVITO/field map, not matplotlib scatter for atoms | Use scalar colormap only with physical property |

## Simulation post-processing patterns

- `stress vs strain`: line plot, grouped by aging or orientation.
- `defect fraction vs strain`: line plot, 2x2 facets by orientation.
- `void fraction vs strain`: line plot, same layout as defect fraction.
- `yield/peak/fracture metrics`: grouped bar or point plot.
- `precipitate statistics vs mechanics`: scatter matrix or 2xN panels.
- `distance-bin statistics`: line plot with distance on x-axis.
- `fracture location`: strip/bar plot plus heatmap-style case matrix.
