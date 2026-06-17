# MgAl Alloy Oxidation in Aqueous Solution -- Potential Survey

## Status: DEEPER SEARCH COMPLETED

**No single LAMMPS-compatible reactive potential covers Mg+Al+O+H simultaneously in the public domain.** However, 3 key ReaxFF papers from 2023-2025 (Song/Mei group) separately cover Al-Mg oxidation and Mg-water systems. See `scratchpad/papers/mgal-oxidation-potential-deep.md` for full survey.

## What IS Available in LAMMPS Distribution

| System | Potential File | pair_style | Reference |
|--------|---------------|------------|-----------|
| Mg-Al (metallic) | `AlSiMgCuFe.meam` | `meam/c` | Jelinek PRB 85, 245102 (2012) |
| Mg-Al (metallic) | `MgAl.rann` | `rann` | N/A |
| Al-O | `AlO.streitz` | `streitz` | Streitz-Mintmire |
| Al-O (SMTBQ) | `ffield.smtbq.Al2O3` | `smtbq` | SMTBQ |
| Zn-O-H (analog) | `ffield.reax.ZnOH` | `reax/c` | (Zn/water corrosion) |
| Water | `acks2_ff.water` | `acks2` | ACKS2 water |

## Key Published ReaxFF Papers (Not in LAMMPS Distribution)

### 1. Song et al. 2023 -- Al-Mg Alloy Oxidation (MOST RELEVANT)
- "Simulations on the oxidation of Al-Mg alloy nanoparticles using the ReaxFF reactive force field"
- DOI: 10.1016/j.mtcomm.2023.106180
- Elements: Mg, Al, O (possibly H)
- 15 citations
- **Best candidate for Mg-Al-O system**

### 2. Zhang et al. 2025 -- Mg + Water System
- "Development of a ReaxFF reactive force-field modeling for magnesium nanoparticles and water system"
- DOI: 10.1016/j.apsusc.2025.163207
- Elements: Mg, O, H
- 11 citations
- **Covers Mg-water chemistry**

### 3. Zhang et al. 2024 -- Earth Materials ReaxFF
- "General-purpose ReaxFF for earth materials"
- DOI: 10.1063/5.0194486
- Confirmed elements: Si, Al, O, H, Na, K
- **Covers Al-O-H but no Mg**

### 4. Dumortier et al. 2024 -- Water on Alumina ReaxFF
- DOI: 10.1021/acs.jctc.3c01009
- Elements: Al, O, H
- **Covers Al2O3-water interface**

## OpenKIM Search Results

**No model on OpenKIM includes Mg+Al+O+H simultaneously.** Relevant models found:
- MEAM: Jelinek (AlSiMgCuFe), Dickel (MgAlZn), Kim (AlMg) -- metallic only
- MEAM: KoShimLee_2011_AlH -- Al-H only
- No Mg-O or Al-O reactive models on OpenKIM

## Recommended Strategy

1. **Best option**: Contact Song/Mei group for ReaxFF parameter file from Song et al. 2023
2. **Hybrid**: Combine Zhang et al. 2024 (Al-O-H) + Zhang et al. 2025 (Mg-O-H) ReaxFF parameters
3. **Fallback**: MEAM (Jelinek 2012) for Mg-Al metal + ReaxFF for aqueous oxidation zone (requires obtaining ReaxFF parameters)
4. **Long-term**: Custom ML potential (DeePMD/MACE) trained on DFT data for Mg-Al-O-H

## Key Reference

Jelinek B, et al. "Modified embedded atom method potential for Al, Si, Mg, Cu, and Fe alloys" *Phys. Rev. B* 85, 245102 (2012). DOI: 10.1103/PhysRevB.85.245102 (274 citations)

## Evidence Levels

| Paper | Verification | Elements |
|-------|-------------|----------|
| Song 2023 (Mater. Today Commun.) | Semantic Scholar | Mg, Al, O, (H?) |
| Zhang 2025 (Appl. Surf. Sci.) | Semantic Scholar | Mg, O, H |
| Zhang 2024 (J. Chem. Phys.) | Abstract | Si, Al, O, H, Na, K |
| Dumortier 2024 (JCTC) | Semantic Scholar | Al, O, H |
| Jelinek 2012 (PRB) | File in LAMMPS + publisher | Mg, Al (metallic) |
| Raymand MgO ReaxFF | Unverified DOI | Mg, O |
| Russo Al/H2O ReaxFF | Unverified DOI | Al, O, H |

## Where to Find Potentials

| Resource | URL |
|----------|-----|
| LAMMPS potentials | github.com/lammps/lammps/tree/develop/potentials |
| OpenKIM | openkim.org |
| NIST Repository | ctcms.nist.gov/potentials |
| SCM ReaxFF documentation | www.scm.com/doc/ReaxFF |
