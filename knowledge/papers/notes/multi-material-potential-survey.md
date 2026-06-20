# Multi-Material LAMMPS Potential Survey: TiZrNbTaHf HEA + 316 SS + PBS Solution

## Search Scope
NIST Interatomic Potentials Repository, OpenKIM, LAMMPS documentation, and web search for interatomic potentials covering TiZrNbTaHf refractory HEA, Fe-Cr-Ni (316 SS), and PBS solution components.

## Component 1: TiZrNbTaHf HEA

### Verified: Huang et al. (2021) MEAM for HfNbTaTiZr
- DOI: 10.1016/j.matdes.2021.109560 | **publisher page**
- Type: 2NN-MEAM | Elements: Hf, Nb, Ta, Ti, Zr (all 5)
- Available on NIST repository and OpenKIM
- Most directly applicable HEA potential found

### Verified: Wu et al. (2026) EAM for HfNbTaTiZr
- DOI: 10.1016/j.ijplas.2026.104626 | **publisher page**
- Type: EAM (also meta-atom variant) | Elements: Hf, Nb, Ta, Ti, Zr (all 5)

### Verified: Zhou et al. (2004) 16-element EAM
- DOI: 10.1103/physrevb.69.144113 | **publisher page**
- Elements: Cu,Ag,Au,Ni,Pd,Pt,Al,Pb,Fe,Mo,Ta,W,Mg,Co,Ti,Zr
- Covers Ti, Zr, Ta (HEA) and Fe, Ni, Mo (SS) - NOT Hf, Nb, Cr

## Component 2: 316 Stainless Steel (Fe-Cr-Ni)

### Verified: Choi et al. (2017) MEAM for Cr-Fe-Ni
- DOI: 10.1016/j.commatsci.2017.01.002 | **publisher page**
- Elements: Cr, Fe, Ni (core 316 elements)
- Same MEAM formalism as Huang HEA potential

### Verified: Farkas & Caro (2020) EAM for Fe-Ni-Cr-Co-Al
- DOI: 10.1557/jmr.2020.294 | **abstract-only**
- Elements: Fe, Ni, Cr, Co, Al

### Verified: Sharifi & Wick (2025) Multi-Element EAM
- DOI: 10.1016/j.commatsci.2024.113595 | **publisher page** (title only)
- Elements: Cu,Ti,Ni,Cr,Co,Al,Fe,Mn

## Component 3: PBS Solution
- **Water**: SPC/E recommended for corrosion simulations (best dielectric properties among common models)
- **Ions**: Na+, Cl-, K+ parameters from CHARMM/AMBER; HPO4^2-/H2PO4- need conversion from CHARMM36
- No specialized PBS LAMMPS force field found; must assemble from individual parameters

## Cross-Component Compatibility

### Recommended: LAMMPS `pair_style hybrid` (EAM/MEAM + LJ/Coulomb)
- LAMMPS docs confirm: EAM for metals + LJ+Coulomb for water/ions is a documented use case
- Cross-terms must be pairwise additive (LJ or Morse)
- **CRITICAL**: Do NOT combine two EAM/MEAM potentials for different metal subsets - "large error in embedding term"
- No single existing potential covers ALL elements needed (Hf,Nb,Ta,Ti,Zr,Fe,Cr,Ni)

### Tiered Strategy
| Tier | Approach | Feasibility | Accuracy |
|------|----------|-------------|----------|
| 1 | Zhou 2004 EAM (all metals, approx missing elements) | HIGH | MODERATE |
| 2 | Huang MEAM (HEA) + Choi MEAM (SS), hybrid, test embedding error | MODERATE | HIGH |
| 3 | Develop custom ML-IAP/SNAP/GAP for all elements | LOW | POTENTIALLY HIGH |

### ReaxFF: NOT RECOMMENDED
- No single ReaxFF parameter set covers all required elements
- New parameter development would be a major research project

## Key Literature DOIs
- HEA MEAM: 10.1016/j.matdes.2021.109560
- HEA EAM: 10.1016/j.ijplas.2026.104626
- HEA+SS EAM: 10.1103/physrevb.69.144113
- SS MEAM: 10.1016/j.commatsci.2017.01.002
- SS EAM: 10.1557/jmr.2020.294
- Multi-element EAM: 10.1016/j.commatsci.2024.113595

## Cautions
1. No single potential covers all required elements
2. Cross-MEAM embedding error needs testing in Tier 2
3. Metal-water LJ cross-parameters are the largest uncertainty source
4. Phosphate ion parameters need conversion from CHARMM to LAMMPS format
