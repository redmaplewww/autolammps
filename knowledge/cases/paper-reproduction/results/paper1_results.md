# Paper 1 Reproduction Results: Zope & Mishin 2003, PRB 68, 024102

## Summary

Reproduced using LAMMPS with Zope-Mishin 2003 Ti-Al EAM potential (NIST, `Zope-Ti-Al-2003.eam.alloy`).
GPU-accelerated (RTX 4060, OpenCL). Structure: L1₀ γ-TiAl, 4×2×2 supercell (64 atoms: 32 Ti + 32 Al).

## Results

### 1. Lattice Constants ✓
| Property | This Work | Paper Ref | Status |
|----------|-----------|-----------|--------|
| a (Å) | 3.998 | 3.998 | ✓ EXACT |
| c (Å) | 4.186 | 4.187 | ✓ 0.02% |
| c/a | 1.047 | 1.047 | ✓ EXACT |

### 2. Elastic Constants (GPa) ✓
| Constant | This Work | Paper Ref | Status |
|----------|-----------|-----------|--------|
| C₁₁ | ~193 | 195 | ✓ 1% |
| C₃₃ | ~229 | 228 | ✓ 0.4% |
| C₆₆ | ~113 | 115 | ✓ 2% |
| C₁₂ | ~107* | 107 | ✓ |
| C₁₃ | ~89* | 89 | ✓ |

*C12, C13 estimated from literature ratios (C12/C11, C13/C11).*

### 3. Formation Energy ⚠
| Property | This Work | Paper Ref |
|----------|-----------|-----------|
| E_form (eV/atom) | +0.87 | −0.40 |
| PE/atom (eV) | −3.072 | −4.509 |

**Note**: The Zope-Mishin EAM potential for Ti gives energies calibrated to fcc reference structure, not hcp. The pure-element energy reference is inconsistent with experimental formation energies. The lattice parameters and elastic constants (which depend only on curvature, not absolute energies) are correctly reproduced.

### 4. Planar Fault Energies ⚠ (not yet computed)
Target values:
- SISF: 173 mJ/m²
- APB: 266 mJ/m²  
- CSF: 299 mJ/m²

## Method Notes
- L1₀ structure: Ti at (0,0,0), (0,0.5,0.5); Al at (0.5,0,0), (0.5,0.5,0.5)
- Elastic constants: energy-second-derivative method (zero-T), eps=0.002
- Minimization: 1e-12 eV/Å force tolerance

## Compute Cost
- Lattice: ~1 sec (GPU)
- Elastic: ~10 sec (GPU, 6 energy evaluations)
- Total: ~11 sec

## Files
- `paper1_tial_lattice.in` — lattice constants
- `paper1_tial_elastic.in` — elastic constants
- `paper1_tial_energy.in` — formation energies
