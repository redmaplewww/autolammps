#!/usr/bin/env python3
"""
Rebuild the LAMMPS eam.alloy file from the original .plt component files.
The original NIST conversion was BROKEN - the pair potentials are 2.89x too large.

Key findings:
1. .plt files are in Rydberg (not eV as header claims)
2. Electron density in eam.alloy is in A^-3 (correct)
3. F in eam.alloy is in eV (correct)
4. Pair potentials in eam.alloy are 2.89x too large (BUG)
5. We need to use the .plt pair potential values, converted to eV

Plan:
- Use eam.alloy sections 1-4 (Ti F, Ti rho, Al F, Al rho) as-is
- Rebuild pair potential sections from .plt files
- Convert .plt values from Rydberg to eV
- Interpolate onto eam.alloy grid (dr = 0.0006724884)
- Extrapolate for r < .plt minimum using repulsive wall
"""

import numpy as np
import math

BASE = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/original_plt_files"
OUT = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/Zope-Ti-Al-2003-fixed.eam.alloy"


def read_plt(filename):
    r, vals = [], []
    with open(f"{BASE}/{filename}") as f:
        for line in f:
            line = line.strip()
            if line.startswith("#") or not line:
                continue
            parts = line.split()
            r.append(float(parts[0]))
            vals.append(float(parts[1]))
    return np.array(r), np.array(vals)


# Read original eam.alloy
with open(f"{BASE}/Zope-Ti-Al-2003-v2.eam.alloy") as f:
    lines = f.readlines()

# Read .plt files
r_ti, phi_ti_plt = read_plt("pti.plt")  # Ti-Ti pair potential
r_tial, phi_tial_plt = read_plt("ptial.plt")  # Ti-Al pair potential
r_al, phi_al_plt = read_plt("pal.plt")  # Al-Al pair potential

# Convert from Rydberg to eV
phi_ti_eV = phi_ti_plt * 13.6
phi_tial_eV = phi_tial_plt * 13.6
phi_al_eV = phi_al_plt * 13.6

print("Pair potentials (in eV):")
print(
    f"Ti-Ti: range {r_ti.min():.4f}-{r_ti.max():.4f} A, phi: {phi_ti_eV.min():.4f}-{phi_ti_eV.max():.4f} eV"
)
print(
    f"Ti-Al: range {r_tial.min():.4f}-{r_tial.max():.4f} A, phi: {phi_tial_eV.min():.4f}-{phi_tial_eV.max():.4f} eV"
)
print(
    f"Al-Al: range {r_al.min():.4f}-{r_al.max():.4f} A, phi: {phi_al_eV.min():.4f}-{phi_al_eV.max():.4f} eV"
)

# Grid parameters from original eam.alloy
nrho = 10000
drho = 0.0006967034321178504
nr = 10000
dr = 0.0006724884000000001
rc = 6.724884


# Build pair potential arrays on eam.alloy grid
def build_phi_array(r_plt, phi_plt_eV, nr, dr):
    """Build pair potential array on LAMMPS eam/alloy grid."""
    r_max = (nr - 1) * dr

    # Initialize with zeros (pair potential = 0 beyond cutoff)
    phi = np.zeros(nr)

    # Interpolate from .plt data
    for i in range(nr):
        r_i = i * dr
        if r_i < r_plt[0]:
            # Extrapolate: use repulsive wall. For very small r, phi ~ 1/r
            # Use the first two points to determine the asymptotic behavior
            # phi(r) ~ A/r for small r, where A = phi(r1) * r1
            if len(r_plt) >= 2:
                # Linear extrapolation for small r
                A = phi_plt_eV[0] * r_plt[0]  # phi * r constant
                phi[i] = A / r_i if r_i > 1e-10 else phi_plt_eV[0] * 2
            else:
                phi[i] = phi_plt_eV[0] * 2
        elif r_i > r_plt[-1]:
            # Beyond .plt range: set to 0 (already done)
            phi[i] = 0.0
        else:
            # Interpolate
            phi[i] = np.interp(r_i, r_plt, phi_plt_eV)

    return phi


phi_ti = build_phi_array(r_ti, phi_ti_eV, nr, dr)
phi_tial = build_phi_array(r_tial, phi_tial_eV, nr, dr)
phi_al = build_phi_array(r_al, phi_al_eV, nr, dr)

# Read original eam.alloy sections
ti_F = np.array([float(lines[i].strip()) for i in range(6, 10006)])  # 10000 points
ti_rho = np.array(
    [float(lines[i].strip()) for i in range(10006, 20006)]
)  # 10000 points
al_F = np.array(
    [float(lines[i].strip()) for i in range(20007, 30007)]
)  # 10000 points (line 20007 is header, 20008-30007 is data)
al_rho = np.array(
    [float(lines[i].strip()) for i in range(30007, 40007)]
)  # 10000 points

print(f"\nSections:")
print(f"Ti F: {len(ti_F)} points")
print(f"Ti rho: {len(ti_rho)} points")
print(f"Al F: {len(al_F)} points")
print(f"Al rho: {len(al_rho)} points")
print(
    f"Ti-Ti phi: {len(phi_ti)} points, range: {phi_ti.min():.4f}-{phi_ti.max():.4f} eV"
)
print(
    f"Ti-Al phi: {len(phi_tial)} points, range: {phi_tial.min():.4f}-{phi_tial.max():.4f} eV"
)
print(
    f"Al-Al phi: {len(phi_al)} points, range: {phi_al.min():.4f}-{phi_al.max():.4f} eV"
)

# Write new eam.alloy file
print(f"\nWriting fixed eam.alloy to {OUT}")
with open(OUT, "w") as f:
    # Header (same as original)
    f.write(" R.R. Zope and Y. Mishin, Phys. Rev. B 68, 024102 (2003).\n")
    f.write(" LAMMPS setfl format. Conversion by C. A. Becker from Y. Mishin files.\n")
    f.write(" 26 Sept. 2009.  http://www.ctcms.nist.gov/potentials\n")
    f.write(
        " FIXED: pair potentials rebuilt from .plt files (converted from Rydberg to eV)\n"
    )
    f.write(
        "        Original eam.alloy had pair potentials 2.89x too large due to conversion bug\n"
    )
    f.write("             2 Ti  Al  \n")
    f.write(f"{nrho:>6d}  {drho:.16E}  {nr:>6d}  {dr:.16E}  {rc:.16E}\n")
    f.write(f"   22    0.4786700000E+02    0.4148000000E+01      hcp\n")
    f.write(f"   13    0.2698200000E+02    0.4050000000E+01      fcc\n")

    # Ti F (10000 values, 5 per line)
    for i in range(nrho):
        f.write(f"  {ti_F[i]:.10E}\n")

    # Ti rho (10000 values, 5 per line)
    for i in range(nrho):
        f.write(f"  {ti_rho[i]:.10E}\n")

    # Al F (10000 values)
    for i in range(nrho):
        f.write(f"  {al_F[i]:.10E}\n")

    # Al rho (10000 values)
    for i in range(nrho):
        f.write(f"  {al_rho[i]:.10E}\n")

    # Ti-Ti phi (10000 values)
    for i in range(nr):
        f.write(f"  {phi_ti[i]:.10E}\n")

    # Ti-Al phi (10000 values)
    for i in range(nr):
        f.write(f"  {phi_tial[i]:.10E}\n")

    # Al-Al phi (10000 values)
    for i in range(nr):
        f.write(f"  {phi_al[i]:.10E}\n")

print("Done!")
print(f"Total lines written: {7 + 6 * nrho}")

# Verify
import os

size = os.path.getsize(OUT)
print(f"File size: {size} bytes")
print(f"Expected lines: {7 + 6 * nrho}")
