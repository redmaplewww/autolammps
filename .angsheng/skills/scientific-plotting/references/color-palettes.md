# Color Palettes

## Categorical colors

Prefer Okabe-Ito for categorical scientific plots:

```python
OKABE_ITO = [
    "#E69F00",  # orange
    "#56B4E9",  # sky blue
    "#009E73",  # bluish green
    "#F0E442",  # yellow
    "#0072B2",  # blue
    "#D55E00",  # vermillion
    "#CC79A7",  # reddish purple
    "#000000",  # black
]
```

Use redundant encodings for important series: marker shape, line style, or direct labels.

## Continuous maps

- Sequential: `viridis`, `plasma`, `cividis`, `magma`
- Diverging: `RdBu_r`, `PuOr`, `BrBG`, centered at meaningful zero/reference
- Avoid: `jet`, `rainbow`, arbitrary red-green maps

## Simulation convention suggestion

- Aging series: stable categorical palette in order `A0`, `A24`, `A144`, `A288`.
- Orientation series: stable marker/line style in order `001`, `110`, `111`, `poly`.
- Scalar physical fields: use colormap with labeled colorbar and units/property name.
