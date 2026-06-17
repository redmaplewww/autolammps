# Average Atom (A-atom) Model for LAMMPS

**Source:** `scratchpad/papers/a-atom-model.md` (full report)
**Last updated:** 2026-06-05

## What It Is

The A-atom (average-atom / meta-atom / virtual crystal) method replaces all atomic species in a random alloy with a single pseudo-element whose interatomic potential parameters are **concentration-weighted averages** of the constituent elements' parameters. This reduces an N-component alloy simulation to a 1-element simulation.

## Key References

| Paper | DOI / arXiv | Key Finding |
|-------|-------------|-------------|
| Nohring & Curtin (2016) | 10.1088/0965-0393/24/4/045017 | Foundational AA methodology |
| Zeller, Miller & Tadmor (2025) | arXiv:2510.06459 | LOAA extension with short-range order |
| Pasianot & Farkas (2020) | 10.1016/j.commatsci.2019.109366 | AA underestimates Peierls stress |
| Pulagam & Dutta (2023) | 10.1016/j.mechmat.2023.104563 | AA fails for dislocation core in TWIP |
| Farkas (2021) | 10.1016/j.msea.2021.141124 | Composition fluctuations hinder glide |

## Construction (EAM)

For concentrations c_i, the average atom parameters are:

- **Pair potential:** phi_avg(r) = sum_i sum_j c_i c_j * phi_ij(r)
- **Electron density:** rho_avg(r) = sum_i c_i * rho_i(r)  
- **Embedding energy:** F_avg(rho) = sum_i c_i * F_i(rho)
- **Mass:** m_avg = sum_i c_i * m_i
- **Lattice constant:** a_avg = sum_i c_i * a_i (Vegard's law)

## LAMMPS Implementation

**No native average-atom calculator in LAMMPS.** Generate the averaged funcfl/setfl file externally (Python script), then:

```
pair_style   eam
pair_coeff   * * AA_potential.funcfl [mass]
lattice      fcc [a_avg]
create_atoms 1 box
mass         1 [mass_avg]
```

## Limitations

- **Severely underestimates** Peierls stress and strengthening
- Cannot reproduce wavy dislocation lines from chemical heterogeneity
- Misses short-range order effects (unless using LOAA extension)
- Unreliable for defect nucleation, phase transitions, diffusion

## Acceptable Uses

- Elastic constants, equation of state, thermal expansion
- Qualitative screening of composition trends
- Large-scale simulations where cost prohibits explicit alloy

## Alternatives

- Explicit random alloy (N atom types) -- best accuracy, highest cost
- LOAA method (Zeller 2025) -- better than AA but not yet in LAMMPS
- CD-EAM (eam/cd in LAMMPS) -- binary only, captures mixing enthalpy
- SNAP / ML potentials -- best accuracy, requires training
