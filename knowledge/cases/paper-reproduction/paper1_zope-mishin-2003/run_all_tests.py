#!/usr/bin/env python3
"""
Compute Ti-Al EAM potential properties using LAMMPS.
"""

import subprocess
import os

OUTDIR = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003"
POTENTIAL = "Zope-Ti-Al-2003.eam.alloy"
LAMMPS = (
    "F:/Users/1/AppData/Local/LAMMPS 64-bit 30Mar2026-MSMPI with Python/bin/lmp.exe"
)


def run_lammps(in_content, name):
    """Run LAMMPS with given input and return the log content."""
    in_file = os.path.join(OUTDIR, f"{name}.in")
    log_file = os.path.join(OUTDIR, f"{name}.log")
    with open(in_file, "w") as f:
        f.write(in_content)
    # Remove old log
    if os.path.exists(log_file):
        os.remove(log_file)
    result = subprocess.run(
        [LAMMPS, "-in", in_file, "-log", log_file, "-screen", "none"],
        capture_output=True,
        text=True,
        cwd=OUTDIR,
    )
    with open(log_file) as f:
        return f.read()


# =====================================================================
# Test 1: Al fcc reference (should be -3.36 eV/atom)
# =====================================================================
print("=" * 60)
print("TEST 1: Al fcc (256 atoms)")
print("=" * 60)
al_fcc_input = """units metal
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
neigh_modify delay 5 every 1
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
print ""
print "Al fcc: E = ${E} eV/atom"
print "Expected: -3.36 eV/atom"
"""
log = run_lammps(al_fcc_input, "test1_al_fcc")
for line in log.split("\n"):
    if "Al fcc" in line or "Expected" in line or "eV/atom" in line.lower():
        print(line)

# =====================================================================
# Test 2: Ti hcp (should be ~-4.87 eV/atom)
# =====================================================================
print("\n" + "=" * 60)
print("TEST 2: Ti hcp (192 atoms)")
print("=" * 60)
ti_hcp_input = """units metal
atom_style atomic
boundary p p p
# Standard hcp: a=2.95, c/a=sqrt(8/3)=1.633
lattice hcp 2.95
region box block 0 4 0 4 0 4 units lattice
create_box 1 box
create_atoms 1 box
mass 1 47.867
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti
neighbor 2.0 bin
neigh_modify delay 5 every 1
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
print ""
print "Ti hcp: E = ${E} eV/atom"
print "Expected: ~-4.87 eV/atom"
"""
log = run_lammps(ti_hcp_input, "test2_ti_hcp")
for line in log.split("\n"):
    if "Ti hcp" in line or "Expected" in line or "eV/atom" in line.lower():
        print(line)

# =====================================================================
# Test 3: TiAl L1_0 at paper lattice constants
# =====================================================================
print("\n" + "=" * 60)
print("TEST 3: TiAl L1_0 at a=3.998, c/a=1.047")
print("=" * 60)
tial_input = """units metal
atom_style atomic
boundary p p p
# L1_0 structure: a=3.998, c=4.187
lattice custom 3.998 a1 1.0 0.0 0.0 a2 0.0 1.0 0.0 a3 0.0 0.0 4.187 &
  basis 0.0 0.0 0.0 basis 0.5 0.0 0.5 basis 0.0 0.5 0.5 basis 0.5 0.5 0.0
region box block 0 4 0 4 0 4 units lattice
create_box 2 box
# Al at basis 1,4 (type 2); Ti at basis 2,3 (type 1)
create_atoms 1 box basis 1 2 basis 2 1 basis 3 1 basis 4 2
mass 1 47.867
mass 2 26.982
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti Al
neighbor 2.0 bin
neigh_modify delay 5 every 1
minimize 1e-10 1e-10 10000 100000
variable E equal pe/count(all)
variable Etot equal pe
print ""
print "TiAl L1_0: E = ${E} eV/atom (total: ${Etot} eV)"
print "Expected: -4.509 eV/atom"
print "Formation: should be -0.404 eV/atom"
"""
log = run_lammps(tial_input, "test3_tial")
for line in log.split("\n"):
    if (
        "TiAl" in line
        or "Expected" in line
        or "Formation" in line
        or "eV/atom" in line.lower()
    ):
        print(line)

# =====================================================================
# Test 4: Ti hcp with EXACT lattice params from EAM minimum
# =====================================================================
print("\n" + "=" * 60)
print("TEST 4: Ti hcp relaxation (find equilibrium a, c)")
print("=" * 60)
ti_relax_input = """units metal
atom_style atomic
boundary p p p
# Use standard hcp lattice
lattice hcp 2.95
region box block 0 6 0 6 0 3 units lattice
create_box 1 box
create_atoms 1 box
mass 1 47.867
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti
# Minimize with box relaxation
minimize 1e-10 1e-10 10000 100000
variable a0 equal vol^(1.0/3.0)
variable c0 equal (lz/lx)*2.95*sqrt(2/3)
variable E equal pe/count(all)
print ""
print "Ti hcp after relaxation:"
print "E = ${E} eV/atom"
print "Expected: ~-4.87 eV/atom"
"""
log = run_lammps(ti_relax_input, "test4_ti_relax")
for line in log.split("\n"):
    if (
        "Ti hcp" in line
        or "Expected" in line
        or "E =" in line
        or "eV/atom" in line.lower()
    ):
        print(line)

print("\n" + "=" * 60)
print("ANALYSIS")
print("=" * 60)
print("If Ti hcp gives ~-3.37 eV/atom (same as Al), the potential may be")
print("treating Ti as having the same energy as Al, OR the structure is wrong.")
print("If TiAl gives -2.51 eV/atom instead of -4.509, there's a ~2 eV discrepancy.")
