#!/usr/bin/env python3
"""
Build correct LAMMPS eam.alloy file from .plt component files.
"""

import numpy as np

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


print("Reading .plt files...")
r_fti, fti = read_plt("fti.plt")
r_Fti, Fti = read_plt("F_ti.plt")
r_fal, fal = read_plt("fal.plt")
r_Fal, Fal = read_plt("F_al.plt")
r_ti, phiti = read_plt("pti.plt")
r_tial, phitial = read_plt("ptial.plt")
r_al, phial = read_plt("pal.plt")

# Convert pair potentials from Rydberg to eV
phiti_eV = phiti * 13.6
phitial_eV = phitial * 13.6
phial_eV = phial * 13.6

# Grid parameters
nrho = 10000
drho = 0.0006967034321178504
nr = 10000
dr = 0.0006724884000000001
rc = 6.724884

print(f"Grid: nrho={nrho}, drho={drho:.8f}, nr={nr}, dr={dr:.8f}, rc={rc:.6f}")


# Build electron density arrays
def build_rho_array(r_plt, rho_plt, nr, dr):
    rho_arr = np.zeros(nr)
    for i in range(nr):
        r_i = i * dr
        if r_i < r_plt[0]:
            rho_arr[i] = rho_plt[0]
        elif r_i > r_plt[-1]:
            rho_arr[i] = 0.0
        else:
            rho_arr[i] = np.interp(r_i, r_plt, rho_plt)
    return rho_arr


# Build embedding function arrays
def build_F_array(rho_plt, F_plt, nrho, drho):
    F_arr = np.zeros(nrho)
    for i in range(nrho):
        rho_i = i * drho
        if rho_i < rho_plt[0]:
            slope = (F_plt[1] - F_plt[0]) / max(rho_plt[1] - rho_plt[0], 1e-10)
            F_arr[i] = F_plt[0] + slope * (rho_i - rho_plt[0])
        elif rho_i > rho_plt[-1]:
            slope = (F_plt[-1] - F_plt[-2]) / max(rho_plt[-1] - rho_plt[-2], 1e-10)
            F_arr[i] = F_plt[-1] + slope * (rho_i - rho_plt[-1])
        else:
            F_arr[i] = np.interp(rho_i, rho_plt, F_plt)
    return F_arr


# Build pair potential arrays
def build_phi_array(r_plt, phi_plt_eV, nr, dr):
    phi_arr = np.zeros(nr)
    for i in range(nr):
        r_i = i * dr
        if r_i < r_plt[0]:
            if len(r_plt) >= 2 and r_plt[0] > 1e-10:
                A = phi_plt_eV[0] * r_plt[0]
                phi_arr[i] = A / r_i if r_i > 1e-10 else phi_plt_eV[0] * 2
            else:
                phi_arr[i] = phi_plt_eV[0] * 2
        elif r_i > r_plt[-1]:
            phi_arr[i] = 0.0
        else:
            phi_arr[i] = np.interp(r_i, r_plt, phi_plt_eV)
    return phi_arr


print("Building arrays...")
ti_rho = build_rho_array(r_fti, fti, nr, dr)
ti_F = build_F_array(r_Fti, Fti, nrho, drho)
al_rho = build_rho_array(r_fal, fal, nr, dr)
al_F = build_F_array(r_Fal, Fal, nrho, drho)
phi_ti = build_phi_array(r_ti, phiti_eV, nr, dr)
phi_tial = build_phi_array(r_tial, phitial_eV, nr, dr)
phi_al = build_phi_array(r_al, phial_eV, nr, dr)

print(f"Ti F: {ti_F.min():.4f}-{ti_F.max():.4f} eV")
print(f"Al F: {al_F.min():.4f}-{al_F.max():.4f} eV")
print(f"Ti rho: {ti_rho.min():.6e}-{ti_rho.max():.6e}")
print(f"Al rho: {al_rho.min():.6e}-{al_rho.max():.6e}")
print(f"Ti-Ti phi: {phi_ti.min():.4f}-{phi_ti.max():.4f} eV")
print(f"Ti-Al phi: {phi_tial.min():.4f}-{phi_tial.max():.4f} eV")
print(f"Al-Al phi: {phi_al.min():.4f}-{phi_al.max():.4f} eV")

# Write eam.alloy file
# Format (7 header lines, then data sections interleaved with element headers):
# Line 1: comment
# Line 2: comment
# Line 3: comment
# Line 4: comment
# Line 5: element line (nelements, names)
# Line 6: grid parameters (nrho, drho, nr, dr, rc)
# Line 7: element 1 header (Z, mass, lat, struct)
# Lines 8-(7+nrho): element 1 F(ρ)
# Lines (8+nrho)-(7+2*nrho): element 1 ρ(r)
# Line (8+2*nrho): element 2 header (Z, mass, lat, struct)
# Lines (9+2*nrho)-(8+3*nrho): element 2 F(ρ)
# Lines (9+3*nrho)-(8+4*nrho): element 2 ρ(r)
# Lines (9+4*nrho)-(8+4*nrho+nr): φ_11
# Lines (9+4*nrho+nr)-(8+4*nrho+2*nr): φ_12
# Lines (9+4*nrho+2*nr)-(8+4*nrho+3*nr): φ_22

# Calculate line positions (CORRECTED per original file structure):
# Original file has 70007 lines = 7 header + 70000 data
# Element headers INCLUDED within their sections (header consumes 1 slot)
# Ti section: header (1) + F (9999) = 10000
# Al section: header (1) + F (9999) = 10000
# Total: 1 + 9999 + 10000 + 1 + 9999 + 10000 + 10000 + 10000 + 10000 = 70000 ✓
# File lines:
#   Line 7: Ti element header
#   Line 8-10007: Ti F (9999 values)
#   Line 10008-20007: Ti rho (10000 values)
#   Line 20008: Al element header
#   Line 20009-30007: Al F (9999 values)
#   Line 30008-40007: Al rho (10000 values)
#   Line 40008-50007: φ_Ti-Ti (10000 values)
#   Line 50008-60007: φ_Ti-Al (10000 values)
#   Line 60008-70007: φ_Al-Al (10000 values)
ti_header_idx = 6  # data[6] = file line 7
ti_F_start = 8  # data[7] = file line 8
ti_F_end = 10007  # data[10006] = file line 10007 (9999 values)
ti_rho_start = 10008  # data[10007] = file line 10008
ti_rho_end = 20007  # data[20006] = file line 20007 (10000 values)
al_header_idx = 20007  # data[20007] = file line 20008
al_F_start = 20009  # data[20008] = file line 20009
al_F_end = 30007  # data[30006] = file line 30007 (9999 values)
al_rho_start = 30008  # data[30007] = file line 30008
al_rho_end = 40007  # data[40006] = file line 40007 (10000 values)
phi11_start = 40008  # data[40007] = file line 40008
phi11_end = 50007
phi12_start = 50008  # data[50007] = file line 50008
phi12_end = 60007
phi22_start = 60008  # data[60007] = file line 60008
phi22_end = 70007

n_ti_F = 9999
n_al_F = 9999
n_rho = 10000

print(f"\nLine positions:")
print(
    f"Ti header: line {ti_header_idx + 1}, Ti F: {ti_F_start}-{ti_F_end} ({n_ti_F} values)"
)
print(f"Ti rho: {ti_rho_start}-{ti_rho_end} ({n_rho} values)")
print(
    f"Al header: line {al_header_idx + 1}, Al F: {al_F_start}-{al_F_end} ({n_al_F} values)"
)
print(f"Al rho: {al_rho_start}-{al_rho_end} ({n_rho} values)")
print(f"Ti-Ti phi: {phi11_start}-{phi11_end} ({nr} values)")
print(f"Ti-Al phi: {phi12_start}-{phi12_end} ({nr} values)")
print(f"Al-Al phi: {phi22_start}-{phi22_end} ({nr} values)")
print(f"Total data: {phi22_end} lines")

with open(OUT, "w") as f:
    lines_out = []

    # Header (7 lines): comments, nelements, grid params
    lines_out.append(" R.R. Zope and Y. Mishin, Phys. Rev. B 68, 024102 (2003).")
    lines_out.append(" Rebuilt from .plt files. 2026.")
    lines_out.append(" 26 Sept. 2009.  http://www.ctcms.nist.gov/potentials")
    lines_out.append(" Pair potentials converted from Rydberg to eV.")
    lines_out.append("             2 Ti  Al  ")
    lines_out.append(f"{nrho:>6d}  {drho:.16E}  {nr:>6d}  {dr:.16E}  {rc:.16E}")
    # Ti element header at data[6] (file line 7)
    # Al element header at data[20007] (file line 20008)

    # Total data entries = 70007 (Ti F:10000 + Ti rho:10000 + Al F:10000 + Al rho:10000 + Ti-Ti:10000 + Ti-Al:10000 + Al-Al:10000 + Ti header:1 + Al header:1 = 70007)
    # = phi22_end + 1
    data = [""] * (phi22_end + 1)

    # Ti element header: data[6] = file line 7
    data[ti_header_idx] = f"   22    0.4786700000E+02    0.4148000000E+01      fcc"

    # Fill in Ti F (9999 values, data[7] to data[10005])
    for i, val in enumerate(ti_F[:n_ti_F]):
        data[ti_F_start - 1 + i] = f"  {val:.10E}"

    # Fill in Ti rho (10000 values, data[10007] to data[20006])
    for i, val in enumerate(ti_rho):
        data[ti_rho_start - 1 + i] = f"  {val:.10E}"

    # Al element header: data[20007] = file line 20008
    data[al_header_idx] = f"   13    0.2698200000E+02    0.4050000000E+01      fcc"

    # Fill in Al F (9999 values, data[20008] to data[30006])
    for i, val in enumerate(al_F[:n_al_F]):
        data[al_F_start - 1 + i] = f"  {val:.10E}"

    # Fill in Al rho (10000 values, data[30007] to data[40006])
    for i, val in enumerate(al_rho):
        data[al_rho_start - 1 + i] = f"  {val:.10E}"

    # Fill in pair potentials (10000 values each)
    for i, val in enumerate(phi_ti):
        data[phi11_start - 1 + i] = f"  {val:.10E}"

    for i, val in enumerate(phi_tial):
        data[phi12_start - 1 + i] = f"  {val:.10E}"

    for i, val in enumerate(phi_al):
        data[phi22_start - 1 + i] = f"  {val:.10E}"

    # Write header (7 lines)
    for line in lines_out:
        f.write(line + "\n")

    # Write data (70007 entries for 70007 data lines)
    for line in data:
        if not line:
            f.write("  0.0000000000E+00\n")
        else:
            f.write(line + "\n")

print(f"\nWritten to {OUT}")
import os

size = os.path.getsize(OUT)
print(f"File size: {size} bytes")

# Verify
actual_lines = sum(1 for _ in open(OUT))
print(f"Lines: {actual_lines} (expected {phi22_end})")

# Check specific lines
with open(OUT) as f:
    all_lines = f.readlines()
    total = len(all_lines)
    print(f"Total lines: {total}")
    check_lines = {
        1: "Header line 1",
        7: "Ti element header (file line 7)",
        8: "Ti F start (file line 8)",
        10007: "Ti F end (file line 10007)",
        10008: "Ti rho start (file line 10008)",
        20007: "Ti rho end (file line 20007)",
        20008: "Al element header (file line 20008)",
        20009: "Al F start (file line 20009)",
        30008: "Al F end (file line 30008)",
        30009: "Al rho start (file line 30009)",
        40008: "Al rho end (file line 40008)",
        40009: "Ti-Ti phi start (file line 40009)",
        50008: "Ti-Ti phi end (file line 50008)",
        50009: "Ti-Al phi start (file line 50009)",
        60008: "Ti-Al phi end (file line 60008)",
        60009: "Al-Al phi start (file line 60009)",
        total: f"Last line (file line {total})",
    }
    for idx, desc in check_lines.items():
        idx0 = idx - 1  # 0-indexed
        if 0 <= idx0 < total:
            print(f"Line {idx} ({desc}): {all_lines[idx0].strip()[:70]}")
        else:
            print(f"Line {idx} ({desc}): OUT OF RANGE (total={total})")
