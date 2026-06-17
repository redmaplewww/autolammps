# Script Library Index

Use this index before writing any new script.

| Task | Preferred script | Notes |
|------|------------------|-------|
| Shared rendering utilities | `scripts/render_engine.py` | Import, camera, zoom, render, manifest |
| Three standard views | `scripts/render_standard_views.py` | Default first step for most tasks |
| Single frame render | `scripts/render_frame.py` | Can render one view or all standard views |
| CNA visualization | `scripts/cna_render.py` | Uses OVITO default CNA colors |
| DXA dislocation analysis | `scripts/dxa_render.py` | Uses OVITO DXA defaults; best for crystals/metals |
| Displacement cloud map | `scripts/displacement_cloud.py` | Computes displacement vectors from a reference frame |
| Velocity cloud map | `scripts/velocity_cloud.py` | Uses velocity/vector properties if present |
| Manifest writing | `scripts/manifest_utils.py` | Shared JSON manifest helper |

For multi-case project folders, also read `references/project-scale-workflow.md` before writing scripts.

## New script admission protocol

Agents may write new scripts, but permanent library additions require user approval of image quality.

1. Create the new script in the user's project output directory or a temporary workspace.
2. Render the requested output with the temporary script.
3. Show the user the output paths and ask for quality review only after the render is complete.
4. If the user confirms the image quality is acceptable, move/copy the script into `scripts/`.
5. Update this index with the script name, task, and notes.
6. If the user does not approve, keep iterating in the temporary location and do not add it to the library.

## Library style

- New scripts should call `OvitoRenderEngine` where possible.
- Use CLI arguments for input path, frame, output directory, width, height, and renderer.
- Preserve default OVITO colors unless a CLI option explicitly enables custom coloring.
- Save or update `render_manifest.json` for every render.
