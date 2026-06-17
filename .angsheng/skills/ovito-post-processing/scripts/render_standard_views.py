"""Render front, side, and top OVITO views for one frame."""

from __future__ import annotations

import argparse

from render_engine import OvitoRenderEngine, add_common_cli


def main() -> None:
    parser = add_common_cli(argparse.ArgumentParser(description=__doc__))
    parser.add_argument("--prefix", default="snapshot", help="Output filename prefix")
    args = parser.parse_args()

    engine = OvitoRenderEngine(
        input_file=args.input_file,
        output_dir=args.output_dir,
        frame=args.frame,
        width=args.width,
        height=args.height,
        renderer=args.renderer,
    )
    engine.load()
    zoom_method = "manual_bbox" if args.manual_camera else "zoom_all"
    if args.extended_views:
        engine.render_extended_views(prefix=args.prefix, zoom_method=zoom_method)
    else:
        engine.render_standard_views(prefix=args.prefix, zoom_method=zoom_method)
    path = engine.write_manifest()
    print(f"Wrote manifest: {path}")


if __name__ == "__main__":
    main()
