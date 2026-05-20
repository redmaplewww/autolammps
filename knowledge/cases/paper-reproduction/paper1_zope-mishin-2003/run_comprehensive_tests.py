#!/usr/bin/env python3
"""Comprehensive TiAl EAM tests - comparison with Zope & Mishin 2003 paper."""

import subprocess
import os
import re

OUTDIR = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003"
LAMMPS = (
    "F:/Users/1/AppData/Local/LAMMPS 64-bit 30Mar2026-MSMPI with Python/bin/lmp.exe"
)


def run_lammps(in_content, name):
    in_file = os.path.join(OUTDIR, f"{name}.in")
    log_file = os.path.join(OUTDIR, f"{name}.log")
    with open(in_file, "w") as f:
        f.write(in_content)
    result = subprocess.run(
        [LAMMPS, "-in", in_file, "-log", log_file, "-screen", "none"],
        capture_output=True,
        text=True,
        cwd=OUTDIR,
    )
    with open(log_file) as f:
        return f.read()


def extract_energy(log):
    """Extract energy per atom from log."""
    for line in log.split("\n"):
        if "Energy per atom" in line or "E = " in line or "E_pot" in line:
            m = re.findall(r"[-+]?\d*\.\d+", line)
            if m:
                return float(m[-1])
    return None


results = {}

# =====================================================================
# TEST 1: Al fcc (reference)
# =====================================================================
print("Running: Al fcc reference...")
inp = """units metal
atom_style atomic
boundary p p p
lattice fcc 4.05
region box block 0 4 0 4 0 4 units lattice
create_box 1 box
create_atoms 1 box
mass 1 26.982
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Al
neighbor 2.0 bin
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
print "E_Al_fcc = ${E}"
"""
log = run_lammps(inp, "t1_Al_fcc")
for line in log.split("\n"):
    if "E_Al_fcc" in line:
        print(f"  {line.strip()}")
        m = re.findall(r"[-+]?\d*\.\d+", line)
        if m:
            results["Al_fcc"] = float(m[-1])

# =====================================================================
# TEST 2: Ti hcp (reference)
# =====================================================================
print("Running: Ti hcp reference...")
inp = """units metal
atom_style atomic
boundary p p p
lattice hcp 2.95
region box block 0 4 0 4 0 3 units lattice
create_box 1 box
create_atoms 1 box
mass 1 47.867
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti
neighbor 2.0 bin
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
print "E_Ti_hcp = ${E}"
"""
log = run_lammps(inp, "t2_Ti_hcp")
for line in log.split("\n"):
    if "E_Ti_hcp" in line:
        print(f"  {line.strip()}")
        m = re.findall(r"[-+]?\d*\.\d+", line)
        if m:
            results["Ti_hcp"] = float(m[-1])

# =====================================================================
# TEST 3: TiAl L1_0 at paper's lattice constants (no relaxation)
# =====================================================================
print("Running: TiAl L1_0 at paper lattice constants...")
inp = """units metal
atom_style atomic
boundary p p p
lattice custom 3.998 a1 1.0 0.0 0.0 a2 0.0 1.0 0.0 a3 0.0 0.0 4.187 &
  basis 0.0 0.0 0.0 basis 0.5 0.5 0.0 basis 0.5 0.0 0.5 basis 0.0 0.5 0.5
region box block 0 4 0 4 0 4 units lattice
create_box 2 box
create_atoms 1 box basis 1 2 basis 2 2 basis 3 1 basis 4 1
mass 1 47.867
mass 2 26.982
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti Al
neighbor 2.0 bin
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
variable a_eq equal lx/4
variable c_eq equal lz/4
variable ca_eq equal lz/lx
print "E_TiAl = ${E}"
print "a_eq = ${a_eq}, c_eq = ${c_eq}, c/a = ${ca_eq}"
"""
log = run_lammps(inp, "t3_TiAl_lat")
for line in log.split("\n"):
    if "E_TiAl" in line or "a_eq" in line or "c_eq" in line:
        print(f"  {line.strip()}")
        m = re.findall(r"[-+]?\d*\.\d+", line)
        if m and "E_TiAl" in line:
            results["TiAl_E"] = float(m[-1])

# =====================================================================
# SUMMARY
# =====================================================================
print("\n" + "=" * 70)
print("SUMMARY OF RESULTS")
print("=" * 70)

E_Al = results.get("Al_fcc", "N/A")
E_Ti = results.get("Ti_hcp", "N/A")
E_TiAl = results.get("TiAl_E", "N/A")

print(f"Al fcc (EAM):      {E_Al:.3f} eV/atom  (expected: -3.36)")
print(f"Ti hcp (EAM):      {E_Ti:.3f} eV/atom  (expected: ~-4.87)")
print(f"TiAl L1_0 (EAM):   {E_TiAl:.3f} eV/atom  (expected: -4.509)")

if isinstance(E_TiAl, float) and isinstance(E_Ti, float) and isinstance(E_Al, float):
    E_form = E_TiAl - 0.5 * E_Ti - 0.5 * E_Al
    print(f"\nTiAl formation energy (EAM): {E_form:.3f} eV/atom")
    print(f"Paper formation energy:     -0.404 eV/atom")
    print(f"Discrepancy: {abs(E_form - (-0.404)):.3f} eV/atom")
    if abs(E_form - (-0.404)) < 0.1:
        print("MATCH!")
    else:
        print("MISMATCH - Ti-Al cross potential issue")
else:
    print("Could not compute formation energy")

print("=" * 70)
