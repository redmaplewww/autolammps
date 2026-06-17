#!/usr/bin/env python3
"""
Analyze the Zope-Mishin Ti-Al EAM potential files.
Compare original .plt files from NIST with the LAMMPS eam.alloy conversion.
"""

import numpy as np

BASE = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/original_plt_files"


# Read all .plt files
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


# Read LAMMPS eam.alloy file
def read_eam_alloy(filename):
    with open(f"{BASE}/{filename}") as f:
        lines = f.readlines()
    # Parse header
    for i, line in enumerate(lines):
        if "Ti" in line and "Al" in line and line.strip().startswith("2"):
            nelements = 2
            break
    # Find grid parameters
    grid_line = lines[4].strip()
    parts = grid_line.split()
    nrho = int(parts[0])
    drho = float(parts[1])
    nr = int(parts[2])
    dr = float(parts[3])
    if len(parts) > 4:
        rc = float(parts[4])
    else:
        rc = nr * dr
    print(f"Grid: nrho={nrho}, drho={drho:.6e}, nr={nr}, dr={dr:.6e}, rc={rc:.6f}")

    # Parse data
    # Structure: F1(nrho), rho1(nrho), F2(nrho), rho2(nrho), phi11(nr), phi12(nr), phi22(nr)
    # But check actual line counts
    nlines = len(lines)
    print(f"Total lines: {nlines}")

    # Data starts at line 7 (index 6)
    data_lines = []
    for i in range(6, nlines):
        try:
            vals = [float(x) for x in lines[i].strip().split()]
            data_lines.append(vals)
        except:
            print(f"Non-numeric at line {i + 1}: {lines[i][:60]}")
            data_lines.append(None)

    return lines, data_lines, nrho, drho, nr, dr, rc


# Main analysis
print("=" * 60)
print("ANALYSIS OF ZOPE-MISHIN Ti-Al EAM POTENTIAL FILES")
print("=" * 60)

# 1. Check pair potentials
print("\n1. PAIR POTENTIALS (from .plt files):")
print("-" * 40)

r_ti, phi_ti = read_plt("pti.plt")
r_tial, phi_tial = read_plt("ptial.plt")
r_al, phi_al = read_plt("pal.plt")

for name, r, phi in [
    ("Ti-Ti", r_ti, phi_ti),
    ("Ti-Al", r_tial, phi_tial),
    ("Al-Al", r_al, phi_al),
]:
    print(f"{name}:")
    print(f"  Range: {r.min():.4f} to {r.max():.4f} A")
    print(f"  phi at 1.0 A: {np.interp(1.0, r, phi):.4f} eV")
    print(f"  phi at 2.0 A: {np.interp(2.0, r, phi):.4f} eV")
    print(f"  phi at 3.0 A: {np.interp(3.0, r, phi):.4f} eV")
    min_idx = int(phi.argmin())
    print(f"  Min: {phi[min_idx]:.4f} eV at r={r[min_idx]:.4f} A")

# 2. Check embedding functions
print("\n2. EMBEDDING FUNCTIONS (from .plt files):")
print("-" * 40)

r_fti, fti = read_plt("F_ti.plt")
r_fal, fal = read_plt("F_al.plt")

for name, r, F in [("Ti", r_fti, fti), ("Al", r_fal, fal)]:
    print(f"{name}:")
    print(f"  rho range: {r.min():.6f} to {r.max():.4f}")
    print(f"  F at rho_min: {F[0]:.6f} eV")
    print(f"  F at rho_max: {F[-1]:.4f} eV")
    print(f"  F at rho=0.1: {np.interp(0.1, r, F):.4f} eV")
    print(f"  F at rho=1.0: {np.interp(1.0, r, F):.4f} eV")
    print(f"  F at rho=2.0: {np.interp(2.0, r, F):.4f} eV")

# 3. Check electron densities
print("\n3. ELECTRON DENSITIES (from .plt files):")
print("-" * 40)

r_dti, dti = read_plt("fti.plt")
r_dal, dal = read_plt("fal.plt")

for name, r, rho in [("Ti", r_dti, dti), ("Al", r_dal, dal)]:
    print(f"{name}:")
    print(f"  r range: {r.min():.4f} to {r.max():.4f} A")
    print(f"  rho at r_min: {rho[0]:.6e}")
    print(f"  rho at NN (r=2.89): {np.interp(2.89, r, rho):.6e}")
    print(f"  rho at r=1.0: {np.interp(1.0, r, rho):.6e}")
    print(f"  rho at r=3.0: {np.interp(3.0, r, rho):.6e}")

# 4. Check eam.alloy structure
print("\n4. LAMMPS eam.alloy FILE ANALYSIS:")
print("-" * 40)

lines, data_lines, nrho, drho, nr, dr, rc = read_eam_alloy(
    "Zope-Ti-Al-2003-v2.eam.alloy"
)

# Find section boundaries
print("\nSearching for section boundaries...")
for i in range(6, min(200, len(lines))):
    if data_lines[i] is None:
        print(f"  Line {i + 1} (index {i}): HEADER = {lines[i].strip()[:80]}")
    elif len(data_lines[i]) >= 2:
        v1, v2 = data_lines[i][0], data_lines[i][1]
        if i < 15 or i % 1000 < 5:
            print(f"  Line {i + 1}: val1={v1:.6e}, val2={v2:.6e}")

# Check Ti density section (should be after first 10000 pts if 2-col format)
ti_density_start = 6  # data starts here
ti_density_end = 6 + nrho  # should be around 10006

# Print some values from Ti density section
print(f"\nTi density section (lines {ti_density_start + 1}-{ti_density_end}):")
for i in [
    ti_density_start,
    ti_density_start + 1,
    ti_density_start + 100,
    ti_density_start + 1000,
    ti_density_start + 5000,
    ti_density_end - 2,
    ti_density_end - 1,
]:
    if 0 <= i < len(data_lines) and data_lines[i] is not None:
        print(f"  Line {i + 1}: {data_lines[i]}")

# Print values near transition point
print(f"\nValues near line {ti_density_end} (expected end of Ti density):")
for i in range(ti_density_end - 3, ti_density_end + 5):
    if 0 <= i < len(data_lines):
        if data_lines[i] is None:
            print(f"  Line {i + 1}: HEADER = {lines[i].strip()[:80]}")
        else:
            print(f"  Line {i + 1}: {data_lines[i]}")

# Now check pair potential sections
# Calculate expected positions
print("\n" + "=" * 60)
print("5. PAIR POTENTIAL SECTIONS IN eam.alloy:")
print("=" * 60)

# Based on our analysis: lines are in pairs (F, rho)
# Total data lines per section = nrho
ti_F_end = ti_density_end  # end of Ti F
ti_rho_end = ti_F_end + nrho  # end of Ti rho
al_F_end = ti_rho_end + nrho  # end of Al F
al_rho_end = al_F_end + nrho  # end of Al rho

print(f"\nTi F: lines {ti_density_start + 1}-{ti_F_end}")
print(f"Ti rho: lines {ti_F_end + 1}-{ti_rho_end}")
print(f"Al F: lines {ti_rho_end + 1}-{al_F_end}")
print(f"Al rho: lines {al_F_end + 1}-{al_rho_end}")

# Check Ti-Ti pair potential
ti_ti_start = al_rho_end  # start of Ti-Ti phi
ti_ti_end = ti_ti_start + nr

print(f"\nTi-Ti phi: lines {ti_ti_start + 1}-{ti_ti_end}")
for i in [
    ti_ti_start,
    ti_ti_start + 1,
    ti_ti_start + 100,
    ti_ti_end - 2,
    ti_ti_end - 1,
]:
    if 0 <= i < len(data_lines) and data_lines[i] is not None:
        print(f"  Line {i + 1}: {data_lines[i]}")

# Check Ti-Al pair potential
ti_al_start = ti_ti_end
ti_al_end = ti_al_start + nr

print(f"\nTi-Al phi: lines {ti_al_start + 1}-{ti_al_end}")
for i in [
    ti_al_start,
    ti_al_start + 1,
    ti_al_start + 100,
    ti_al_start + 1000,
    ti_al_end - 2,
    ti_al_end - 1,
]:
    if 0 <= i < len(data_lines) and data_lines[i] is not None:
        print(f"  Line {i + 1}: {data_lines[i]}")

# Check Al-Al pair potential
al_al_start = ti_al_end
al_al_end = al_al_start + nr

print(f"\nAl-Al phi: lines {al_al_start + 1}-{al_al_end}")
for i in [
    al_al_start,
    al_al_start + 1,
    al_al_start + 100,
    al_al_end - 2,
    al_al_end - 1,
]:
    if 0 <= i < len(data_lines) and data_lines[i] is not None:
        print(f"  Line {i + 1}: {data_lines[i]}")

print(f"\nTotal expected: {al_al_end} lines. Actual: {len(lines)} lines")
print(f"Data starts at index {ti_density_start}, header ends at {ti_density_start - 1}")
