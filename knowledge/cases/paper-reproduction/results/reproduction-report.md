# Paper Reproduction Report

Date: 2026-04-06

Environment:
- LAMMPS `30Mar2026` MSMPI on Windows
- GPU available: RTX 4060, but OpenCL GPU mode was only reliable for small EAM jobs
- Most production runs here used CPU for stability

## Paper 1 - Zope & Mishin 2003, PRB 68, 024102

System:
- gamma-TiAl (`L1_0`)
- potential: `Zope-Ti-Al-2003.eam.alloy`

### 1) Lattice constants

Computed from `paper1_tial_lattice.in`:

| Property | This work | Paper | Error |
|---|---:|---:|---:|
| `a` (A) | 3.998 | 3.998 | 0.00% |
| `c` (A) | 4.185906 | 4.187 | 0.03% |
| `c/a` | 1.047 | 1.047 | 0.00% |

Status: reproduced.

### 2) Elastic constants

Computed with zero-K energy-curvature workflow from `paper1_tial_elastic.in`:

| Constant | This work (GPa) | Paper (GPa) | Error |
|---|---:|---:|---:|
| `C11` | ~193 | 195 | ~1% |
| `C33` | ~229 | 228 | ~0.4% |
| `C66` | ~113 | 115 | ~1.7% |
| `C12` | not directly isolated in final script | 107 | - |
| `C13` | not directly isolated in final script | 89 | - |

Status: main elastic response reproduced.

### 3) Energies

From `paper1_tial_lattice.in` and `paper1_eam_energy_ref.in`:

| Quantity | This work | Paper |
|---|---:|---:|
| `PE/atom` for gamma-TiAl (eV) | -3.0718 | -4.509 |
| `E_form` TiAl (eV/atom) | positive / inconsistent | -0.404 |

Interpretation:
- structural and curvature properties reproduce well
- absolute energy reference does not
- the Ti reference state in this EAM setup is not consistent enough for reliable formation-energy reproduction in this workflow

### 4) Planar fault workflow

Completed with oriented `(111)` cell in `paper1_tial_fault_oriented.in` and scan data saved to `results/paper1_fault_scan.csv`.

Direct evaluated fault energies from the oriented-cell workflow:

| Fault | This work (mJ/m^2) | Paper (mJ/m^2) |
|---|---:|---:|
| SISF | 596.0 | 173 |
| CSF | 569.6 | 299 |
| APB | 155.1 | 266 |

Additional scan along `[11-2]` on the `(111)` plane:
- lowest scanned value in this simplified setup: ~121.7 mJ/m^2 at `0.05 [11-2]`
- scan file: `knowledge/cases/paper-reproduction/results/paper1_fault_scan.csv`

Interpretation:
- the fault workflow now runs end-to-end and produces quantitative values
- the simplified oriented-cell construction does not reproduce the paper's exact fault definitions/energetics
- so Paper 1 is complete for lattice + elastic reproduction, but only partially successful for fault energetics

### Paper 1 assessment

- Strong reproduction: lattice constants, major elastic constants
- Weak reproduction: absolute energies, fault energies

## Paper 2 - Qin 2024, RSC Advances 14

Important note:
- the paper note available locally is workflow-oriented and does not contain a benchmark table of target numerical values
- so this was finished as a workflow reproduction rather than a strict numerical validation

Completed system:
- `Ni/Ni3Al` coherent composite built in `paper2_ni_ni3al_tensile.in`
- potential: `NiAl_Mishin_2004.eam.alloy`

Model actually run:
- left half: fcc Ni
- right half: ordered `Ni3Al (L12)`
- composition counts after build: `Ni=464`, `Al=48`, total `512` atoms

Workflow completed:
1. build coherent Ni/Ni3Al composite
2. `NPT` relax non-loading directions at 300 K
3. `NVT` equilibration
4. tensile-deformation stage with stress output

Observed result from final run:
- deformation stage completed
- stress remained in the `~1-3 GPa` range through the short tensile window
- final reported stress: `1.282 GPa`
- strain variable reached `~2.659` in the explicit-final-length scaffold run

Interpretation:
- the requested Ni/Ni3Al workflow is now implemented and executed
- because the source note has no benchmark table, there is no paper-value error table to report
- this should be treated as a completed workflow reproduction scaffold, not a closed numerical validation

## Paper 3 - Sharma 2016, Scientific Reports 6

Important note:
- the local paper note is also workflow-oriented with no extracted benchmark table

Completed system:
- `Al0.1CrCoFeNi` random fcc solid solution scaffold
- potential: local MEAM set
  - `knowledge/potentials/meam/FeMnNiTiCuCrCoAl_library.meam`
  - `knowledge/potentials/meam/FeMnNiTiCuCrCoAl.meam`
- input: `paper3_hea_melt_quench.in`

Composition actually generated:
- `Al=47`
- `Cr=100`
- `Co=122`
- `Fe=129`
- `Ni=102`
- total `500` atoms

Workflow completed:
1. randomize alloy chemistry on fcc lattice
2. melt at `2000 K`
3. quench from `2000 K -> 300 K`
4. equilibrate at `300 K`

Final result from run:
- final potential energy: `-2112.139 eV`
- final volume: `6498.009 A^3`
- final density estimate: `6.861 g/cm^3`

Interpretation:
- Paper 3 workflow is now implemented and executed
- as with Paper 2, the local note does not provide a benchmark table, so this is a workflow completion rather than a numerical reproduction table

## Overall status

| Paper | Status | Notes |
|---|---|---|
| Paper 1 | mostly done | lattice + elastic reproduced well; energies/faults only partially reproduced |
| Paper 2 | done as workflow | Ni/Ni3Al composite built and tensile workflow executed |
| Paper 3 | done as workflow | HEA melt-quench-equilibrate workflow executed |

## Files produced/updated

- `knowledge/cases/paper-reproduction/paper1_tial_lattice.in`
- `knowledge/cases/paper-reproduction/paper1_tial_elastic.in`
- `knowledge/cases/paper-reproduction/paper1_tial_fault_oriented.in`
- `knowledge/cases/paper-reproduction/paper1_tial_fault_eval.in`
- `knowledge/cases/paper-reproduction/gen_tial_fault_structures.py`
- `knowledge/cases/paper-reproduction/paper2_ni_ni3al_tensile.in`
- `knowledge/cases/paper-reproduction/paper3_hea_melt_quench.in`
- `knowledge/cases/paper-reproduction/results/paper1_fault_scan.csv`

## Practical conclusion

- If the standard is "did every selected paper get an executable LAMMPS workflow and actual runs?" then yes.
- If the standard is "did every paper get a clean benchmark-quality numerical match?" then only Paper 1 partially achieved that, and only for lattice/elastic properties.
