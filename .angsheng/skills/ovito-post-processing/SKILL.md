---
name: ovito-post-processing
description: >
  OVITO Python post-processing and atomistic rendering skill. Use this whenever the user needs
  OVITO-based visualization, LAMMPS dump rendering, atomistic snapshots, trajectory keyframes,
  CNA/DXA/stress/temperature field visualization, or publication-quality molecular/atomic images.
  The agent must render atoms with the Python ovito library, produce clear standard views with
  deterministic camera/zoom rules, preserve OVITO default colors unless explicitly requested, and
  reuse bundled scripts before writing new one-off scripts.
---

# OVITO Post-Processing Skill

This skill makes atomistic post-processing reproducible. The agent cannot judge image quality by
looking at the rendered picture, so it must use deterministic OVITO camera, zoom, color, and output
rules instead of visual guesswork.

## Non-negotiable rules

1. **Use Python `ovito` for atomistic rendering.** Import structures with `ovito.io.import_file`,
   build analysis pipelines with OVITO modifiers, and render with `ovito.vis.Viewport` plus OVITO
   renderers. Do not use matplotlib/plotly/scatter3D to imitate atoms.
2. **Reuse the script library first.** Before creating a task-specific script, inspect the script
   index and adapt an existing script by changing parameters, paths, modifiers, or CLI arguments.
3. **Render standard views first, then add extra views.** Unless the user explicitly requests a single
   custom view, produce at least three orthographic views: front, side, and top. When practical,
   also provide additional diagonal/perspective views so the user can choose the best publication
   angle. The three standard views are mandatory quality-control baselines.
4. **Control zoom numerically.** Use `Viewport.zoom_all()` when available and record it. If it is not
   reliable, compute the model bounding box and set the camera/orthographic field of view so the
   model fills about 70-85% of the image without clipping.
5. **Keep default OVITO colors.** Preserve imported particle type colors and modifier default color
   schemes. Do not invent aesthetic palettes unless the user asks for custom colors.
6. **Write a manifest.** Every rendering run must save `render_manifest.json` with input file, frame,
   views, renderer, camera/zoom method, modifiers, color policy, and output paths.

## Default workflow

1. Identify input files, frame(s), output directory, requested analysis, and whether the task is a
   preview, final image, or paper figure.
2. For project-scale post-processing, first create a local output root with `scripts/`, `outputs/`,
   `renders/`, and `logs/`; preserve every generated script there.
3. Read `references/script-library-index.md` and choose the closest existing script.
4. Use the selected script or extend it by parameter changes. Avoid fresh scripts unless no existing
   script covers the workflow.
5. Import data with OVITO and compute the selected frame before rendering.
6. Generate front/side/top standard views using `scripts/render_standard_views.py` or the shared
   `OvitoRenderEngine`.
7. Add extra views such as isometric and diagonal views when output volume is acceptable.
8. Apply requested analysis modifiers such as CNA, DXA, stress, temperature, or RDF using the matching
   script where available.
9. Save images, generated data, and `render_manifest.json`.
10. For multi-case projects, write a project-level manifest and report documenting coverage, skipped
    items, source files, scripts, and outputs.
11. Report output paths and any fallback behavior, especially renderer fallback or manual camera mode.

## Script library policy

- Start from `scripts/render_engine.py`; it is the shared camera, zoom, renderer, and manifest layer.
- Prefer small task scripts that call `OvitoRenderEngine` over large standalone scripts.
- If a new script is needed, place it outside the permanent library first, for example in the user's
  project output directory or a temporary workspace.
- After the user confirms the output image quality is acceptable, the agent may add the new script to
  this skill's `scripts/` library and update `references/script-library-index.md`.
- Do not permanently add experimental scripts before user approval. If the user rejects the image
  quality, revise the temporary script and rerender rather than expanding the library.

## Camera and zoom requirements

Read `references/camera-and-zoom-rules.md` when implementing or changing camera logic.

Default requirements:

- Use orthographic projection for standard views.
- Produce front, side, and top views before optional custom or perspective views.
- Prefer adding isometric and diagonal views after the mandatory three views.
- Use `zoom_all()` first when it works for the active viewport and frame.
- For manual fallback, compute the particle/cell bounding box, center the view on the model, add a
  15-30% margin, and avoid clipping along the view direction.
- Record `zoom_method` as `zoom_all`, `manual_bbox`, or `custom_user_requested` in the manifest.

## Color requirements

Read `references/color-policy.md` before changing colors.

Default requirements:

- Keep OVITO/imported default particle colors.
- Keep default colors from analysis modifiers such as CNA/PTM/DXA unless the user asks otherwise.
- Use scalar coloring only when the task is explicitly a field map, such as stress or temperature.
- If custom colors are used, record the reason and mapping in `render_manifest.json`.

## Output requirements

For each OVITO rendering task, create:

- At least three standard view images unless the user explicitly requests otherwise.
- Additional isometric/diagonal views when practical, especially for final reports and user review.
- A `render_manifest.json` file.
- Clear filenames containing the frame and view, for example `snapshot_frame_000100_front.png`.
- A short final report listing output paths, frame(s), renderer, and whether colors were default.

Organize images by render type. Do not dump unrelated images into one flat directory. Use subfolders
such as:

- `standard_views/` for ordinary front/side/top/extra snapshots.
- `fracture_global/` for full-sample fracture morphology views.
- `fracture_local/` for cropped/local fracture evidence.
- `cna_cu_highlight/` for CNA-colored fracture evidence with Cu highlighted.
- `cu_dislocation_interaction/` for Cu clusters plus dislocation/defect-only interaction images.
- `cloud_maps/` for displacement, velocity, stress, or strain scalar maps.

For multi-case comparison figures, use consistent image size, projection, view direction, camera
margin, and scale across cases. Local fracture crops may use case-specific zoom, but global views and
local views must both be produced when local morphology is discussed.

Every render directory should contain a local manifest or be represented in a project-level manifest
with:

- render purpose/type
- color policy and property/mapping
- camera/scale policy
- whether views are globally comparable or local crops
- frame selection rule

For project-scale post-processing, additionally create:

- `scripts/` containing every script written for this case.
- `outputs/` for regenerated figures and CSVs.
- `renders/` for OVITO images.
- `logs/` for per-run manifests and failure notes.
- `postprocess_manifest.json` recording source files, case coverage, outputs, scripts, and skips.
- `POSTPROCESS_REPORT.md` summarizing coverage, regenerated results, deferred heavy tasks, and next steps.

Recommended image sizes:

- Preview: `1200x900`
- Final static image: `2000x1600`
- Paper figure: at least `3000` px wide when requested

Renderer preference:

- Use `TachyonRenderer` for final static images when available.
- Use `OpenGLRenderer` for fast previews or fallback.
- Record renderer fallback in the manifest.

## Available resources

- `scripts/render_engine.py` - shared OVITO import, camera, render, and manifest utilities
- `scripts/render_standard_views.py` - render front/side/top views for one frame
- `scripts/render_frame.py` - render one named view or the default standard views
- `scripts/cna_render.py` - common-neighbor-analysis rendering with default OVITO colors
- `scripts/dxa_render.py` - dislocation extraction/rendering with OVITO DXA defaults
- `scripts/displacement_cloud.py` - displacement magnitude cloud map between reference/current frames
- `scripts/velocity_cloud.py` - velocity magnitude cloud map when velocity properties are available
- `scripts/manifest_utils.py` - manifest writing helpers
- `references/rendering-standards.md` - overall rendering quality rules
- `references/camera-and-zoom-rules.md` - deterministic camera and bounding-box rules
- `references/color-policy.md` - default color and custom color policy
- `references/script-library-index.md` - script selection table and library update protocol
- `references/troubleshooting.md` - common OVITO and renderer failures

## Quality checklist

Before rendering:

- Did I choose an existing script from the library?
- Am I using Python `ovito` for atoms?
- Did I identify frame, image size, renderer, and output directory?
- Am I preserving default OVITO colors?

After rendering:

- Did I create front/side/top views or document why not?
- Did I add useful extra views when practical?
- Did I use `zoom_all()` or manual bounding-box camera logic?
- Did I save `render_manifest.json`?
- Did filenames include frame and view where relevant?
- Did I avoid adding a new permanent script before user approval of image quality?
- Did I put outputs into type-specific folders instead of a single mixed folder?
- For multi-case comparison images, did I keep view, scale, and dimensions consistent?
- Before every render type, did I recompute the visible-object bounding box and set camera center/fov
  from the visible objects, not from the hidden full model?
- If local fracture details are shown, did I also produce global morphology views?
- Did I record the coloring rule, especially when Cu is highlighted or CNA/scalar coloring is used?

For project-scale work:

- Did I audit existing figures/CSVs before rerunning heavy OVITO work?
- Did I separate lightweight CSV/statistical plotting from heavyweight trajectory analysis?
- Did I preserve all scripts in an output-local `scripts/` directory?
- Did I document skipped heavy full-trajectory analyses with reasons and reusable scripts?
