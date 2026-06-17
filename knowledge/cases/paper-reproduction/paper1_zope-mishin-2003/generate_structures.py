# Generate LAMMPS data files for Ti-Al structures
import math


def write_lammps_data(filename, box, atoms, velocities=False):
    """Write a LAMMPS data file."""
    with open(filename, "w") as f:
        f.write(f"L1_0 TiAl structure\n\n")
        f.write(f"{len(atoms)} atoms\n")
        f.write("2 atom types\n\n")

        # Box dimensions
        xlo, xhi = 0, box[0]
        ylo, yhi = 0, box[1]
        zlo, zhi = 0, box[2]
        f.write(f"{xlo:.8f} {xhi:.8f} xlo xhi\n")
        f.write(f"{ylo:.8f} {yhi:.8f} ylo yhi\n")
        f.write(f"{zlo:.8f} {zhi:.8f} zlo zhi\n\n")

        f.write("Masses\n\n")
        f.write("1 26.982 # Al\n")
        f.write("2 47.867 # Ti\n\n")

        f.write("Atoms\n\n")
        for i, (x, y, z, t) in enumerate(atoms):
            f.write(f"{i + 1} 1 {t} {x:.8f} {y:.8f} {z:.8f}\n")


def generate_tial_l10(a, c, nx=4, ny=4, nz=4):
    """Generate L1_0 TiAl structure.

    L1_0: tetragonal, P4/mmm
    Al at: (0,0,0), (0.5a,0,0.5c), (0,0.5a,0.5c), (0.5a,0.5a,0)
    Ti at: (0.5a,0,0), (0,0.5a,0), (0,0,0.5c), (0.5a,0.5a,0.5c)

    But this is a 4-atom conventional cell.
    For a supercell: repeat nx x ny x nz.
    """
    atoms = []

    # 4-atom conventional cell
    # In fractional coords within the conv cell:
    # Al: (0,0,0), (0.5,0,0.5), (0,0.5,0.5), (0.5,0.5,0)
    # Ti: (0.5,0,0), (0,0.5,0), (0,0,0.5), (0.5,0.5,0.5)

    # But wait, this IS the conventional cell. For a supercell, I need to replicate it.
    # The conventional cell vectors are (a,0,0), (0,a,0), (0,0,c).

    conv_atoms = [
        (0.0, 0.0, 0.0, 1),  # Al
        (0.5, 0.0, 0.5, 2),  # Ti
        (0.0, 0.5, 0.5, 2),  # Ti
        (0.5, 0.5, 0.0, 1),  # Al
    ]

    for ix in range(nx):
        for iy in range(ny):
            for iz in range(nz):
                for xf, yf, zf, t in conv_atoms:
                    x = (ix + xf) * a
                    y = (iy + yf) * a
                    z = (iz + zf) * c
                    atoms.append((x, y, z, t))

    box = (nx * a, ny * a, nz * c)
    return box, atoms


def generate_ti3al_d019(a, c, nx=2, ny=2, nz=2):
    """Generate Ti3Al D0_19 structure.

    D0_19 (Ni3Sn type, hexagonal):
    Space group P6_3/mmc
    a = b, c/a ~ 0.805
    4 atoms per unit cell

    Atomic positions (in conventional cell):
    Ti at: (0,0,0), (1/3,2/3,1/2), (0,0,1/2), (1/3,2/3,0) -> actually only 2 unique
    Al at: (1/2,0,1/4), (0,1/2,3/4)

    Actually D0_19 has 4 atoms/cell:
    Ti: 2a Wyckoff sites at (0,0,0) and (0,0,1/2)
    Al: 2d Wyckoff sites at (1/3,2/3,1/4) and (2/3,1/3,3/4)

    With c/a for D0_19 of Ti3Al ~ 0.805.
    """
    atoms = []

    # D0_19: hexagonal, 4 atoms/cell
    # Ti at (0,0,0) and (0,0,0.5) in units of (a,a,c)
    # Al at (1/3,2/3,0.25) and (2/3,1/3,0.75)
    d019_atoms = [
        (0.0, 0.0, 0.0, 2),  # Ti
        (0.0, 0.0, 0.5, 2),  # Ti
        (1 / 3, 2 / 3, 0.25, 1),  # Al
        (2 / 3, 1 / 3, 0.75, 1),  # Al
    ]

    for ix in range(nx):
        for iy in range(ny):
            for iz in range(nz):
                for xf, yf, zf, t in d019_atoms:
                    x = (ix + xf) * a
                    y = (iy + yf) * a
                    z = (iz + zf) * c
                    atoms.append((x, y, z, t))

    box = (nx * a, ny * a, nz * c)
    return box, atoms


if __name__ == "__main__":
    import sys

    # TiAl L1_0: a=3.998, c/a=1.047
    a = 3.998
    c = a * 1.047

    # Generate TiAl L1_0
    box, atoms = generate_tial_l10(a, c, nx=4, ny=4, nz=4)
    write_lammps_data("tial_l10.data", box, atoms)
    print(f"TiAl L1_0: {len(atoms)} atoms, box = {box}")

    # Generate Ti3Al D0_19 (estimate a ~ 5.7, c/a ~ 0.805)
    a_d019 = 5.7
    c_d019 = a_d019 * 0.805
    box2, atoms2 = generate_ti3al_d019(a_d019, c_d019, nx=2, ny=2, nz=2)
    write_lammps_data("ti3al_d019.data", box2, atoms2)
    print(f"Ti3Al D0_19: {len(atoms2)} atoms, box = {box2}")

    print("Data files generated.")
