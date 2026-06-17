"""Render velocity magnitude cloud maps when velocity vectors are available."""

from __future__ import annotations

import argparse

from render_engine import OvitoRenderEngine, add_common_cli


def main() -> None:
    parser = add_common_cli(argparse.ArgumentParser(description=__doc__))
    parser.add_argument("--prefix", default="velocity", help="Output filename prefix")
    args = parser.parse_args()

    from ovito.modifiers import ColorCodingModifier, ComputePropertyModifier

    engine = OvitoRenderEngine(
        input_file=args.input_file,
        output_dir=args.output_dir,
        frame=args.frame,
        width=args.width,
        height=args.height,
        renderer=args.renderer,
    )
    engine.load()
    data = engine.pipeline.compute(args.frame)
    particles = getattr(data, "particles", {})
    if "Velocity" not in particles:
        engine.manifest["warnings"] = [
            "Velocity property is absent; velocity cloud map was skipped."
        ]
        path = engine.write_manifest()
        print(f"Velocity property absent. Wrote manifest: {path}")
        return
    engine.add_modifier(
        ComputePropertyModifier(
            output_property="Velocity Magnitude",
            expressions=["sqrt(Velocity.X^2 + Velocity.Y^2 + Velocity.Z^2)"],
        ),
        name="ComputePropertyModifier(Velocity Magnitude)",
    )
    engine.add_modifier(
        ColorCodingModifier(property="Velocity Magnitude"),
        name="ColorCodingModifier(Velocity Magnitude)",
    )
    engine.manifest["color_policy"] = {
        "mode": "scalar_coloring_required",
        "custom_colors": False,
        "property": "Velocity Magnitude",
        "reason": "Velocity cloud map requested",
    }
    zoom_method = "manual_bbox" if args.manual_camera else "zoom_all"
    if args.extended_views:
        engine.render_extended_views(prefix=args.prefix, zoom_method=zoom_method)
    else:
        engine.render_standard_views(prefix=args.prefix, zoom_method=zoom_method)
    path = engine.write_manifest()
    print(f"Wrote manifest: {path}")


if __name__ == "__main__":
    main()
