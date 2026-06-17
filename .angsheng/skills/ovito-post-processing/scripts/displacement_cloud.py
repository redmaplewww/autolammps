"""Render displacement magnitude cloud maps using OVITO displacement vectors."""

from __future__ import annotations

import argparse

from render_engine import OvitoRenderEngine, add_common_cli


def main() -> None:
    parser = add_common_cli(argparse.ArgumentParser(description=__doc__))
    parser.add_argument(
        "--prefix", default="displacement", help="Output filename prefix"
    )
    parser.add_argument(
        "--reference-frame", type=int, default=0, help="Reference frame"
    )
    args = parser.parse_args()

    from ovito.modifiers import CalculateDisplacementsModifier, ColorCodingModifier

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
    source_frame = args.reference_frame
    if getattr(engine.pipeline.source, "num_frames", 1) <= 1:
        engine.manifest["warnings"] = [
            "Input contains one frame; displacement magnitude will be zero because reference and current frames are identical."
        ]
        source_frame = 0
    engine.add_modifier(
        CalculateDisplacementsModifier(reference_frame=source_frame),
        name=f"CalculateDisplacementsModifier(reference_frame={source_frame})",
    )
    engine.add_modifier(
        ColorCodingModifier(property="Displacement Magnitude"),
        name="ColorCodingModifier(Displacement Magnitude)",
    )
    engine.manifest["color_policy"] = {
        "mode": "scalar_coloring_required",
        "custom_colors": False,
        "property": "Displacement Magnitude",
        "reason": "Displacement cloud map requested",
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
