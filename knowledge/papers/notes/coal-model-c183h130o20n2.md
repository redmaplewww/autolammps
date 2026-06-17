# Coal Molecular Model: C183H130O20N2

## Quick Summary

The molecular formula C183H130O20N2 describes a **medium-to-high volatile bituminous coal model** (C 82.1%, H 4.9%, O 12.0%, N 1.0%; H/C=0.71; MW ~2677 g/mol). This formula is **larger than the classical Wender and Given models (~C100)** but **smaller than the Shinn model (C240H171O49N3)**. The H/C ratio of 0.71 matches the Shinn model, but with fewer oxygen groups (20 vs 49). This is likely a **bituminous coal model from Chinese computational literature** used for ReaxFF/LAMMPS simulations.

## Verification Status

- **Specific published model name**: NOT VERIFIED (search tools could not find matching papers)
- **Formula analysis**: Verified by calculation (matches bituminous coal rank)
- **General coal model knowledge**: Based on established literature (Given 1960, Wender 1976, Shinn 1984)

## Search Environment Issues

- Web search returned only generic content (no academic papers)
- Semantic Scholar API rate-limited throughout session
- Academic publishers (ACS, Elsevier, Springer) returned 403
- Google Scholar inaccessible (ECONNREFUSED)

## Recommended Force Fields for LAMMPS

| Purpose | Force Field | LAMMPS Package |
|---------|-------------|----------------|
| Pyrolysis / reactions | ReaxFF | reax/c |
| Mechanical properties | PCFF | pcff (user-pcff) |
| Fast screening | CVFF | default |
| Solvent interactions | OPLS-AA | default |

## Key Indices

- **Aromatic carbon fraction (fa)**: estimated 0.70-0.78
- **Double bond equivalents**: 120
- **Functional groups**: 6-10 phenolic OH, 4-8 ether bridges, 2-4 C=O, 0-2 COOH
- **Nitrogen**: heterocyclic (pyridine/pyrrole)
- **Aromatic rings**: ~12-16 in 3-5 clusters

## Write-back Path

- `scratchpad/papers/coal-model-c183h130o20n2.md` (detailed)
- This file (knowledge/papers/notes/)

## Follow-up Required

Before using this formula in a production LAMMPS workflow:
1. Re-try Semantic Scholar API for verification
2. Search for the exact published structure (connectivity, ring distribution)
3. Confirm force field parameters for the specific functional groups
