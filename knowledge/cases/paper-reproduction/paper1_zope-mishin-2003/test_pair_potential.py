#!/usr/bin/env python3
"""
Direct test: compare eam.alloy pair potentials with .plt files at matching distances.
"""

import numpy as np

BASE = "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/original_plt_files"


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


# Read .plt pair potentials
r_ti, phi_ti_plt = read_plt("pti.plt")
r_tial, phi_tial_plt = read_plt("ptial.plt")
r_al, phi_al_plt = read_plt("pal.plt")

# Read eam.alloy
with open(f"{BASE}/Zope-Ti-Al-2003-v2.eam.alloy") as f:
    lines = f.readlines()

# Parse grid
parts = lines[4].strip().split()
nrho = int(parts[0])
drho = float(parts[1])
nr = int(parts[2])
dr = float(parts[3])
rc = float(parts[4]) if len(parts) > 4 else nr * dr

print(f"Grid: nrho={nrho}, drho={drho:.6e}, nr={nr}, dr={dr:.6e}, rc={rc:.6f}")
print()

# Find the ACTUAL start/end of pair potential data
# Read the Ti-Ti section starting at line 40007
ti_ti_data = []
for i in range(40006, 50006):  # lines 40007-50006
    try:
        val = float(lines[i].strip())
        ti_ti_data.append(val)
    except:
        print(f"Non-numeric at line {i + 1}: {lines[i][:40]}")
        ti_ti_data.append(None)

ti_ti_data = np.array([x for x in ti_ti_data if x is not None])
print(f"Ti-Ti data length: {len(ti_ti_data)}")

# Read Ti-Al section
ti_al_data = []
for i in range(50006, 60006):
    try:
        val = float(lines[i].strip())
        ti_al_data.append(val)
    except:
        ti_al_data.append(None)
ti_al_data = np.array([x for x in ti_al_data if x is not None])

# Read Al-Al section
al_al_data = []
for i in range(60006, 70006):
    try:
        val = float(lines[i].strip())
        al_al_data.append(val)
    except:
        al_al_data.append(None)
al_al_data = np.array([x for x in al_al_data if x is not None])

print(f"Ti-Al data length: {len(ti_al_data)}")
print(f"Al-Al data length: {len(al_al_data)}")

# Analyze the data to find the actual grid structure
print()
print("=== Analyzing Ti-Ti section ===")
# Find where non-zero values start
for i in range(min(20, len(ti_ti_data))):
    print(f"  idx={i}: {ti_ti_data[i]:.6f}")

print(f"  ...")
for i in range(len(ti_ti_data) - 5, len(ti_ti_data)):
    print(f"  idx={i}: {ti_ti_data[i]:.6f}")

# Find the minimum value
min_idx = ti_ti_data.argmin()
min_val = ti_ti_data[min_idx]
print(f"  Min: {min_val:.6f} at idx={min_idx}")

# Check if the data follows a linear pattern
print()
print("=== Testing grid spacing ===")
# If dr = 0.0006724884, what r does each index correspond to?
# Try: r = idx * dr (starting at r=0)
print("If r = idx * dr:")
for r_check in [1.0, 2.0, 2.685, 3.0, 5.0]:
    idx = int(r_check / dr)
    if idx < len(ti_ti_data):
        val_eam = ti_ti_data[idx]
        val_plt = np.interp(r_check, r_ti, phi_ti_plt)
        ratio = val_eam / val_plt if val_plt != 0 else float("inf")
        print(
            f"  r={r_check:.3f}: eam={val_eam:.4f}, plt={val_plt:.4f}, ratio={ratio:.2f}"
        )
    else:
        print(f"  r={r_check:.3f}: OUT OF RANGE (max idx={len(ti_ti_data) - 1})")

# Try: r = (len - idx) * dr (reversed, starting from rc)
print()
print("If r = (len-1 - idx) * dr:")
for r_check in [1.0, 2.0, 2.685, 3.0, 5.0]:
    idx = int((len(ti_ti_data) - 1 - r_check / dr))
    if 0 <= idx < len(ti_ti_data):
        val_eam = ti_ti_data[idx]
        val_plt = np.interp(r_check, r_ti, phi_ti_plt)
        print(f"  r={r_check:.3f}: eam={val_eam:.4f}, plt={val_plt:.4f}")
    else:
        print(f"  r={r_check:.3f}: idx={idx} OUT OF RANGE")

# Try: r = start_offset + idx * dr
# The .plt file goes from 1.0014 to 5.1940
# Find what dr would give matching indices
print()
print("=== Finding matching grid ===")
# .plt has 3001 points from 1.0014 to 5.1940, step=0.001397
# eam.alloy has 10000 points
# If they cover the same range: dr_eam = (5.194-1.0014)/9999 = 0.000419
# If dr_eam = 0.0006724884 and starts at r=0:
#   idx 1490 -> r=1.0014, idx 7400 -> r=5.1940
#   So eam.alloy covers r=0 to r=6.725
# But the NIST page says the pair potential covers r=1.0014 to r=5.1940
# Maybe the FIRST 10000 points in the pair section are NOT the pair potential
# but something else (like an integral or cumulative sum)?

# Let me check the values at different interpretations
dr_plt = (r_ti[-1] - r_ti[0]) / (len(r_ti) - 1)
print(f".plt dr: {dr_plt:.6f} A/step")
print(f"eam.alloy dr: {dr:.6f} A/step")
print(f"Ratio: {dr / dr_plt:.6f}")

# Try: the eam.alloy pair potential covers r=0 to rc=6.725, but the .plt
# only covers 1.0014 to 5.1940. Let me see if the values match at those distances.
print()
print("=== Checking at .plt r values ===")
for i in [0, 100, 500, 1000, 1500, 2000, 2500, 2999]:
    if i < len(r_ti):
        r_plt = r_ti[i]
        phi_plt = phi_ti_plt[i]

        # In eam.alloy, what index corresponds to this r?
        # Try: r = r_plt_min + idx * dr_eam
        r_eam_min = 0.0  # assume starts at r=0
        idx_eam = int((r_plt - r_eam_min) / dr)

        if 0 <= idx_eam < len(ti_ti_data):
            phi_eam = ti_ti_data[idx_eam]
            print(
                f"r={r_plt:.4f}: plt={phi_plt:.4f} eV, eam={phi_eam:.4f} (idx={idx_eam})"
            )
        else:
            print(
                f"r={r_plt:.4f}: plt={phi_plt:.4f} eV, eam=OUT OF RANGE (idx={idx_eam})"
            )

# Check: maybe the pair potential section has different nr than the header says
# Let's count non-zero values in Ti-Ti section
nonzero_count = np.sum(np.abs(ti_ti_data) > 1e-10)
print(f"\nNon-zero values in Ti-Ti: {nonzero_count}")

# Check: maybe the pair potential is stored in pairs (r, phi) on the same line
# But the file has one value per line...
print()
print("=== Alternative: check if values match at r=1.0 in different units ===")
r_check = 1.0
phi_plt_ti = np.interp(r_check, r_ti, phi_ti_plt)
phi_plt_tial = np.interp(r_check, r_tial, phi_tial_plt)
phi_plt_al = np.interp(r_check, r_al, phi_al_plt)

# In eam.alloy, at what index would r = 1.0?
idx_1 = int(1.0 / dr)
if idx_1 < len(ti_ti_data):
    print(f"At r=1.0:")
    print(f"  .plt Ti-Ti: {phi_plt_ti:.4f} eV = {phi_plt_ti / 13.6:.4f} Rydberg")
    print(
        f"  eam.alloy Ti-Ti at idx {idx_1}: {ti_ti_data[idx_1]:.4f} eV = {ti_ti_data[idx_1] / 13.6:.4f} Rydberg"
    )
    print(f"  Ratio (eV): {ti_ti_data[idx_1] / phi_plt_ti:.2f}")

    print(f"  .plt Ti-Al: {phi_plt_tial:.4f} eV = {phi_plt_tial / 13.6:.4f} Rydberg")
    if idx_1 < len(ti_al_data):
        print(
            f"  eam.alloy Ti-Al at idx {idx_1}: {ti_al_data[idx_1]:.4f} eV = {ti_al_data[idx_1] / 13.6:.4f} Rydberg"
        )
        print(f"  Ratio (eV): {ti_al_data[idx_1] / phi_plt_tial:.2f}")
