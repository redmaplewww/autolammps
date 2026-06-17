# Color Policy

Color choices in atomistic visualization can change scientific interpretation. The default behavior
is to preserve OVITO defaults and only customize colors when the user asks for it or the analysis
requires scalar coloring.

## Default behavior

- Preserve imported particle type colors.
- Preserve OVITO defaults for modifiers such as CNA, PTM, DXA, and coordination analysis.
- Do not apply arbitrary palettes for aesthetics.
- Use a white background unless the user requests transparency or another background.

## Allowed color changes

Color changes are allowed when:

- The user explicitly asks for a color scheme.
- A field map is requested, such as stress, temperature, displacement, or potential energy.
- A modifier requires scalar coloring to communicate the requested result.
- A publication figure needs a documented, physically meaningful mapping.

## Cu/fracture coloring rules

When the purpose is to emphasize how Cu affects fracture:

- Use CNA/PTM/default structure coloring for the matrix/defect state when appropriate.
- Highlight Cu atoms with one explicit contrasting color, such as orange or magenta.
- Record the Cu type id and highlight color in the manifest.
- Do not use arbitrary aesthetic colors for Fe atoms.

For Cu-cluster/dislocation interaction figures:

- Remove or hide ordinary Fe matrix atoms.
- Keep Cu particles/clusters visible.
- Keep dislocation/defect evidence visible, e.g. DXA dislocation lines or high-strain/non-FCC defect atoms.
- The figure should communicate spatial relationship between Cu clusters and dislocations/defect zones,
  not a dense full atom cloud.

## Required documentation for custom colors

When custom colors are used, record the following in `render_manifest.json`:

```json
{
  "color_policy": {
    "mode": "custom_user_requested",
    "custom_colors": true,
    "reason": "User requested red atoms for type 1 and blue atoms for type 2",
    "mapping": {"type_1": "red", "type_2": "blue"}
  }
}
```

For scalar maps, record the property and color range if known.

## Disallowed behavior

- Do not use neon, rainbow, gradient, or artistic palettes without a scientific reason or user request.
- Do not recolor CNA/PTM/DXA outputs just to make the image look more dramatic.
- Do not hide particles by changing alpha/transparency unless the user asks for a sliced or transparent view.
