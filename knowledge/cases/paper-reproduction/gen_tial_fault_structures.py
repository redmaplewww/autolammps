import math
from pathlib import Path


OUTDIR = Path(__file__).resolve().parent / "fault_structures"
OUTDIR.mkdir(exist_ok=True)

a = 3.998
c = a * 1.047

# gamma-TiAl L10 conventional basis
# type 1 = Ti, type 2 = Al
basis = [
    (1, (0.0, 0.0, 0.0)),
    (1, (0.0, 0.5, 0.5)),
    (2, (0.5, 0.0, 0.0)),
    (2, (0.5, 0.5, 0.5)),
]


def dot(u, v):
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]


def cross(u, v):
    return (
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
    )


def norm(v):
    return math.sqrt(dot(v, v))


def sub(u, v):
    return (u[0] - v[0], u[1] - v[1], u[2] - v[2])


def add(u, v):
    return (u[0] + v[0], u[1] + v[1], u[2] + v[2])


def scale(s, v):
    return (s * v[0], s * v[1], s * v[2])


def mat_inv(m):
    a11, a12, a13 = m[0]
    a21, a22, a23 = m[1]
    a31, a32, a33 = m[2]
    det = (
        a11 * (a22 * a33 - a23 * a32)
        - a12 * (a21 * a33 - a23 * a31)
        + a13 * (a21 * a32 - a22 * a31)
    )
    if abs(det) < 1e-12:
        raise ValueError("Singular matrix")
    invdet = 1.0 / det
    return [
        [
            invdet * (a22 * a33 - a23 * a32),
            invdet * (a13 * a32 - a12 * a33),
            invdet * (a12 * a23 - a13 * a22),
        ],
        [
            invdet * (a23 * a31 - a21 * a33),
            invdet * (a11 * a33 - a13 * a31),
            invdet * (a13 * a21 - a11 * a23),
        ],
        [
            invdet * (a21 * a32 - a22 * a31),
            invdet * (a12 * a31 - a11 * a32),
            invdet * (a11 * a22 - a12 * a21),
        ],
    ]


def mat_vec(m, v):
    return (
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    )


def frac_to_cart(f):
    return (a * f[0], a * f[1], c * f[2])


def project_to_plane(v, n_hat):
    return sub(v, scale(dot(v, n_hat), n_hat))


def unique_atoms(atoms, tol=1e-6):
    seen = set()
    out = []
    for atype, pos in atoms:
        key = (atype, round(pos[0] / tol), round(pos[1] / tol), round(pos[2] / tol))
        if key not in seen:
            seen.add(key)
            out.append((atype, pos))
    return out


def build_slab(nx=6, ny=4, nz=12, vacuum=18.0):
    # in-plane vectors and plane normal in pseudo-cubic notation
    u_frac = (1.0, -1.0, 0.0)  # [1 -1 0]
    v_frac = (1.0, 1.0, -2.0)  # [1 1 -2]
    w_frac = (1.0, 1.0, 1.0)  # [1 1 1]

    U = scale(nx, frac_to_cart(u_frac))
    V = scale(ny, frac_to_cart(v_frac))
    W = scale(nz, frac_to_cart(w_frac))

    ex = scale(1.0 / norm(U), U)
    ez = scale(1.0 / norm(cross(U, V)), cross(U, V))
    ey = cross(ez, ex)

    # use W projected onto normal so z is normal to the plane
    Wn = scale(dot(W, ez), ez)
    if dot(Wn, ez) < 0:
        Wn = scale(-1.0, Wn)

    M = [
        [U[0], V[0], Wn[0]],
        [U[1], V[1], Wn[1]],
        [U[2], V[2], Wn[2]],
    ]
    Minv = mat_inv(M)

    # bounds in conventional cell space
    rx = nx * abs(u_frac[0]) + ny * abs(v_frac[0]) + nz * abs(w_frac[0]) + 4
    ry = nx * abs(u_frac[1]) + ny * abs(v_frac[1]) + nz * abs(w_frac[1]) + 4
    rz = nx * abs(u_frac[2]) + ny * abs(v_frac[2]) + nz * abs(w_frac[2]) + 4

    atoms = []
    for i in range(-2, int(rx) + 3):
        for j in range(-2, int(ry) + 3):
            for k in range(-2, int(rz) + 3):
                cell_shift = (float(i), float(j), float(k))
                for atype, b in basis:
                    f = add(cell_shift, b)
                    r = frac_to_cart(f)
                    s = mat_vec(Minv, r)
                    if (
                        -1e-8 <= s[0] < 1.0 - 1e-8
                        and -1e-8 <= s[1] < 1.0 - 1e-8
                        and -1e-8 <= s[2] < 1.0 - 1e-8
                    ):
                        xp = dot(r, ex)
                        yp = dot(r, ey)
                        zp = dot(r, ez) + vacuum / 2.0
                        atoms.append((atype, (xp, yp, zp)))

    atoms = unique_atoms(atoms)

    lx = norm(U)
    xy = dot(V, ex)
    ly = dot(V, ey)
    xz = 0.0
    yz = 0.0
    lz = norm(Wn) + vacuum
    area = norm(cross(U, V))
    zmid = lz / 2.0

    n_hat = scale(1.0 / norm(cross(U, V)), cross(U, V))
    b_sisf = scale(1.0 / 6.0, project_to_plane(frac_to_cart((1.0, 1.0, -2.0)), n_hat))
    b_csf = scale(1.0 / 3.0, project_to_plane(frac_to_cart((1.0, 1.0, -2.0)), n_hat))
    b_apb = scale(1.0 / 2.0, project_to_plane(frac_to_cart((1.0, -1.0, 0.0)), n_hat))

    meta = {
        "lx": lx,
        "ly": ly,
        "lz": lz,
        "xy": xy,
        "xz": xz,
        "yz": yz,
        "area": area,
        "zmid": zmid,
        "b_sisf": (dot(b_sisf, ex), dot(b_sisf, ey), 0.0),
        "b_csf": (dot(b_csf, ex), dot(b_csf, ey), 0.0),
        "b_apb": (dot(b_apb, ex), dot(b_apb, ey), 0.0),
    }
    return atoms, meta


def write_data(path, atoms, meta, shift=(0.0, 0.0, 0.0)):
    dx, dy, _ = shift
    zmid = meta["zmid"]
    shifted = []
    for idx, (atype, pos) in enumerate(atoms, start=1):
        x, y, z = pos
        if z > zmid:
            x += dx
            y += dy
        # wrap periodic x/y into restricted triclinic cell bounds approximately
        shifted.append((idx, atype, x, y, z))

    with open(path, "w", encoding="ascii") as f:
        f.write("gamma-TiAl (111) slab\n\n")
        f.write(f"{len(shifted)} atoms\n")
        f.write("2 atom types\n\n")
        f.write(f"0.0 {meta['lx']:.10f} xlo xhi\n")
        f.write(f"0.0 {meta['ly']:.10f} ylo yhi\n")
        f.write(f"0.0 {meta['lz']:.10f} zlo zhi\n")
        f.write(f"{meta['xy']:.10f} {meta['xz']:.10f} {meta['yz']:.10f} xy xz yz\n\n")
        f.write("Masses\n\n")
        f.write("1 47.867\n")
        f.write("2 26.982\n\n")
        f.write("Atoms # atomic\n\n")
        for idx, atype, x, y, z in shifted:
            f.write(f"{idx} {atype} {x:.10f} {y:.10f} {z:.10f}\n")


def main():
    atoms, meta = build_slab()
    write_data(OUTDIR / "tial_111_perfect.data", atoms, meta)
    write_data(OUTDIR / "tial_111_sisf.data", atoms, meta, meta["b_sisf"])
    write_data(OUTDIR / "tial_111_csf.data", atoms, meta, meta["b_csf"])
    write_data(OUTDIR / "tial_111_apb.data", atoms, meta, meta["b_apb"])

    with open(OUTDIR / "fault_meta.txt", "w", encoding="ascii") as f:
        f.write(f"area_A2={meta['area']:.10f}\n")
        f.write(f"zmid_A={meta['zmid']:.10f}\n")
        f.write(f"sisf_shift={meta['b_sisf'][0]:.10f},{meta['b_sisf'][1]:.10f}\n")
        f.write(f"csf_shift={meta['b_csf'][0]:.10f},{meta['b_csf'][1]:.10f}\n")
        f.write(f"apb_shift={meta['b_apb'][0]:.10f},{meta['b_apb'][1]:.10f}\n")
        f.write(f"atoms={len(atoms)}\n")


if __name__ == "__main__":
    main()
