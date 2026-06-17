# Rendering Standards

These standards apply to OVITO atomistic rendering outputs.

## Required outputs

Each rendering run should produce:

- Front, side, and top standard views, unless explicitly skipped by the user.
- Extra isometric/diagonal views when practical.
- `render_manifest.json`.
- Descriptive filenames with frame and view labels.

Example filenames:

```text
snapshot_frame_000000_front.png
snapshot_frame_000000_side.png
snapshot_frame_000000_top.png
snapshot_frame_000000_iso.png
cna_frame_001000_front.png
```

## Image size

- Preview: `1200x900`
- Final: `2000x1600`
- Paper figure: at least `3000` px wide if requested

## Renderer selection

Use this priority:

1. `TachyonRenderer` for final static images.
2. `OpenGLRenderer` for previews or fallback.
3. Other OVITO renderers only when explicitly needed and available.

Always record the renderer in the manifest. If fallback occurs, record the failed renderer and error.

## Scientific clarity

- Avoid decorative backgrounds, shadows, labels, or effects unless requested.
- Keep the model centered and uncropped.
- Use orthographic projection for standard views.
- Add perspective/custom views only after standard views.

## Prohibited shortcuts

- Do not render atoms with matplotlib scatter, plotly, Blender, or custom OpenGL when OVITO is required.
- Do not judge quality by saying the image "looks good" without camera/zoom evidence.
- Do not silently skip manifest generation.
