# Troubleshooting

## `ovito` import fails

- Verify the Python environment has OVITO installed.
- Try `python -c "import ovito; print(ovito.version)"`.
- Do not replace OVITO rendering with matplotlib if the import fails; report the missing dependency.

## Tachyon renderer fails

- Retry with `OpenGLRenderer`.
- Record the fallback in `render_manifest.json`.
- For headless environments, OpenGL may also fail; report the environment issue clearly.

## The model may be clipped

- Use `zoom_all()` after adding the pipeline to the scene.
- If clipping persists, switch to manual bounding-box camera mode.
- Increase manual margin from `1.20` to `1.30`.

## The output has unexpected colors

- Check whether a modifier changed particle colors.
- Confirm no custom color code was added.
- Restore OVITO defaults unless the user requested custom colors.

## The trajectory has too many frames

- Render requested frame(s) only.
- If unspecified, use first, middle, and last frames for keyframe previews.
- Do not render full animations unless explicitly requested.
