#!/usr/bin/env python3
"""
Comprehensive TiAl EAM potential tests using LAMMPS.
"""

import subprocess
import os
import re

OUTDIR = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003"
POTENTIAL = "Zope-Ti-Al-2003.eam.alloy"
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


# =====================================================================
# A. Lattice constants of TiAl L1_0 (with box relaxation)
# =====================================================================
print("=" * 70)
print("A. LATTICE CONSTANTS OF TiAl L1_0")
print("=" * 70)

lattice_input = """units metal
atom_style atomic
boundary p p p

# TiAl L1_0: Create supercell and relax
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
neigh_modify delay 5 every 1

# Relax box
fix 1 all box/relax x 0.0 y 0.0 z 0.0
minimize 1e-10 1e-10 10000 100000
unfix 1

variable a_eq equal lx/4
variable c_eq equal lz/4
variable ca_eq equal lz/lx
variable Etot equal pe
variable Eper equal pe/256

print ""
print "Relaxed lattice constants:"
print "a = ${a_eq} Angstrom (expected: 3.998)"
print "c = ${c_eq} Angstrom (expected: 3.998*1.047=4.187)"
print "c/a = ${ca_eq} (expected: 1.047)"
print "Energy = ${Eper} eV/atom (expected: -4.509)"
"""

log = run_lammps(lattice_input, "lat_const_scan")
for line in log.split("\n"):
    if "a = " in line or "c = " in line or "c/a = " in line or "Energy = " in line:
        print(line)

# =====================================================================
# B. REFERENCE ENERGIES
# =====================================================================
print("\n" + "=" * 70)
print("B. REFERENCE ENERGIES (EAM-computed)")
print("=" * 70)

ref_input = """units metal
atom_style atomic
boundary p p p

# Al fcc
lattice fcc 4.05
region box_fcc block 0 4 0 4 0 4 units lattice
create_box 1 box_fcc
create_atoms 1 box
mass 1 26.982
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Al
neighbor 2.0 bin
minimize 1e-10 1e-10 10000 100000
variable E_Al equal pe/count(all)
print "Al fcc: ${E_Al} eV/atom (expected: -3.36)"

clear

# Ti hcp
lattice hcp 2.95
region box_hcp block 0 4 0 4 0 3 units lattice
create_box 1 box_hcp
create_atoms 1 box
mass 1 47.867
pair_style eam/alloy
pair_coeff * * Zope-Ti-Al-2003.eam.alloy Ti
neighbor 2.0 bin
minimize 1e-10 1e-10 10000 100000
variable E_Ti equal pe/count(all)
print "Ti hcp: ${E_Ti} eV/atom (expected: -4.87)"
"""

log = run_lammps(ref_input, "ref_energies")
for line in log.split("\n"):
    if "Al fcc:" in line or "Ti hcp:" in line:
        print(line)

# =====================================================================
# C. TiAl L1_0 FORMATION ENERGY
# =====================================================================
print("\n" + "=" * 70)
print("C. TiAl L1_0 FORMATION ENERGY")
print("=" * 70)

# Compute TiAl energy
tial_input = """units metal
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
variable E_TiAl equal pe/count(all)
print ""
print "E_pot(TiAl) = ${E_TiAl} eV/atom"
print "E_pot(Al fcc) = -3.36 eV/atom"
print "E_pot(Ti hcp) = -4.84 eV/atom"
print "E_form = E_pot(TiAl) - 0.5*E_pot(Ti) - 0.5*E_pot(Al)"
print "E_form = ${E_TiAl} - 0.5*(-4.84) - 0.5*(-3.36)"
print "Expected E_form = -0.404 eV/atom"
"""

log = run_lammps(tial_input, "tial_formation")
for line in log.split("\n"):
    if "E_pot" in line or "E_form" in line or "Expected" in line:
        print(line)

print("\n" + "=" * 70)
print("ANALYSIS: If formation energy is wrong, the Ti-Al cross potential is wrong.")
print("=" * 70)
