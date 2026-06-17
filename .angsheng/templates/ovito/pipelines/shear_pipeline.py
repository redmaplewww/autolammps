"""
Metal Shear - Standard Analysis Pipeline
=========================================
Combines CNA, DXA, stress field rendering, and shear stress data
extraction for shear deformation simulations.

Inputs:
  - dump file (e.g., dump.lammpstrj)
  - log.lammps (for shear stress data)

Outputs:
  figures/
    initial_snapshot.png        - OVITO initial structure
    final_snapshot.png          - OVITO deformed structure
    cna_initial.png             - CNA at start
    cna_final.png               - CNA at end
    cna_evolution.csv           - CNA phase fractions vs frame
    shear_data.csv              - Shear strain, shear stress vs frame
"""

import sys
import os
import json
import csv
from pathlib import Path

from render_engine import RenderEngine
from ovito.modifiers import CommonNeighborAnalysisModifier

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


def run_dxa_final(engine: RenderEngine, output_dir: Path, frame: int):
    if not DXA_AVAILABLE:
        return
    dxa_mod = DislocationAnalysisModifier()
    engine.add_modifier(dxa_mod)
    engine.add_to_scene()
    engine.render(str(output_dir / "dislocation_final.png"), frame=frame)
    engine.remove_from_scene()
    engine.pipeline.modifiers.clear()


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


def extract_shear_data(log_path: str, output_dir: Path):
    csv_path = output_dir / "shear_data.csv"
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

    col_xy = "Pxy"
    col_lx = "Lx"
    col_ly = "Ly"

    lx0 = thermo_lines[0].get(col_lx)
    ly0 = thermo_lines[0].get(col_ly)

    shear_rows = []
    for row in thermo_lines:
        pxy = row.get(col_xy, 0)
        shear_stress_gpa = -pxy / 10000.0
        shear_rows.append(
            {
                "step": row.get("Step", 0),
                "shear_stress_gpa": shear_stress_gpa,
                "temp": row.get("Temp", 0),
                "poteng": row.get("PotEng", 0),
            }
        )

    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["step", "shear_stress_gpa", "temp", "poteng"])
        w.writeheader()
        w.writerows(shear_rows)

    return shear_rows


def main():
    if len(sys.argv) < 3:
        print("Usage: python shear_pipeline.py <dump_file> <log_file> [output_dir]")
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

    print("\n[1/4] Structure snapshots...")
    run_snapshots(engine, output_dir, first_frame, last_frame)

    print("[2/4] CNA evolution...")
    cna_rows = run_cna_evolution(engine, output_dir, frame_indices)

    print("[3/4] DXA dislocations...")
    run_dxa_final(engine, output_dir, last_frame)

    print("[4/4] Shear stress extraction...")
    shear_rows = None
    if os.path.exists(log_file):
        shear_rows = extract_shear_data(log_file, output_dir)

    manifest = {
        "pipeline": "shear",
        "dump_file": dump_file,
        "log_file": log_file,
        "total_frames": nf,
        "analyzed_frames": len(frame_indices),
        "dxa_available": DXA_AVAILABLE,
        "outputs": {
            "initial_snapshot": str(output_dir / "initial_snapshot.png"),
            "final_snapshot": str(output_dir / "final_snapshot.png"),
            "final_tachyon": str(output_dir / "final_tachyon.png"),
            "cna_initial": str(output_dir / "cna_initial.png"),
            "cna_final": str(output_dir / "cna_final.png"),
            "cna_evolution_csv": str(output_dir / "cna_evolution.csv"),
        },
    }

    if DXA_AVAILABLE:
        manifest["outputs"]["dislocation_final"] = str(
            output_dir / "dislocation_final.png"
        )

    if shear_rows:
        manifest["outputs"]["shear_data_csv"] = str(output_dir / "shear_data.csv")

    with open(output_dir / "pipeline_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    print(f"\nDone. Manifest: {output_dir / 'pipeline_manifest.json'}")
    print("NOTE: shear_stress_strain.png requires matplotlib (separate step).")


if __name__ == "__main__":
    main()
