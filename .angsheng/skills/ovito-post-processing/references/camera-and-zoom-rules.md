# Camera And Zoom Rules

The agent cannot inspect rendered images visually. Camera quality must therefore be controlled by
standard views, bounding boxes, and recorded parameters.

## Required standard views

Render these views first unless the user explicitly asks for a different single view:

| View | Purpose | OVITO viewport type |
|------|---------|---------------------|
| front | primary elevation check | `Viewport.Type.Front` |
| side | depth/length check | `Viewport.Type.Left` |
| top | plan-view check | `Viewport.Type.Top` |

Use orthographic projection for all standard views. Perspective views are optional and should only be
added after the standard views are complete.

## Recommended extra views

After front/side/top, add extra views when practical:

| View | Purpose | Direction |
|------|---------|-----------|
| iso | balanced 3D overview | `(-1, -1, -1)` |
| diag_xy | diagonal in the x-y plane | `(-1, -1, 0)` |
| diag_xz | diagonal in the x-z plane | `(-1, 0, -1)` |

Extra views do not replace the three mandatory standard views. They help user acceptance because the
agent cannot know which angle best communicates the structure.

## Preferred zoom method

Use `viewport.zoom_all(size=(width, height), frame=frame)` after the pipeline is added to the scene.
Record this as `zoom_method: zoom_all` in `render_manifest.json`.

## Manual fallback method

Use manual bounding-box mode when `zoom_all()` is unavailable, fails, clips the model, or does not
work in the execution environment.

Manual mode rules:

1. Compute `data = pipeline.compute(frame)`.
2. Prefer the simulation cell bounds when a valid cell exists; otherwise compute particle-coordinate
   min/max values.
3. Compute center: `center = (min_corner + max_corner) / 2`.
4. Compute dimensions: `extent = max_corner - min_corner`.
5. For the selected view, project the 3D extent onto the image plane.
6. Set orthographic field of view to `max(projected_width / aspect, projected_height) * margin`.
7. Use a margin of `1.15` to `1.30`; default to `1.20`.
8. Place the camera far enough along the view direction to avoid clipping. A safe distance is
   `max(extent) * 2.5 + 1.0` from the model center.
9. Record `zoom_method: manual_bbox`, the bounding box, margin, camera position, camera direction,
   and fov in the manifest.

## Fill ratio target

The rendered model should occupy approximately 70-85% of the image width or height. This is achieved
by the 1.15-1.30 margin above. Do not rely on visual judgment such as "looks good".

## Visible-object bounding box rule

For filtered renders, always compute camera center and fov from the objects that remain visible in the
image, not from the original full trajectory. Examples:

- Cu-dislocation interaction image: use the bounding box of Cu atoms plus dislocation lines.
- Defect-only image: use the bounding box of retained defect atoms.
- Local fracture image: use the local crop bounding box.
- Full fracture morphology image: use the full visible atom set.

This rule prevents tiny off-center renders after hiding most atoms. Record the visible bbox and fill
margin in the manifest.

## Fixed scale rule for comparison figures

For any multi-case or multi-frame comparison set, images of the same render type and same view must
use the same final scale. Do not let each frame choose its own fov independently.

Required procedure:

1. Pre-scan all cases/frames in the comparison set.
2. Compute each image's visible-object bbox.
3. For each `render_type + view`, compute the required fov for every image.
4. Use the maximum fov for all images in that `render_type + view` group.
5. Still center each image on its own visible bbox center.

Example: all front-view Cu-dislocation interaction images must share one fixed front-view fov; all
top-view images share one fixed top-view fov; fracture local images use their own fixed local-view fov
set, separate from fracture global images.

## Custom view policy

If the user requests a custom angle:

- Still render standard views first unless the user explicitly says not to.
- Use the standard-view manifest as a baseline for frame, colors, and model size.
- Record the custom camera vector and reason in the manifest.

## Failure behavior

If OVITO rendering fails:

- Retry with `OpenGLRenderer` if `TachyonRenderer` fails.
- Reduce image size for a preview if memory is the issue.
- Do not replace atomistic rendering with matplotlib scatter.
- Report the failure and fallback in the final message and manifest.
