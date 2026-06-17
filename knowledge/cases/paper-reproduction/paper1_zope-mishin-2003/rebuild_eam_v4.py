#!/usr/bin/env python3
"""
Build correct LAMMPS eam.alloy from .plt component files.

Original file structure (70007 lines = 7 header + 70000 data):
  Lines 1-6:     Comments + nelements + grid params
  Line  7:       Ti element header (Z=22, mass, a=4.148, fcc)
  Lines 8-10007: Ti F (10000 values)
  Lines 10008-20007: Ti rho (10000 values)
  Line  20008:   Al element header (Z=13, mass, a=4.05, fcc)
  Lines 20009-30008: Al F (10000 values)
  Lines 30009-40008: Al rho (10000 values)
  Lines 40009-50008: phi_Ti-Ti (10000 values)
  Lines 50009-60008: phi_Ti-Al (10000 values)
  Lines 60009-70007: phi_Al-Al (9999 values in original, 10000 in this rebuild)

Data array indices (file line = data_index + 8):
  data[0..9999]    = Ti F (file lines 8-10007)
  data[10000..19999] = Ti rho (file lines 10008-20007)
  data[20000]      = Al element header (file line 20008)
  data[20001..30000] = Al F (file lines 20009-30008)
  data[30001..40000] = Al rho (file lines 30009-40008)
  data[40001..50000] = phi_Ti-Ti (file lines 40009-50008)
  data[50001..60000] = phi_Ti-Al (file lines 50009-60008)
  data[60001..70000] = phi_Al-Al (file lines 60009-70009)
Total: 70001 data entries. File = 7 header + 70001 = 70008 lines.
(NOTE: original had 9999 phi_Al-Al values; this rebuild has 10000)
"""

import numpy as np

BASE = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/original_plt_files"
OUT = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/Zope-Ti-Al-2003-fixed.eam.alloy"


def read_plt(fn):
    r, v = [], []
    for line in open(f"{BASE}/{fn}"):
        line = line.strip()
        if line.startswith("#") or not line:
            continue
        p = line.split()
        r.append(float(p[0]))
        v.append(float(p[1]))
    return np.array(r), np.array(v)


print("Reading .plt files...")
r_fti, fti = read_plt("fti.plt")
r_Fti, Fti = read_plt("F_ti.plt")
r_fal, fal = read_plt("fal.plt")
r_Fal, Fal = read_plt("F_al.plt")
r_ti, phiti = read_plt("pti.plt")
r_tial, phit = read_plt("ptial.plt")
r_al, phial = read_plt("pal.plt")

phiti_eV = phiti * 13.6
phit_eV = phit * 13.6
phial_eV = phial * 13.6

nrho = 10000
drho = 0.0006967034321178504
nr = 10000
dr = 0.0006724884000000001
rc = 6.724884
print(f"Grid: nrho={nrho}, drho={drho:.8f}, nr={nr}, dr={dr:.8f}, rc={rc:.6f}")


def build_rho(r_plt, rho_plt, nr, dr):
    arr = np.zeros(nr)
    for i in range(nr):
        ri = i * dr
        if ri < r_plt[0]:
            arr[i] = rho_plt[0]
        elif ri > r_plt[-1]:
            arr[i] = 0.0
        else:
            arr[i] = np.interp(ri, r_plt, rho_plt)
    return arr


def build_F(rho_plt, F_plt, nrho, drho):
    arr = np.zeros(nrho)
    for i in range(nrho):
        rho_i = i * drho
        if rho_i < rho_plt[0]:
            sl = (F_plt[1] - F_plt[0]) / max(rho_plt[1] - rho_plt[0], 1e-10)
            arr[i] = F_plt[0] + sl * (rho_i - rho_plt[0])
        elif rho_i > rho_plt[-1]:
            sl = (F_plt[-1] - F_plt[-2]) / max(rho_plt[-1] - rho_plt[-2], 1e-10)
            arr[i] = F_plt[-1] + sl * (rho_i - rho_plt[-1])
        else:
            arr[i] = np.interp(rho_i, rho_plt, F_plt)
    return arr


def build_phi(r_plt, phi_eV, nr, dr):
    arr = np.zeros(nr)
    for i in range(nr):
        ri = i * dr
        if ri < r_plt[0]:
            if len(r_plt) >= 2 and r_plt[0] > 1e-10:
                A = phi_eV[0] * r_plt[0]
                arr[i] = A / ri if ri > 1e-10 else phi_eV[0] * 2
            else:
                arr[i] = phi_eV[0] * 2
        elif ri > r_plt[-1]:
            arr[i] = 0.0
        else:
            arr[i] = np.interp(ri, r_plt, phi_eV)
    return arr


print("Building arrays...")
ti_rho = build_rho(r_fti, fti, nr, dr)
ti_F = build_F(r_Fti, Fti, nrho, drho)
al_rho = build_rho(r_fal, fal, nr, dr)
al_F = build_F(r_Fal, Fal, nrho, drho)
phi_ti = build_phi(r_ti, phiti_eV, nr, dr)
phi_ti_al = build_phi(r_tial, phit_eV, nr, dr)
phi_al = build_phi(r_al, phial_eV, nr, dr)

print(f"Ti F: {ti_F.min():.4f}-{ti_F.max():.4f} eV")
print(f"Al F: {al_F.min():.4f}-{al_F.max():.4f} eV")
print(f"Ti rho: {ti_rho.min():.6e}-{ti_rho.max():.6e}")
print(f"Al rho: {al_rho.min():.6e}-{al_rho.max():.6e}")
print(f"Ti-Ti phi: {phi_ti.min():.4f}-{phi_ti.max():.4f} eV")
print(f"Ti-Al phi: {phi_ti_al.min():.4f}-{phi_ti_al.max():.4f} eV")
print(f"Al-Al phi: {phi_al.min():.4f}-{phi_al.max():.4f} eV")

N = nrho  # 10000

# Data entries (file line = data_index + 8):
# Ti F: 0..N-1 (file lines 8..N+7 = 8..10007)
# Ti rho: N..2N-1 (file lines N+8..2N+7 = 10008..20007)
# Al header: 2N (file line 2N+8 = 20008)
# Al F: 2N+1..3N (file lines 2N+9..3N+8 = 20009..30008)
# Al rho: 3N+1..4N (file lines 3N+9..4N+8 = 30009..40008)
# phi_TiTi: 4N+1..5N (file lines 4N+9..5N+8 = 40009..50008)
# phi_TiAl: 5N+1..6N (file lines 5N+9..6N+8 = 50009..60008)
# phi_AlAl: 6N+1..7N (file lines 6N+9..7N+8 = 60009..70008)
# Total: 7N+1 = 70001 data entries. File: 7 + 70001 = 70008 lines.

DATA_SIZE = 7 * N + 1  # 70001
data = [""] * DATA_SIZE

i_TiF = 0
i_TiR = N
i_AlH = 2 * N
i_AlF = 2 * N + 1
i_AlR = 3 * N + 1
i_phiTT = 4 * N + 1
i_phiTA = 5 * N + 1
i_phiAA = 6 * N + 1

for i, v in enumerate(ti_F):
    data[i_TiF + i] = f"  {v:.10E}"
for i, v in enumerate(ti_rho):
    data[i_TiR + i] = f"  {v:.10E}"
data[i_AlH] = f"   13    0.2698200000E+02    0.4050000000E+01      fcc"
for i, v in enumerate(al_F):
    data[i_AlF + i] = f"  {v:.10E}"
for i, v in enumerate(al_rho):
    data[i_AlR + i] = f"  {v:.10E}"
for i, v in enumerate(phi_ti):
    data[i_phiTT + i] = f"  {v:.10E}"
for i, v in enumerate(phi_ti_al):
    data[i_phiTA + i] = f"  {v:.10E}"
for i, v in enumerate(phi_al):
    data[i_phiAA + i] = f"  {v:.10E}"

print(f"\nData size: {len(data)} entries (max idx={len(data) - 1})")


def pr(name, start, n):
    print(
        f"  {name:12s}: idx {start}-{start + n - 1} (file lines {start + 8}-{start + n + 7})"
    )


pr("Ti F", i_TiF, N)
pr("Ti rho", i_TiR, N)
pr("Al header", i_AlH, 1)
pr("Al F", i_AlF, N)
pr("Al rho", i_AlR, N)
pr("phi_TiTi", i_phiTT, N)
pr("phi_TiAl", i_phiTA, N)
pr("phi_AlAl", i_phiAA, N)

# Header: 7 lines including Ti element header at line 7
header = [
    " R.R. Zope and Y. Mishin, Phys. Rev. B 68, 024102 (2003).",
    " Rebuilt from .plt files with correct pair potentials. 2026.",
    " 26 Sept. 2009.  http://www.ctcms.nist.gov/potentials",
    " Pair potentials converted from Rydberg to eV. Original eam.alloy had broken cross-potentials.",
    "             2 Ti  Al  ",
    f"{nrho:>6d}  {drho:.16E}  {nr:>6d}  {dr:.16E}  {rc:.16E}",
    f"   22    0.4786700000E+02    0.4148000000E+01      fcc",
]

with open(OUT, "w") as f:
    for line in header:
        f.write(line + "\n")
    for line in data:
        f.write(line + "\n")

import os

size = os.path.getsize(OUT)
actual = sum(1 for _ in open(OUT))
print(f"\nFile: {OUT}")
print(f"Size: {size} bytes, Lines: {actual} (expected {7 + len(data)})")

with open(OUT) as f:
    lines = f.readlines()
checks = {
    7: "Ti header",
    8: "Ti F[0]",
    10007: "Ti F[9999]",
    10008: "Ti rho[0]",
    20007: "Ti rho[9999]",
    20008: "Al header",
    20009: "Al F[0]",
    30008: "Al F[9999]",
    30009: "Al rho[0]",
    40008: "Al rho[9999]",
    40009: "phi_TiTi[0]",
    50008: "phi_TiTi[9999]",
    50009: "phi_TiAl[0]",
    60008: "phi_TiAl[9999]",
    60009: "phi_AlAl[0]",
    70008: "phi_AlAl[9999]",
}
print("\nVerification:")
for ln, desc in checks.items():
    idx = ln - 1
    if idx < len(lines):
        print(f"  Line {ln:6d} ({desc}): {lines[idx].strip()[:65]}")
    else:
        print(f"  Line {ln:6d} ({desc}): OUT OF RANGE (max {len(lines)})")
