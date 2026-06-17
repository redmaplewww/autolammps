"""
Compute EAM energies for Al fcc, Ti hcp, and TiAl L1_0 from first principles.
"""

import math

# Parse EAM file
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

# Parse all functions
ti_rho = [
    float(lines[6 + i].strip()) for i in range(Nrho)
]  # Ti electron density function
ti_F = [float(lines[10006 + i].strip()) for i in range(Nr)]  # Ti embedding function
al_rho = [float(lines[20007 + i].strip()) for i in range(Nrho)]  # Al electron density
al_F = [float(lines[30007 + i].strip()) for i in range(Nr)]  # Al embedding

# Pair potentials
ti_ti = [float(lines[40007 + i].strip()) for i in range(Nr)]
ti_al = [float(lines[50007 + i].strip()) for i in range(Nr)]
al_al = [float(lines[60007 + i].strip()) for i in range(Nr)]


def get_val(arr, r, d):
    """Get interpolated value at r from array indexed by r/d."""
    idx = int(r / d)
    if idx >= len(arr) - 1:
        idx = len(arr) - 2
    if idx < 0:
        idx = 0
    frac = r / d - idx
    return arr[idx] * (1 - frac) + arr[idx + 1] * frac


def get_embedding(F, rho):
    """Get embedding energy at density rho."""
    return get_val(F, rho, dr)


def get_density(rho_func, r):
    """Get electron density at distance r."""
    return get_val(rho_func, r, drho)


def get_pair(phi_arr, r):
    """Get pair potential at distance r."""
    return get_val(phi_arr, r, dr)


# =========================================================================
# Compute energies
# =========================================================================

print("=" * 60)
print("EAM ENERGY CALCULATIONS")
print("=" * 60)

# -------------------------------------------------------------------------
# 1. Al fcc (a = 4.05)
# -------------------------------------------------------------------------
print("\n--- Al fcc (a = 4.05) ---")
a_Al = 4.05
# Nearest neighbor: a/sqrt(2) = 2.8638
r_nn_Al = a_Al / math.sqrt(2)
print(f"NN distance: {r_nn_Al:.4f} A")

# 12 nearest neighbors at r_nn_Al
# 6 next-nearest at a = 4.05
# 24 third-nearest at sqrt(3)*a/sqrt(2) = 4.961

r_nn = r_nn_Al
r_2 = a_Al
r_3 = a_Al * math.sqrt(3) / math.sqrt(2)

# Al site density
rho_nn = get_density(al_rho, r_nn)
rho_2 = get_density(al_rho, r_2)
rho_3 = get_density(al_rho, r_3)

# Approximate: include 12 nn, 6 nnn, 24 3rd
rho_total = 12 * rho_nn + 6 * rho_2 + 24 * rho_3
print(f"rho_total (approx): {rho_total:.4f}")

F_Al = get_embedding(al_F, rho_total)
print(f"Embedding F(Al): {F_Al:.4f} eV")

# Pair energy (per atom, half-counted)
phi_nn = get_pair(al_al, r_nn)
phi_2 = get_pair(al_al, r_2)
phi_3 = get_pair(al_al, r_3)
E_pair = 0.5 * (12 * phi_nn + 6 * phi_2 + 24 * phi_3)
print(f"Pair energy: {E_pair:.4f} eV/atom")
E_total = F_Al + E_pair
print(f"Total: {E_total:.4f} eV/atom (expected: -3.36)")

# -------------------------------------------------------------------------
# 2. Ti hcp (a = 2.95, c/a = sqrt(8/3) = 1.633)
# -------------------------------------------------------------------------
print("\n--- Ti hcp (a = 2.95, c/a = 1.633) ---")
a_Ti = 2.95
c_Ti = a_Ti * math.sqrt(8 / 3)
print(f"NN distance: {a_Ti:.4f} A, c = {c_Ti:.4f} A")

# For orthorhombic cell: basis atoms at (0,0,0) and (0.5,0.5,0.5)
# Distance between basis atoms:
r_basis = math.sqrt((a_Ti / 2) ** 2 + (a_Ti * math.sqrt(3) / 4) ** 2 + (c_Ti / 2) ** 2)
print(f"Basis distance: {r_basis:.4f} A")

# Actually, the nearest neighbor in hcp is at distance a = 2.95
# This occurs between atoms in adjacent unit cells
# Nearest neighbors: 12 at distance a = 2.95
# But need to sum over all atoms in cutoff

# For simplicity, approximate with 12 nn at a
r_nn = a_Ti
rho_nn = get_density(ti_rho, r_nn)
print(f"rho at NN: {rho_nn:.4f}")
rho_total = 12 * rho_nn
print(f"rho_total (12 nn): {rho_total:.4f}")

# With more neighbors included
# 6 second neighbors at sqrt(3)*a = 5.11
r_2 = a_Ti * math.sqrt(3)
rho_2 = get_density(ti_rho, r_2)
# 2 third neighbors at c/2 = 2.41
r_3 = c_Ti / 2
rho_3 = get_density(ti_rho, r_3)
# 36 fourth neighbors at 2*a = 5.90
r_4 = 2 * a_Ti
rho_4 = get_density(ti_rho, r_4)

rho_total_full = 12 * rho_nn + 6 * rho_2 + 2 * rho_3 + 36 * rho_4
print(f"rho_total (full): {rho_total_full:.4f}")

F_Ti = get_embedding(ti_F, rho_total_full)
print(f"Embedding F(Ti): {F_Ti:.4f} eV")

phi_nn = get_pair(ti_ti, r_nn)
phi_2 = get_pair(ti_ti, r_2)
phi_3 = get_pair(ti_ti, r_3)
phi_4 = get_pair(ti_ti, r_4)
E_pair = 0.5 * (12 * phi_nn + 6 * phi_2 + 2 * phi_3 + 36 * phi_4)
print(f"Pair energy: {E_pair:.4f} eV/atom")
E_total = F_Ti + E_pair
print(f"Total: {E_total:.4f} eV/atom (expected: -4.87)")

# -------------------------------------------------------------------------
# 3. TiAl L1_0 (a = 3.998, c = 4.187)
# -------------------------------------------------------------------------
print("\n--- TiAl L1_0 (a = 3.998, c = 4.187) ---")
a_TiAl = 3.998
c_TiAl = 4.187

# Nearest neighbor: Al-Ti at distance sqrt(a^2/4 + c^2/4)
r_nn = math.sqrt(a_TiAl**2 / 4 + c_TiAl**2 / 4)
print(f"Al-Ti NN distance: {r_nn:.4f} A")

# Al site (8 nearest Ti neighbors, 4 nearest Al neighbors at a)
# Ti site (8 nearest Al neighbors, 4 nearest Ti neighbors at a)

r_AlTi = r_nn  # 2.828 A
r_AlAl = a_TiAl  # 3.998 A
r_TiAl = r_nn  # 2.828 A
r_TiTi = a_TiAl  # 3.998 A

# Al site density
rho_Al_from_Ti = get_density(ti_rho, r_AlTi)
rho_Al_from_Al = get_density(al_rho, r_AlAl)
rho_Al_total = 8 * rho_Al_from_Ti + 4 * rho_Al_from_Al
print(f"rho at Al site: {rho_Al_total:.4f}")
F_Al = get_embedding(al_F, rho_Al_total)
print(f"F(Al): {F_Al:.4f} eV")

# Ti site density
rho_Ti_from_Al = get_density(al_rho, r_TiAl)
rho_Ti_from_Ti = get_density(ti_rho, r_TiTi)
rho_Ti_total = 8 * rho_Ti_from_Al + 4 * rho_Ti_from_Ti
print(f"rho at Ti site: {rho_Ti_total:.4f}")
F_Ti = get_embedding(ti_F, rho_Ti_total)
print(f"F(Ti): {F_Ti:.4f} eV")

# Pair energies
phi_AlTi = get_pair(ti_al, r_AlTi)
phi_AlAl = get_pair(al_al, r_AlAl)
phi_TiAl = get_pair(ti_al, r_TiAl)
phi_TiTi = get_pair(ti_ti, r_TiTi)

E_pair_Al = 0.5 * (8 * phi_AlTi + 4 * phi_AlAl)
E_pair_Ti = 0.5 * (8 * phi_TiAl + 4 * phi_TiTi)
E_pair_avg = 0.5 * (E_pair_Al + E_pair_Ti)
print(f"Pair E(Al): {E_pair_Al:.4f}, E(Ti): {E_pair_Ti:.4f}")
print(f"Pair energy avg: {E_pair_avg:.4f} eV/atom")

E_total = 0.5 * (F_Al + F_Ti) + E_pair_avg
print(f"Total: {E_total:.4f} eV/atom (expected: -4.509)")

print("\n" + "=" * 60)
print("ANALYSIS")
print("=" * 60)
