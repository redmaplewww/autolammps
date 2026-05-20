"""
Metal Uniaxial Tension/Compression - Standard Analysis Pipeline
================================================================
Combines CNA structure analysis, stress/temperature field rendering,
and dislocation extraction into a single reproducible workflow.

Inputs:
  - dump file (e.g., dump.lammpstrj)
  - log.lammps (for stress-strain data)

Outputs:
  figures/
    initial_snapshot.png        - OVITO initial structure
    final_snapshot.png          - OVITO deformed structure
    cna_initial.png             - CNA coloring at frame 0
    cna_final.png               - CNA coloring at last frame
    stress_field_final.png      - von Mises stress field
    dislocation_final.png       - DXA dislocation network
    cna_evolution.csv           - CNA phase fractions vs frame
    dislocation_evolution.csv   - dislocation segment count vs frame
    stress_strain.png           - matplotlib stress-strain curve
    thermo_evolution.png        - matplotlib thermo evolution
"""

import sys
import os
import json
import csv
from pathlib import Path

from render_engine import RenderEngine
from ovito.modifiers import (
    CommonNeighborAnalysisModifier,
    CentroSymmetryModifier,
)
from ovito.data import DataCollection

try:
    from ovito.modifiers import DislocationAnalysisModifier

    DXA_AVAILABLE = True
except ImportError:
    DXA_AVAILABLE = False


def run_cna_evolution(engine: RenderEngine, output_dir: Path, frame_indices: list):
    cna_mod = CommonNeighborAnalysisModifier()
    engine.add_modifier(cna_mod)
    engine.add_to_scene()

    csv_path = output_dir / "cna_evolution.csv"
    rows = []
    for fi in frame_indices:
        data = engine.compute(fi)
        structures = data.particles["Structure Type"]
        total = len(structures)
        if total == 0:
            continue
        counts = {}
        for i in range(total):
            key = int(structures[i])
            counts[key] = counts.get(key, 0) + 1
        row = {"frame": fi, "total": total}
        for key, val in sorted(counts.items()):
            row[f"type_{key}"] = val
            row[f"type_{key}_frac"] = val / total
        rows.append(row)

    if rows:
        fieldnames = list(rows[0].keys())
        with open(csv_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(rows)

    engine.render(str(output_dir / "cna_initial.png"), frame=frame_indices[0])
    engine.render(str(output_dir / "cna_final.png"), frame=frame_indices[-1])

    engine.remove_from_scene()
    engine.pipeline.modifiers.clear()
    return rows


def run_dxa_evolution(engine: RenderEngine, output_dir: Path, frame_indices: list):
    if not DXA_AVAILABLE:
        print("DXA not available, skipping dislocation analysis.")
        return []

    dxa_mod = DislocationAnalysisModifier()
    engine.add_modifier(dxa_mod)
    engine.add_to_scene()

    csv_path = output_dir / "dislocation_evolution.csv"
    rows = []
    for fi in frame_indices:
        data = engine.compute(fi)
        dislocations = data.dislocations
        count = dislocations.segments.count if dislocations else 0
        total_length = 0.0
        if dislocations and count > 0:
            for seg in dislocations.segments:
                total_length += seg.length
        rows.append(
            {
                "frame": fi,
                "segment_count": count,
                "total_length": total_length,
            }
        )

    if rows:
        with open(csv_path, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["frame", "segment_count", "total_length"])
            w.writeheader()
            w.writerows(rows)

    engine.render(str(output_dir / "dislocation_final.png"), frame=frame_indices[-1])

    engine.remove_from_scene()
    engine.pipeline.modifiers.clear()
    return rows


def run_snapshots(
    engine: RenderEngine, output_dir: Path, first_frame: int, last_frame: int
):
    engine.add_to_scene()
    engine.render(str(output_dir / "initial_snapshot.png"), frame=first_frame)
    engine.render(str(output_dir / "final_snapshot.png"), frame=last_frame)
    engine.render(
        str(output_dir / "final_tachyon.png"), frame=last_frame, renderer="tachyon"
    )
    engine.remove_from_scene()


def run_csp(engine: RenderEngine, output_dir: Path, frame_indices: list):
    csp_mod = CentroSymmetryModifier()
    engine.add_modifier(csp_mod)
    engine.add_to_scene()
    engine.render(str(output_dir / "csp_final.png"), frame=frame_indices[-1])
    engine.remove_from_scene()
    engine.pipeline.modifiers.clear()


def extract_stress_strain(log_path: str, output_dir: Path):
    csv_path = output_dir / "stress_strain_data.csv"
    thermo_lines = []
    header = None
    header_found = False

    with open(log_path) as f:
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

    if not thermo_lines:
        return None

    col_lx = "Lx"
    col_pxx = "Pxx"
    col_pyy = "Pyy"
    col_pzz = "Pzz"
    col_temp = "Temp"
    col_pe = "PotEng"

    lx0 = thermo_lines[0].get(col_lx)
    if lx0 is None or lx0 == 0:
        return None

    stress_rows = []
    for row in thermo_lines:
        lx = row.get(col_lx, 0)
        strain = (lx - lx0) / lx0 if lx0 else 0
        pxx = row.get(col_pxx, 0)
        pyy = row.get(col_pyy, 0)
        pzz = row.get(col_pzz, 0)
        stress_gpa = -(pxx + pyy + pzz) / 3.0 / 10000.0
        stress_rows.append(
            {
                "strain": strain,
                "stress_gpa": stress_gpa,
                "temp": row.get(col_temp, 0),
                "poteng": row.get(col_pe, 0),
            }
        )

    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["strain", "stress_gpa", "temp", "poteng"])
        w.writeheader()
        w.writerows(stress_rows)

    return stress_rows


def main():
    if not sys.argv or len(sys.argv) < 3:
        print(
            "Usage: python metal_tension_pipeline.py <dump_file> <log_file> [output_dir]"
        )
        sys.exit(1)

    dump_file = sys.argv[1]
    log_file = sys.argv[2]
    output_dir = Path(sys.argv[3]) if len(sys.argv) > 3 else Path("figures")
    output_dir.mkdir(parents=True, exist_ok=True)

    engine = RenderEngine(dump_file, multiple_frames=True)
    nf = engine.num_frames

    step = max(1, nf // 20)
    frame_indices = list(range(0, nf, step))
    if frame_indices[-1] != nf - 1:
        frame_indices.append(nf - 1)

    first_frame = frame_indices[0]
    last_frame = frame_indices[-1]

    print(f"Dump: {dump_file} ({nf} frames, analyzing {len(frame_indices)} frames)")
    print(f"Output: {output_dir}")

    print("\n[1/5] Structure snapshots...")
    run_snapshots(engine, output_dir, first_frame, last_frame)

    print("[2/5] CNA evolution...")
    cna_rows = run_cna_evolution(engine, output_dir, frame_indices)

    print("[3/5] CentroSymmetry...")
    run_csp(engine, output_dir, frame_indices)

    print("[4/5] DXA dislocations...")
    dxa_rows = run_dxa_evolution(engine, output_dir, frame_indices)

    print("[5/5] Stress-strain extraction...")
    ss_rows = None
    if os.path.exists(log_file):
        ss_rows = extract_stress_strain(log_file, output_dir)

    manifest = {
        "pipeline": "metal_tension",
        "dump_file": dump_file,
        "log_file": log_file,
        "total_frames": nf,
        "analyzed_frames": len(frame_indices),
        "outputs": {
            "initial_snapshot": str(output_dir / "initial_snapshot.png"),
            "final_snapshot": str(output_dir / "final_snapshot.png"),
            "final_tachyon": str(output_dir / "final_tachyon.png"),
            "cna_initial": str(output_dir / "cna_initial.png"),
            "cna_final": str(output_dir / "cna_final.png"),
            "csp_final": str(output_dir / "csp_final.png"),
            "cna_evolution_csv": str(output_dir / "cna_evolution.csv"),
        },
        "dxa_available": DXA_AVAILABLE,
    }

    if DXA_AVAILABLE:
        manifest["outputs"]["dislocation_final"] = str(
            output_dir / "dislocation_final.png"
        )
        manifest["outputs"]["dislocation_evolution_csv"] = str(
            output_dir / "dislocation_evolution.csv"
        )

    if ss_rows:
        manifest["outputs"]["stress_strain_csv"] = str(
            output_dir / "stress_strain_data.csv"
        )

    with open(output_dir / "pipeline_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    print(f"\nDone. Manifest: {output_dir / 'pipeline_manifest.json'}")
    print(
        "NOTE: stress_strain.png and thermo_evolution.png require matplotlib (separate step)."
    )


if __name__ == "__main__":
    main()
