print("EAM potential analysis...")
with open(
    "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/Zope-Ti-Al-2003.eam.alloy",
    "r",
) as f:
    lines = f.readlines()

Nrho = 10000
Nr = 10000
drho = 6.967034321178504e-04
dr = 6.724884000000001e-03

# Parse key functions
ti_density = [float(lines[6 + i].strip()) for i in range(Nrho)]
ti_embed = [float(lines[10006 + i].strip()) for i in range(Nr)]
al_density = [float(lines[20007 + i].strip()) for i in range(Nrho)]
al_embed = [float(lines[30007 + i].strip()) for i in range(Nr)]

# Check embedding at index 0 (rho = 0)
print(f"Ti embedding at rho=0: {ti_embed[0]}")
print(f"Al embedding at rho=0: {al_embed[0]}")

# Find where Ti embedding becomes negative
for i in range(Nr):
    if ti_embed[i] < 0:
        print(
            f"Ti embedding becomes negative at index {i}, rho={i * dr:.4f}, F={ti_embed[i]:.4f}"
        )
        break

# Find minimum Ti embedding
min_ti = min(ti_embed)
min_ti_idx = ti_embed.index(min_ti)
print(f"Ti embedding minimum: {min_ti:.4f} at rho={min_ti_idx * dr:.4f}")

# Check at high density
print(f"Ti embedding at last index: {ti_embed[-1]}")

# For hcp Ti (coordination 12), approximate density
# Electron density at site = sum of density(r_ij) for neighbors
# For EAM, density at a site is typically the sum over neighbors
# Let's approximate: for hcp with 12 nearest neighbors at distance a=2.95
# density contribution per neighbor at r=a

# Find density value at r = 2.95 Angstrom
r_target = 2.95
idx = int(r_target / dr)
print(f"Density at r={r_target}: index {idx}, rho={ti_density[idx]:.4f}")
if idx < Nrho:
    print(f"Density at nearest neighbor (hcp): {ti_density[idx]:.4f}")

# For 12 nearest neighbors in hcp
print(f"Total density at hcp Ti site (12 nn): {12 * ti_density[idx]:.4f}")

# For fcc Al (coordination 12), nearest neighbor at a=4.05/√2 = 2.863
r_al = 4.05 / (2**0.5)
idx_al = int(r_al / dr)
print(f"Density at r={r_al:.3f} (Al fcc): {al_density[idx_al]:.4f}")
print(f"Total density at fcc Al site (12 nn): {12 * al_density[idx_al]:.4f}")

# Check what LAMMPS might report as electron density
# For Ti hcp at experimental a=2.95:
# 6 nearest in-plane neighbors at distance a
# 6 out-of-plane neighbors at distance a (ABAB stacking)
# All 12 at distance a = 2.95
r_ti = 2.95
idx_ti = int(r_ti / dr)
print(f"Ti density at r={r_ti}: {ti_density[idx_ti]:.4f}")
print(f"Total Ti density at hcp (12 nn): {12 * ti_density[idx_ti]:.4f}")

# Check the electron density at the origin (should be rho(0) or large negative r)
print(f"Ti density at r=0: {ti_density[0]}")
print(f"Al density at r=0: {al_density[0]}")

# Maximum density values
print(f"Max Ti density: {max(ti_density):.4f}")
print(f"Max Al density: {max(al_density):.4f}")

# Look at density function shape
print("\nTi density function:")
for i in [0, 1, 2, 3, 4, 10, 50, 100, 500, 1000, 5000, 9999]:
    if i < Nrho:
        r_val = i * dr
        print(f"  r={r_val:.4f}, rho={ti_density[i]:.4f}")

print("\nTi embedding function:")
for i in [0, 1, 2, 3, 4, 10, 50, 100, 500, 1000, 5000, 9999]:
    if i < Nr:
        rho_val = i * dr
        print(f"  rho={rho_val:.4f}, F={ti_embed[i]:.4f}")
