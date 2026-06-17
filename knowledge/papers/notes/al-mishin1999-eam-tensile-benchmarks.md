# Al FCC [001] Uniaxial Tensile -- Mishin 1999 EAM Literature Benchmarks

## Purpose
Provide validated elastic constants, orientation-dependent Young's modulus, and expected yield/UTS ranges for Al FCC single crystal tensile MD simulation using the Mishin 1999 EAM potential at 1e9/s strain rate, 300 K.

## Mishin 1999 EAM @0K (from PRB 59, 3393)
- a0 = 4.032 A
- Ec = 3.36 eV  
- C11 = 118.0 GPa, C12 = 61.0 GPa, C44 = 31.2 GPa

## Computed Elastic Properties @0K
| Property | Value | Unit |
|----------|-------|------|
| B = (C11+2C12)/3 | 80.0 | GPa |
| A = 2C44/(C11-C12) | 1.095 | -- |
| E_001 | 76.4 | GPa |
| E_110 | 81.1 | GPa |
| E_111 | 82.8 | GPa |
| G_Voigt | 30.1 | GPa |
| B/G | 2.66 | -- |

## Experimental @300K (Meyers & Chawla)
- C11~108, C12~61, C44~28.5 GPa
- E_001 ~63-70 GPa
- a0 = 4.05 A

## Expected MD @300K, 1e9/s
- E_001: 65-75 GPa (between EAM 0K and experimental 300K)
- Yield stress: 3-6 GPa
- UTS: 4-7 GPa
- UTS strain: 5-15%

## Key References
- M1999: Mishin et al., PRB 59, 3393 (1999) -- EAM potential
- Z2000: Zimmerman et al., MSMSE 8, 103 (2000) -- GSFE benchmarks
- O2004: Ogata et al., PRB 70, 104104 (2004) -- ideal strength
- H2001: Horstemeyer et al. (2001) -- MD tensile benchmarks (unverified locally)

## Workflow Template
Import from benchmark-04-cu-tensile-variant with orientation changed to [001] and Al potential.
Key rules: CL-007 (strain freeze), CL-011 (NPT lateral only), Tdamp=0.1 (not 100).
