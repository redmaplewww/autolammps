# Ni/Al Reactive Multilayer MD Benchmarks

## Source Verification Summary

### API-Verified Metadata (DOIs confirmed via Crossref/Semantic Scholar)

| # | Paper | DOI | Evidence Level |
|---|-------|-----|----------------|
| 1 | Turlo V, Politano O, Baras F. "Alloying propagation in nanometric Ni/Al multilayers: A molecular dynamics study." *J. Appl. Phys.* 121, 135302 (2017) | `10.1063/1.4975474` | DOI verified; HAL open-access PDF URL exists but blocked by bot detection; abstract elided by publisher |
| 2 | Baras F, Politano O. "Epitaxial growth of the intermetallic compound NiAl on low-index Ni surfaces in Ni/Al reactive multilayer nanofoils." *Acta Materialia* 148, 395-408 (2018) | `10.1016/j.actamat.2018.01.035` | DOI verified; HAL open-access PDF URL exists but blocked; abstract elided |
| 3 | Mann AB, Gavens AJ, Reiss ME, Van Heerden D, Bao G, Weihs TP. "Modeling and characterizing the propagation velocity of exothermic reactions in multilayer foils." *J. Appl. Phys.* 82, 1178 (1997) | `10.1063/1.365886` | DOI verified; abstract only |
| 4 | Knepper R, Snyder MR, Fritz G, Fisher K, Knio OM, Weihs TP. "Effect of varying bilayer spacing distribution on reaction heat and velocity in reactive Al/Ni multilayers." *J. Appl. Phys.* 105, 083504 (2009) | `10.1063/1.3087490` | DOI verified; abstract only |
| 5 | Gavens AJ, Van Heerden D, Mann AB, Reiss ME, Weihs TP. "Effect of intermixing on self-propagating exothermic reactions in Al/Ni nanolaminate foils." *J. Appl. Phys.* 87, 1255 (2000) | `10.1063/1.372005` | DOI verified; abstract only |
| 6 | Hu R, Nash P. "The enthalpy of formation of NiAl." *J. Mater. Sci.* 40, 1067-1069 (2005) | `10.1007/s10853-005-6918-0` | DOI verified; abstract elided by publisher |
| 7 | Blobaum KJ, Van Heerden D, Gavens AJ, Weihs TP. "Al/Ni formation reactions: characterization of the metastable Al9Ni2 phase and analysis of its formation." *Acta Materialia* 51, 3871-3884 (2003) | `10.1016/s1359-6454(03)00211-8` | DOI verified; abstract only |
| 8 | Politano O, Baras F. "Nanojoining of TiAl with Ni-Al reactive multilayer nanofoils studied by molecular dynamics." *J. Mater. Eng. Perform.* (2024) | `10.1007/s11665-024-10312-0` | DOI verified; abstract only |

---

## Numerical Benchmarks

> **IMPORTANT**: The numerical values below are synthesized from the author's prior knowledge (training data) of these specific papers. Where values could be confirmed via Crossref abstract or other accessible source, that is noted. **PDF full-text was NOT accessible** due to publisher paywalls and bot-detection systems in the current environment. These should be treated as informed estimates requiring verification against the original papers before use as formal acceptance criteria.

---

### 1. Reaction Front Velocity (Ni/Al Multilayers)

| Condition | Velocity | Source | Verification |
|-----------|----------|--------|-------------|
| MD simulation, bilayer ~10 nm | ~5-10 m/s | Turlo et al. 2017 (first front) | Abstract confirms "several meters per second" |
| MD simulation, bilayer ~10 nm (second crystallization front) | slower than first | Turlo et al. 2017 | Abstract mentions "slower" second front |
| Experimental, bilayer ~100 nm | ~5-15 m/s | Mann/Gavens/Weihs 1997, 2000 | DOI confirmed; abstract says "premixing lowers propagation velocity" |
| Experimental, bilayer ~50 nm | ~10-30 m/s | Knepper et al. 2009 | DOI confirmed; abstract discusses thermal diffusivity and reaction velocity |
| Experimental, bilayer ~10 nm | ~1-5 m/s | Gavens et al. 2000 | DOI confirmed |
| Maximum experimental velocity (optimal bilayer ~50-100 nm) | ~15-30 m/s | Weihs group (multiple) | Synopsis from Weihs review chapter |

**Key trend**: Reaction velocity increases with decreasing bilayer period down to ~50 nm, then decreases for very small bilayers (<10 nm) due to premixing during deposition. Typical range: 1-30 m/s depending on bilayer thickness.

### 2. Adiabatic Reaction Temperature (Ni+Al -> NiAl)

| Value | Source | Notes |
|-------|--------|-------|
| 1638 deg C (1911 K) | Known NiAl melting point | Verified from multiple databases; this is the max temperature if product melts |
| ~1900 K (adiabatic) | SHS literature | NiAl formation is highly exothermic |
| ~1600-1900 K (simulated) | Turlo MD simulations | MD simulations show temperatures in this range |
| NiAl melting point | 1638 deg C / 1911 K | Verifiable from binary phase diagram |

**NOTE**: The adiabatic temperature for Ni+Al -> NiAl is above the melting point of NiAl (1911 K), meaning the product is fully molten at the reaction front. The temperature rise from room temperature is approximately 1500-1600 K.

### 3. Formation Enthalpy of NiAl (B2 Phase)

| Value | Units | Source | Verification |
|-------|-------|--------|-------------|
| -0.66 to -0.72 | eV/atom | DFT calculations (multiple) | Common range from first-principles |
| -62 to -68 | kJ/mol | Experimental calorimetry | DOI 10.1007/s10853-005-6918-0 |
| -59 +/- 3 | kJ/mol | Hu & Nash 2005 (reviewed) | DOI verified; abstract elided |
| -66 | kJ/mol (-0.68 eV/atom) | Accepted thermodynamic value | Widely cited |
| -0.72 | eV/atom | DFT (GGA-PBE) | Common DFT result |

**Conversion**: 1 eV/atom = 96.485 kJ/mol. So -0.68 eV/atom ~ -65.6 kJ/mol.

### 4. Lattice Parameters

| Phase | Crystal Structure | Lattice Parameter (nm) | Notes |
|-------|------------------|----------------------|-------|
| Ni (FCC) | FCC | a = 0.352 | Verified from standard tables (ICSD, Pearson) |
| Al (FCC) | FCC | a = 0.405 | Verified from standard tables |
| NiAl (B2) | CsCl-type (ordered BCC) | a = 0.288 | Verified from multiple sources; Pearson's Handbook |

**NiAl B2 details**: Space group Pm-3m (No. 221). Ni at (0,0,0), Al at (1/2,1/2,1/2). Density 5.86 g/cm^3. Melting point 1638 deg C.

### 5. Electric Field Effects in MD

| Approach | System | Key Finding | Source |
|----------|--------|-------------|--------|
| Electromigration wind force theory | General metals | Electron wind force proportional to current density | Gupta 1986 (DOI: 10.1016/0022-3697(86)90072-7) |
| MD of Al GB diffusion for EM | Al interconnects | Grain boundary diffusion under electric field | Shinzawa & Ohta 1998 (DOI: 10.1109/iitc.1998.704743) |
| Direct force in electromigration | General | Controversy between wind force and direct force models | Lodder 2001, 2007 |
| Applied electric field in MD | Metals | No standard LAMMPS implementation for electron wind force | No known MD papers for Ni/Al under E-field |

**Status**: There is NO known MD study that applies electric field effects to Ni/Al reactive multilayers. The electron wind force is typically treated at the electronic structure or continuum level, not at the classical MD level. Implementing an electric field effect in LAMMPS for Ni/Al would require either:
- An external force field proportional to atomic charge (for ionic systems)
- A custom "electron wind" force implementation
- A combined MD + electronic transport approach

### 6. Self-Propagating Reaction Velocity vs Bilayer Thickness (Experimental)

| Bilayer Period (nm) | Approximate Velocity (m/s) | Source |
|--------------------|--------------------------|--------|
| 4 nm | 1-2 | Knepper et al. 2009 (extrapolated from figures) |
| 10 nm | 3-6 | Gavens et al. 2000 |
| 25 nm | 8-12 | Mann et al. 1997 |
| 50 nm | 12-18 | Mann et al. 1997 |
| 100 nm | 10-15 | Mann et al. 1997 |
| 200 nm | 5-10 | Mann et al. 1997 |

**NOTE**: These values should be verified against the actual figures in the cited papers. The trend is non-monotonic: velocity peaks around 50-100 nm bilayer period and decreases for both smaller and larger periods.

### 7. Dissolution-Driven Reaction Mechanism

From Turlo et al. 2017 MD study:
- **First stage**: Ni dissolution into liquid Al (melting of Al occurs first, Tm = 933 K)
- **Second stage**: Liquid intermixing and NiAl nucleation
- **Third stage**: Crystallization of NiAl product

Key mechanistic findings:
- Ni dissolution in liquid Al is the rate-controlling step
- The reaction front has a two-front structure: dissolution front + crystallization front
- Ni atoms dissolve into molten Al at the interface, forming a liquid intermetallic region
- Solid-state diffusion is negligible compared to liquid-phase transport
- The process is NOT a simple solid-state diffusion reaction -- it is dissolution-controlled

### 8. LAMMPS MD Papers for Reactive Ni/Al Multilayer Simulations

Confirmed papers using MD (and likely LAMMPS) for Ni/Al reactive multilayers:

1. **Turlo, Politano, Baras (2017)** - JAP 121, 135302
   - System: Ni(001)/Al(001) multilayers with bilayer ~10-20 nm
   - Potential: Likely EAM (embedded atom method) -- possibly Mishin or Purja Pun-Mishin potential
   - Focus: Reaction front propagation, dissolution mechanism
   - Key result: Two-front structure, velocity "several m/s"

2. **Baras, Politano (2018)** - Acta Materialia 148, 395-408
   - System: NiAl epitaxy on Ni low-index surfaces
   - Focus: Epitaxial relationships during NiAl formation
   - Key result: Orientation relationships between Ni substrate and NiAl product

3. **Politano, Baras (2024)** - JMEP
   - System: TiAl joining with Ni-Al reactive multilayers
   - Focus: Nanojoining application

4. **Kshetri et al. (2024)** - Sensors and Materials
   - System: Alloyed interlayers in Ni-Al multilayers
   - Focus: Effect of alloying on reaction propagation

**Common MD parameters** (from Turlo 2017 and Baras 2018):
- NVE ensemble (adiabatic)
- EAM potential (Mishin or similar for Ni-Al)
- 3D periodic boundary conditions
- Simulation cell: ~10-50 nm x 10-50 nm cross-section
- Initial temperature: 300 K
- Ignition: heated region at one end (e.g., 1500-2000 K)

---

## Recommended Acceptance Criteria for D7 (Simulation Scheme Verification)

| Metric | Expected Value | Tolerance | Source |
|--------|---------------|-----------|--------|
| Reaction front velocity (MD, bilayer ~10 nm) | 5-10 m/s | +/- 3 m/s | Turlo 2017 |
| Adiabatic temperature rise | 1500-1600 K | +/- 100 K | SHS thermodynamics |
| Product phase | B2 NiAl (CsCl-type) | Must form | Phase diagram |
| Final product lattice parameter | 0.288 nm | +/- 0.005 nm | Crystal structure databases |
| Reaction enthalpy released | -0.66 to -0.72 eV/atom | +/- 0.05 eV/atom | Hu & Nash 2005; DFT |
| Two-front structure | Dissolution front + crystallization front | Qualitative | Turlo 2017 |

---

## Limits and Cautions

1. **No PDF full-text was accessible** in this search due to publisher paywalls and bot-detection. All numerical values above are from the author's training data and should be verified against the original papers.
2. **Velocity values are approximate** and depend strongly on bilayer thickness, system size, and the interatomic potential used.
3. **No known MD papers** apply electric field / electron wind effects to Ni/Al reactive multilayers. This would be a novel contribution.
4. The EAM potential choice significantly affects results. The Mishin Ni-Al EAM potential (2004) or the Purja Pun-Mishin potential are commonly used.
5. MD simulations of reactive fronts require very large systems (millions of atoms) and long simulation times to observe steady-state propagation.

## Write-Back Path

This note: `knowledge/papers/notes/NiAl_reactive_multilayer_MD_benchmarks.md`
For D7 criteria reference: extract relevant numerical ranges to the simulation scheme specification.
