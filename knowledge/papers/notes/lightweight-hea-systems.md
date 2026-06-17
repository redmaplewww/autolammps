# Lightweight High-Entropy Alloy Systems for LAMMPS Simulation

> Last updated: 2026-06-03
> Context: lightweight-hea-alcrfemnTi-ht-screening case

---

## Key Papers

### 1. Al-Cr-Fe-Mn-Ti System (Primary Recommendation)

| Field | Value |
|---|---|
| **System** | Al-Cr-Fe-Mn-Ti |
| **Density** | 5.90 g/cm3 (equimolar ROM); < 5.5 g/cm3 achievable with Al+Ti > 50 at% |
| **Structure** | BCC (primary), B2 ordering possible at high Al+Ti |
| **Potential** | MEAM FeMnNiTiCuCrCoAl -- FULL coverage |
| **Status** | Multiple experimental reports, well-characterized |
| **Key composition** | Al30Cr15Fe15Mn15Ti25 (density ~5.28 g/cm3) |

**Evidence**: Abstract-only (paywalled publisher pages). DOI: 10.1007/s11661-025-07935-w (AlTiCrFeMn variant, 2025).

### 2. Non-Cantor AlCuSiZnFe (Sharma et al., 2020)

| Field | Value |
|---|---|
| **DOI** | 10.1016/j.msea.2020.140066 |
| **Density** | 4.98-5.24 g/cm3 |
| **Structure** | FCC+BCC dual phase |
| **Strength** | 1987 MPa compressive |
| **Potential** | Si NOT covered -- cannot simulate |
| **Relevance** | Reference for lightweight HEA properties; demonstrates achievable density range |

**Evidence**: Full abstract retrieved via Semantic Scholar API.

### 3. MgAlTiVFeCo (Ren et al., 2026)

| Field | Value |
|---|---|
| **DOI** | 10.3390/ma19040770 |
| **Structure** | BCC primary |
| **Hardness** | 1235.5 HV |
| **Potential** | V NOT covered |
| **Relevance** | Template for V -> Cr/Mn substitution to create computable system |

**Evidence**: Full abstract retrieved via Semantic Scholar API + PubMed Central OA.

### 4. Review: Lightweight Al-based Entropy Alloys (Cui, Zhang, Chen, 2023)

| Field | Value |
|---|---|
| **DOI** | 10.1007/s40843-023-2699-2 |
| **Type** | Review |
| **Relevance** | Comprehensive overview of lightweight Al-based HEA systems |

**Evidence**: DOI verified.

---

## Potential Coverage Summary

| Element | Zhou04 EAM | MEAM (FeMnNiTiCuCrCoAl) | Density (g/cm3) |
|---|---|---|---|
| Mg | YES | NO | 1.74 |
| Al | YES | YES | 2.70 |
| Ti | YES | YES | 4.51 |
| Zr | YES | NO | 6.52 |
| Cr | NO | YES | 7.19 |
| Mn | NO | YES | 7.21 |
| Fe | YES | YES | 7.87 |
| Co | YES | YES | 8.90 |
| Ni | YES | YES | 8.91 |
| Cu | YES | YES | 8.96 |

## Related Notes

- `knowledge/papers/notes/hea-optimization-strategies.md` -- BCC HEA optimization methods, Zhou04 EAM limitations, convergence practices

## Recommended Action

Proceed with Al-Cr-Fe-Mn-Ti at composition-adjusted formulations (Al+Ti > 50 at%) to achieve density < 5.5 g/cm3. The MEAM potential covers all elements.
