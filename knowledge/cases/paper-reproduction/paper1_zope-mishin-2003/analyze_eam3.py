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

# Find max Ti density
max_rho = max(ti_density)
min_rho = min(ti_density)
max_idx = ti_density.index(max_rho)
min_idx = ti_density.index(min_rho)
print(f"Max Ti density: {max_rho} at index {max_idx}, r={max_idx * dr:.4f}")
print(f"Min Ti density: {min_rho} at index {min_idx}, r={min_idx * dr:.4f}")

# Find the embedding function minimum
min_F = min(ti_embed)
min_F_idx = ti_embed.index(min_F)
print(f"Min Ti embedding F: {min_F} at index {min_F_idx}, rho={min_F_idx * dr:.4f}")

# Check: is the density array indexed by dr or drho?
# If by dr: max at index 9999 gives r = 9999 * 0.006725 = 67.24 Angstrom
# If by drho: max at index 9999 gives r = 9999 * 0.000697 = 6.97 Angstrom

# At r = 6.97 (using drho indexing), density = ?
# index = 6.97 / drho = 6.97 / 0.000697 = 10000... which is at the boundary
r_at_max_density = max_idx * dr
r_at_max_density_drho = max_idx * drho
print(
    f"Max density at r={r_at_max_density:.4f} (using dr) or r={r_at_max_density_drho:.4f} (using drho)"
)

# The pair potential cutoff is 6.725 Angstrom, so the density should be indexed by drho
# with drho = 6.725/10000 = 0.0006725

# At r = 2.95 (nearest neighbor for Ti hcp), what is the density?
# index = 2.95 / 0.0006725 = 4387
idx_295 = int(2.95 / drho)
print(f"Density at r=2.95: index {idx_295}, density={ti_density[idx_295]:.4f}")

# Wait, but the embedding minimum is at rho=51.943
# If density is indexed by drho:
min_F_rho = min_F_idx * drho
print(f"Min embedding at rho={min_F_rho:.4f}")

# The electron density at Ti hcp site
# In hcp, 12 nearest neighbors at distance a = 2.95
# Plus 6 second neighbors at distance sqrt(3)*a = 5.11
# Plus 2 third neighbors (in plane above/below) at distance c/2 = 2.34
r_nn = 2.95
idx_nn = int(r_nn / drho)
rho_nn = ti_density[idx_nn]
print(f"Ti density at nearest neighbor r={r_nn}: rho={rho_nn}")

# Sum over neighbors
# For hcp: 12 at a, 6 at sqrt(3)*a, 2 at c/2
r2 = 2.95 * (3**0.5)
idx_2 = int(r2 / drho)
rho_2 = ti_density[idx_2] if idx_2 < Nrho else 0
print(f"Ti density at 2nd neighbor r={r2:.3f}: idx={idx_2}, rho={rho_2}")

r3 = 2.34  # approximate c/2
idx_3 = int(r3 / drho)
rho_3 = ti_density[idx_3] if idx_3 < Nrho else 0
print(f"Ti density at 3rd neighbor r={r3}: idx={idx_3}, rho={rho_3}")

# Total density at Ti hcp site
total_density = 12 * rho_nn + 6 * rho_2 + 2 * rho_3
print(f"Total Ti site density (hcp): {total_density:.4f}")

# Check the embedding at this density
# F(rho) at rho = total_density
if abs(total_density) < 10000:
    idx_F = int(abs(total_density) / drho)
    if idx_F < Nr:
        F_val = ti_embed[idx_F]
        print(f"Ti embedding at rho={total_density:.4f}: F={F_val:.4f}")

# Compare with Al fcc
al_density = [float(lines[20007 + i].strip()) for i in range(Nrho)]
al_embed = [float(lines[30007 + i].strip()) for i in range(Nr)]

# Al fcc: a = 4.05, nearest neighbor at 4.05/sqrt(2) = 2.864
r_al_nn = 4.05 / (2**0.5)
idx_al_nn = int(r_al_nn / drho)
rho_al_nn = al_density[idx_al_nn]
print(f"\nAl density at nearest neighbor r={r_al_nn:.3f}: rho={rho_al_nn}")

# For fcc: 12 nearest at 2.864, 6 next at 4.05, etc.
# 12 at 2.864
total_al = 12 * rho_al_nn
print(f"Total Al site density (fcc, 12 nn only): {total_al:.4f}")

# But for a more accurate calculation, we need actual neighbor distances
# For fcc conventional cell a=4.05:
# (100) direction spacing = 4.05
# (110) direction spacing = 4.05/sqrt(2) = 2.864
# (111) direction spacing = 4.05/sqrt(3) = 2.339

# Let me compute more carefully for fcc
# Nearest neighbors: 12 at distance 2.864
# Next-nearest: 6 at distance 4.05
# Third: 24 at distance sqrt(4^2 + 0^2 + 1^2) * a/sqrt(2)... too complex

print("\n=== Summary ===")
print(f"Elements in file: Ti (Z=22), Al (Z=13)")
print(
    f"Ti embedding: F(0) = {ti_embed[0]:.4f}, min F = {min_F:.4f} at rho={min_F_idx * dr:.4f}"
)
print(f"Ti density at r=2.95 (nearest neighbor in hcp): {rho_nn:.4f}")
print(f"Total Ti site density (hcp, approx): {total_density:.4f}")
print(f"Al density at r=2.864 (nearest neighbor in fcc): {rho_al_nn:.4f}")
print(f"Total Al site density (fcc, 12 nn): {total_al:.4f}")

# CRITICAL: Check the Ti embedding function behavior
print("\n=== Ti Embedding Function (first 20 values) ===")
for i in range(20):
    rho_val = i * drho
    F_val = ti_embed[i]
    print(f"  rho={rho_val:.4f}, F={F_val:.6f}")
