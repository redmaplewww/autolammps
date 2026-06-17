"""Render Common Neighbor Analysis views with OVITO default CNA colors."""

from __future__ import annotations

import argparse

from render_engine import OvitoRenderEngine, add_common_cli


def main() -> None:
    parser = add_common_cli(argparse.ArgumentParser(description=__doc__))
    parser.add_argument("--prefix", default="cna", help="Output filename prefix")
    args = parser.parse_args()

    from ovito.modifiers import CommonNeighborAnalysisModifier

    engine = OvitoRenderEngine(
        input_file=args.input_file,
        output_dir=args.output_dir,
        frame=args.frame,
        width=args.width,
        height=args.height,
        renderer=args.renderer,
    )
    engine.load()
    engine.add_modifier(
        CommonNeighborAnalysisModifier(), name="CommonNeighborAnalysisModifier"
    )
    engine.manifest["color_policy"] = {
        "mode": "ovito_default_modifier_colors",
        "custom_colors": False,
        "modifier": "CommonNeighborAnalysisModifier",
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
