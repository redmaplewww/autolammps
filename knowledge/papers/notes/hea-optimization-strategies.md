# HEA Optimization Strategies for LAMMPS Composition Screening

> Last updated: 2026-06-05
> Context: lightweight-hea-alcrfemnTi-ht-screening case (Al-Mg-Ti-Ni-Zr BCC HEA)
> Evidence level: All papers abstract-only (no full-text retrieved)

---

## Key Papers

### Strategy 1: Bayesian Optimization + MD (BCC, 7-component)
- **Paper**: Kurunczi-Papp & Laurson (2024), "Bayesian optimization of 7-component (AlVCrFeCoNiMo) single crystal alloy's compositional space to optimize elasto-plastic properties from molecular dynamics simulations"
- **DOI**: 10.1088/1361-651X/ad89b3
- **Method**: Combined LAMMPS-like MD with Gaussian Process Bayesian optimization
- **Key insight**: 2-4 component optimized alloys may outperform equiatomic HEAs
- **Limitation**: Optimizing different properties leads to different optimal compositions (shear modulus -> Mo-rich, yield -> Co-Cr-Ni, plasticity -> NiMo)

### Strategy 2: Single-element Variation in BCC HEA (MD)
- **Paper**: Dujana et al. (2024), "The effect of changing constituents on tensile mechanical properties of HfNbTaTiZr high entropy alloy: A molecular dynamics study"
- **DOI**: 10.1016/j.heliyon.2024.e38350
- **Method**: Varied each element 0-30% in BCC HfNbTaTiZr
- **Key insight**: Optimal M concentration exists (10% Nb/Ta) as tradeoff between solid-solution strengthening and homogeneity
- **Relevance**: Validates our Ni grade-scan approach

### Strategy 3: Bayesian Optimization for HEA (DFT)
- **Paper**: Pedersen et al. (2021), "Bayesian Optimization of High-Entropy Alloy Compositions for Electrocatalytic Oxygen Reduction"
- **DOI**: 10.1002/anie.202108116
- **Key insight**: ~50 experiments needed for HEA composition space optimization
- **Citations**: 178 (highly cited)

### Zhou04 EAM Reference
- **Paper**: Zhou, Johnson, Wadley (2004), DOI: 10.1103/PhysRevB.69.144113
- **Citations**: 1,267
- **Covers**: Al, Mg, Ti, Ni, Zr (all 5 elements in our system)
- **Limitation**: Cross-pair potentials use mixing rules for non-fit binary pairs; not validated for quinary HEAs

---

## Summary

| Topic | Finding |
|-------|---------|
| Optimization methods | Grid scan (1-2 vars), Bayesian optimization (3+ vars) |
| Compositions needed | 10-50 for grid, 50-200 for BO |
| Zhou04 reliability | Adequate for ranking trends, not 1 at% precision |
| Al-Mg-Ti-Ni-Zr | No published papers -- novel system |
| Convergence | Stop when 3 consecutive compositions show <2% improvement |

## Usage Policy

- These findings should be reviewed before WF-01/WF-02 optimization stages
- If expanding to 3+ composition variables, recommend switching to Bayesian optimization
- DOI links can be used for full-text retrieval via institutional access
