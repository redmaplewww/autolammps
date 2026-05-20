"""
Compute Ti-Al pair potential from EAM setfl file and compare with paper values.
"""

with open(
    "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/Zope-Ti-Al-2003.eam.alloy",
    "r",
) as f:
    lines = f.readlines()

Nrho = 10000
Nr = 10000
drho = 6.967034321178504e-04
dr = 6.724884000000001e-03
rcut = 6.724884

# Element indices in file:
# Ti density: lines 6 to 10005 (index 0 to 9999)
# Ti embed: lines 10006 to 20005 (index 0 to 9999)
# Al metadata: line 20006
# Al density: lines 20007 to 30006 (index 0 to 9999)
# Al embed: lines 30007 to 40006 (index 0 to 9999)
# Ti-Ti pair: lines 40007 to 50006
# Ti-Al pair: lines 50007 to 60006
# Al-Al pair: lines 60007 to 70006

# Parse pair potentials
ti_ti = [float(lines[40007 + i].strip()) for i in range(Nr)]
ti_al = [float(lines[50007 + i].strip()) for i in range(Nr)]
al_al = [float(lines[60007 + i].strip()) for i in range(Nr)]


# Find the minimum of each pair potential
def find_min(arr, dr):
    min_val = min(arr)
    min_idx = arr.index(min_val)
    return min_val, min_idx * dr, min_idx


min_ti_ti, r_min_ti_ti, idx_ti_ti = find_min(ti_ti, dr)
min_ti_al, r_min_ti_al, idx_ti_al = find_min(ti_al, dr)
min_al_al, r_min_al_al, idx_al_al = find_min(al_al, dr)

print("=== Pair Potential Minima ===")
print(f"Ti-Ti: min = {min_ti_ti:.4f} eV at r = {r_min_ti_ti:.4f} A")
print(f"Ti-Al: min = {min_ti_al:.4f} eV at r = {r_min_ti_al:.4f} A")
print(f"Al-Al: min = {min_al_al:.4f} eV at r = {r_min_al_al:.4f} A")

# Compare pair potentials at key distances
print("\n=== Pair Potentials at Key Distances ===")
print(f"{'r (A)':<10} {'Ti-Ti (eV)':<15} {'Ti-Al (eV)':<15} {'Al-Al (eV)':<15}")
for r in [2.5, 2.6, 2.7, 2.8, 2.83, 2.9, 3.0, 3.2, 3.5, 4.0, 5.0]:
    idx = int(r / dr)
    if idx < Nr:
        print(f"{r:<10.2f} {ti_ti[idx]:<15.4f} {ti_al[idx]:<15.4f} {al_al[idx]:<15.4f}")

# Also check the electron density at Ti-Al nearest neighbor distance (2.828 A)
r_nn = 2.828
idx_rho = int(r_nn / drho)
print(f"\n=== Electron Density at r = {r_nn} A ===")
print(f"Ti's rho at r={r_nn}: {float(lines[6 + idx_rho].strip()):.4f}")
print(f"Al's rho at r={r_nn}: {float(lines[20007 + idx_rho].strip()):.4f}")

# Compare with Al fcc nearest neighbor distance
r_al_nn = 4.05 / (2**0.5)
idx_al_rho = int(r_al_nn / drho)
print(f"\n=== Al Electron Density at r = {r_al_nn:.4f} A (fcc nn) ===")
print(f"Al's rho at r={r_al_nn:.4f}: {float(lines[20007 + idx_al_rho].strip()):.4f}")

# Ti hcp nearest neighbor distance
r_ti_nn = 2.95
idx_ti_rho = int(r_ti_nn / drho)
print(f"\n=== Ti Electron Density at r = {r_ti_nn} A (hcp nn) ===")
print(f"Ti's rho at r={r_ti_nn}: {float(lines[6 + idx_ti_rho].strip()):.4f}")
