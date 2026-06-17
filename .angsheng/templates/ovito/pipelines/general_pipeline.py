"""
General Simulation - Standard Analysis Pipeline
================================================
For simulations that don't fit a specific type.
Produces basic structure snapshots, CNA analysis, and thermo evolution.

Inputs:
  - dump file (e.g., dump.lammpstrj)
  - log.lammps (optional, for thermo data)

Outputs:
  figures/
    snapshot.png                - OVITO structure snapshot
    snapshot_tachyon.png        - Tachyon high-quality snapshot
    cna_snapshot.png            - CNA coloring
    multi_view_z.png            - Z-axis view
    multi_view_x.png            - X-axis view
    multi_view_y.png            - Y-axis view
    thermo_data.csv             - All thermo columns (if log available)
"""

import sys
import os
import json
import csv
from pathlib import Path

from render_engine import RenderEngine
from ovito.modifiers import CommonNeighborAnalysisModifier


def run_general_analysis(
    dump_file: str, log_file: str = "", output_dir: Path = Path("figures")
):
    output_dir.mkdir(parents=True, exist_ok=True)

    engine = RenderEngine(dump_file, multiple_frames=True)
    nf = engine.num_frames
    target_frame = nf - 1 if nf > 1 else 0

    print(f"Dump: {dump_file} ({nf} frames, rendering frame {target_frame})")

    print("\n[1/4] Basic snapshots...")
    engine.add_to_scene()
    engine.render(str(output_dir / "snapshot.png"), frame=target_frame)
    engine.render(
        str(output_dir / "snapshot_tachyon.png"), frame=target_frame, renderer="tachyon"
    )
    engine.render_multiple_views(
        str(output_dir / "multi_view"),
        frame=target_frame,
        views=("x", "y", "z"),
    )
    engine.remove_from_scene()

    print("[2/4] CNA analysis...")
    cna_mod = CommonNeighborAnalysisModifier()
    engine.add_modifier(cna_mod)
    engine.add_to_scene()
    data = engine.compute(target_frame)
    structures = data.particles["Structure Type"]
    total = len(structures)
    cna_counts = {}
    if total > 0:
        for i in range(total):
            key = int(structures[i])
            cna_counts[key] = cna_counts.get(key, 0) + 1
    engine.render(str(output_dir / "cna_snapshot.png"), frame=target_frame)
    engine.remove_from_scene()

    cna_csv_path = output_dir / "cna_summary.csv"
    with open(cna_csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["structure_type", "count", "fraction"])
        for key, val in sorted(cna_counts.items()):
            w.writerow([key, val, val / total if total > 0 else 0])

    engine.pipeline.modifiers.clear()

    print("[3/4] Thermo data extraction...")
    thermo_rows = None
    if log_file and os.path.exists(log_file):
        thermo_lines = []
        header = None
        header_found = False
        with open(log_file) as f:
            for line in f:
                stripped = line.strip()
                if stripped.startswith("Step"):
                    header = stripped.split()
                    header_found = True
                    continue
                if header_found and header is not None:
                    parts = stripped.split()
                    if len(parts) == len(header):
                        try:
                            row = [float(x) for x in parts]
                            thermo_lines.append(dict(zip(header, row)))
                        except ValueError:
                            header_found = False
        if thermo_lines:
            csv_path = output_dir / "thermo_data.csv"
            with open(csv_path, "w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=list(thermo_lines[0].keys()))
                w.writeheader()
                w.writerows(thermo_lines)
            thermo_rows = thermo_lines

    print("[4/4] Writing manifest...")
    manifest = {
        "pipeline": "general",
        "dump_file": dump_file,
        "log_file": log_file,
        "total_frames": nf,
        "target_frame": target_frame,
        "cna_summary": {str(k): v for k, v in cna_counts.items()},
        "outputs": {
            "snapshot": str(output_dir / "snapshot.png"),
            "snapshot_tachyon": str(output_dir / "snapshot_tachyon.png"),
            "cna_snapshot": str(output_dir / "cna_snapshot.png"),
            "cna_summary_csv": str(output_dir / "cna_summary.csv"),
            "multi_view_z": str(output_dir / "multi_view_z.png"),
            "multi_view_x": str(output_dir / "multi_view_x.png"),
            "multi_view_y": str(output_dir / "multi_view_y.png"),
        },
    }
    if thermo_rows:
        manifest["outputs"]["thermo_data_csv"] = str(output_dir / "thermo_data.csv")

    with open(output_dir / "pipeline_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    print(f"\nDone. Manifest: {output_dir / 'pipeline_manifest.json'}")
    print("NOTE: thermo_evolution.png requires matplotlib (separate step).")


def main():
    if len(sys.argv) < 2:
        print("Usage: python general_pipeline.py <dump_file> [log_file] [output_dir]")
        sys.exit(1)

    dump_file = sys.argv[1]
    log_file = sys.argv[2] if len(sys.argv) > 2 else ""
    output_dir = Path(sys.argv[3]) if len(sys.argv) > 3 else Path("figures")

    run_general_analysis(dump_file, log_file, output_dir)


if __name__ == "__main__":
    main()
