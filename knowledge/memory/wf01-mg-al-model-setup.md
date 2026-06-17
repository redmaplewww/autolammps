# WF-01: Mg-Al Alloy Tensile Simulation Model Setup Draft

**Generated:** 2026-04-02
**Stage:** WF-01 (Model Setup)
**Status:** Draft - Requires Reviewer Approval

---

## 1. Model Description

### 1.1 Structural Type Selection

**Decision:** Mg-Al Solid Solution Model (Random Substitutional Alloy)

**Rationale:**
- Mg (HCP) and Al (FCC) have incompatible crystal structures, making direct lattice-based alloy modeling problematic
- Random solid solution approach allows mixing atoms within a unified lattice framework
- Following precedent from `knowledge/cases/raw/合金建模/in.melt.lmp` which uses `set type type/fraction` for alloy creation
- Consistent with MgHo case (`knowledge/cases/raw/MgHo/in.1e9.lmp`) which demonstrates doping HCP structures

### 1.2 Composition Strategy

**Chosen Composition:** Mg-10at% Al (Mg-rich solid solution)

**Justification:**
- Mg-rich region is more accessible for solid solution modeling
- 10% Al is a common alloying level in commercial Mg-Al alloys
- Maintains predominantly HCP-like local environments
- Lower Al content reduces lattice mismatch stress compared to Al-rich compositions

**Alternative Considered (Rejected):** Al-Mg solid solution
- Al (FCC) dominant would require complete lattice reconstruction
- Higher risk of phase instability during relaxation

---

## 2. Structure File Specification

### 2.1 Base Lattice

**Choice:** Hexagonal (HCP) Base - Mg lattice parameters

**Parameters:**
- `lattice hcp 3.209` (from MgHo case reference)
- a = 3.209 Angstroms
- Ideal c/a ratio for HCP

**Source Evidence:**
- `knowledge/cases/raw/MgHo/in.1e9.lmp` line 18: `lattice hcp 3.209`
- This represents pure Mg lattice constant at reference state

### 2.2 Box Dimensions

**Initial Setup:**
- `region box block 0 50 0 50 0 50 units box`
- Periodic boundaries: `boundary p p p`
- Orthogonal simulation box (non-triclinic for initial tensile setup)

**Atom Count Estimation:**
- Based on HCP unit cell density
- Approximately 50 x 50 x 50 lattice units
- Expect ~10,000-15,000 atoms for sufficient statistical sampling

### 2.3 Alloy Creation Method

**Procedure:**
1. Create pure Mg lattice: `create_atoms 1 box` (Type 1 = Mg)
2. Randomly substitute with Al: `set type 1 type/fraction 2 0.1 12345` (Type 2 = Al)
3. Apply seed 12345 for reproducibility

**Source Evidence:**
- `knowledge/cases/raw/MgHo/in.1e9.lmp` line 22: `set type 1 type/ratio 2 0.02 12345`
- `knowledge/cases/raw/合金建模/in.melt.lmp` lines 31-33: `set type 1 type/fraction N fraction seed` pattern

### 2.4 File Output

**Target File:** `MgAl_solid_solution.data`

**Format:** LAMMPS data file (standard LAMMPS write_data output)

---

## 3. Boundary Conditions and Deformation Setup

### 3.1 Boundary Conditions

**Initial State:**
- All directions periodic: `boundary p p p`
- Allows free relaxation in all directions during equilibration

**Tensile Deformation:**
- Deformation direction: x-axis (uniaxial tension)
- Y and Z directions will be controlled (either NPT or NVT with pressure coupling)
- Following pattern from `knowledge/cases/raw/Ni基合金拉伸/in.1e9.lmp` line 91: `fix 2 all deform 500 x erate ${rate} units box remap x`

### 3.2 Deformation Parameters

**Strain Rate:**
- Target: 1e9/s (1 × 10^9 s^-1)
- Variable: `rate index -0.001` (negative for tension in LAMMPS convention)
- Based on MgHo and Ni-based alloy cases using similar rates

**Strain Definition:**
- Engineering strain: `strainx = (lx - Lx0) / Lx0`
- Must freeze initial box length: `Lx0 = lx` at start of deformation
- Following confirmed lesson [CL-007]: Engineering strain must freeze initial box length

### 3.3 Stress Output

**Stress Calculation:**
- Stress in GPa: `stressx = -pxx / 10000`
- Conversion factor: LAMMPS pressure units (metal) → GPa (/10000)
- Source: Multiple tensile cases use this conversion

### 3.4 Temperature Control

**Planned Temperature:** 300 K (room temperature)
- Will require NPT or NVT ensemble during deformation
- Following `knowledge/cases/raw/Ni基合金拉伸/in.1e9.lmp` line 97: `fix 1 all nvt temp 300 300 1`

---

## 4. Structure Files

### 4.1 Files to be Created

1. **`MgAl_solid_solution.data`** - Initial alloy structure
   - Output from structure generation script
   - Contains atom positions, types, box dimensions

2. **`MgAl_equil.data`** - Post-equilibration structure
   - After NPT relaxation
   - Serves as deformation starting point

3. **`MgAl_min.data`** - Post-minimization structure
   - After energy minimization
   - For structure quality verification

### 4.2 Structure Validation Checks

- Atomic volume reasonable for Mg-Al system
- No overlapping atoms (after `delete_atoms overlap`)
- Box dimensions stable during minimization
- Energy convergence achieved

---

## 5. Key Assumptions

### 5.1 Structural Assumptions

[ASSUMPTION-001] Random solid solution adequately represents Mg-Al alloy behavior
- **Rationale:** Limited phase diagram knowledge; solid solution is standard starting point for alloy MD
- **Validation Needed:** Compare with known Mg-Al alloy properties if available

[ASSUMPTION-002] 10 at% Al is below solubility limit at 300 K
- **Rationale:** Mg-rich solid solution region in phase diagram
- **Validation Needed:** Cross-reference with Mg-Al binary phase diagram

[ASSUMPTION-003] HCP lattice with Al substitution remains stable
- **Rationale:** Low Al content should not trigger HCP→FCC transformation
- **Validation Needed:** Monitor for phase changes during equilibration

### 5.2 Simulation Assumptions

[ASSUMPTION-004] MEAM potential (Jelinek 2012) can handle Mg-Al interactions
- **Rationale:** Jelinek 2012 MEAM is a well-established Mg-Al potential covering Mg-rich solid solutions; MEAM captures directional bonding better than EAM for HCP-based alloys
- **Validation Needed:** Confirm Mg-Al cross-interaction parameters in library.meam and MgAl.meam files are compatible with our composition range
- **Potential files:** `library.meam` + `MgAl.meam` (Jelinek 2012)
- **Source:** Coordinator decision revision -- potential family changed from Zhou04 EAM to MEAM Jelinek 2012
- **Decision revision note:** Original draft listed Zhou04 EAM/alloy. This was revised to MEAM Jelinek 2012 based on coordinator instruction and better suitability for HCP Mg-Al systems. See Section 12 below.

[ASSUMPTION-005] Strain rate of 1e9/s is physically meaningful
- **Rationale:** Matches reference cases (MgHo, Ni-based alloys)
- **Validation Needed:** Consider if lower strain rate is needed for quasi-static behavior

[ASSUMPTION-006] 300 K represents room temperature conditions
- **Rationale:** Standard temperature for tensile simulations
- **Validation Needed:** Consider if elevated temperature is relevant for specific application

---

## 6. Risk Points

### 6.1 High-Risk Items

[RISK-001] **Crystal structure incompatibility**
- Mg (HCP) and Al (FCC) have fundamental lattice mismatch
- Random substitution may create local lattice distortion
- **Mitigation:** Start with Mg-dominant composition; use energy minimization before dynamics

[RISK-002] **Potential file validation**
- MEAM Jelinek 2012 requires library.meam + MgAl.meam; element mapping must be verified
- No local Mg-Al specific validation cases found
- **Mitigation:** WF-02 must explicitly verify Mg-Al MEAM cross-interaction parameters and pair_coeff mapping
- **Reviewer Focus:** Confirm MEAM potential supports Mg-Al mixing; verify pair_coeff element ordering
- **Decision revision:** Potential family changed from Zhou04 EAM to MEAM Jelinek 2012

[RISK-003] **Solid solution stability**
- 10 at% Al may exceed actual solubility at 300 K
- May lead to clustering or phase separation during simulation
- **Mitigation:** Short equilibration period with careful energy monitoring

### 6.2 Medium-Risk Items

[RISK-004] **Overlap removal sensitivity**
- Substituting atoms may create local overlaps
- `delete_atoms overlap` threshold must be chosen carefully (confirmed lesson [CL-004])
- **Mitigation:** Use conservative threshold (0.4 Å from MgHo case)

[RISK-005] **Box size adequacy**
- Current 50x50x50 may be too small for statistical averaging
- May not capture dislocation nucleation properly
- **Mitigation:** Consider scaling up if results show size effects

[RISK-006] **Strain rate effects**
- 1e9/s is very high strain rate; behavior may differ from experimental rates
- Dislocation mechanisms may be strain-rate dependent
- **Mitigation:** Note this limitation in final interpretation

---

## 7. Source Examples Consulted

### 7.1 Primary References

1. **MgHo HCP Alloy Case**
   - Path: `knowledge/cases/raw/MgHo/in.1e9.lmp`
   - Used for: HCP lattice setup, doping procedure, tensile workflow
   - Key elements: `lattice hcp`, `set type type/ratio`, stress-strain definitions

2. **Ni-Based Multi-Element Tensile Case**
   - Path: `knowledge/cases/raw/Ni基合金拉伸/in.1e9.lmp`
   - Used for: Multi-element alloy handling, tensile deformation setup
   - Key elements: EAM/alloy usage, `fix deform`, strain calculation

3. **Alloy Modeling Case**
   - Path: `knowledge/cases/raw/合金建模/in.melt.lmp`
   - Used for: Random alloy creation with `type/fraction`
   - Key elements: `set type 1 type/fraction N fraction seed`

### 7.2 Supporting References

4. **TiAl Alloy Case**
   - Path: `knowledge/cases/raw/TiAl/TIAL.in`
   - Used for: Multi-element alloy structure handling
   - Note: Demonstrates B2-ordered alloy (different approach, not adopted)

5. **CuAl Interface Case**
   - Path: `knowledge/cases/raw/CuAL/Cu-Al-Al.data`
   - Used for: Cu-Al alloy structure reference
   - Note: Interface model, not adopted for our solid solution approach

---

## 8. Manual References

### 8.1 LAMMPS Commands Referenced

- `lattice hcp` - LAMMPS manual: lattice command documentation
- `set type type/fraction` - LAMMPS manual: set command documentation
- `set type type/ratio` - LAMMPS manual: set command documentation
- `delete_atoms overlap` - LAMMPS manual: delete_atoms command documentation
- `fix deform` - LAMMPS manual: fix deform command documentation
- `fix npt` / `fix nvt` - LAMMPS manual: fix npt/nvt command documentation

**Note:** Manual references are listed but not fully cited in this draft. Full citation with specific section references should be added during WF-03A or review phase.

---

## 9. Self-Check Results

### 9.1 Self-Check Passed Items

- [PASS-001] Referenced at least one local example (MgHo case)
- [PASS-002] Explicitly recorded key assumptions (Section 5)
- [PASS-003] File naming follows case family conventions (`MgAl_solid_solution.data`)
- [PASS-004] Output items support subsequent analysis (stress-strain data, structure files)
- [PASS-005] Applied confirmed lesson [CL-007]: Strain calculation freezes initial box length
- [PASS-006] Applied confirmed lesson [CL-004]: Narrow overlap deletion threshold (0.4 Å)
- [PASS-007] Applied confirmed lesson [CL-008]: Searched local examples before defining model

### 9.2 Items Requiring Reviewer Attention

- [CHECK-001] Potential file contains both Mg and Al - NEED VERIFICATION
- [CHECK-002] 10 at% Al within solubility limit at 300 K - NEED MATERIAL KNOWLEDGE
- [CHECK-003] HCP lattice stability with Al substitution - NEED PHYSICAL VALIDATION
- [CHECK-004] Box size (50x50x50) adequate for dislocation mechanisms - NEED EXPERT INPUT
- [CHECK-005] Strain rate choice (1e9/s) appropriate for research goals - NEED USER INPUT

---

## 10. Next Steps and Reviewer Focus

### 10.1 Review Focus Items

The reviewer should specifically examine:

1. **Material System Validity**
   - Is Mg-10at% Al a physically meaningful composition?
   - Should we consider ordered intermetallics instead of solid solution?

2. **Structural Approach**
   - Is random substitution on HCP lattice the right approach?
   - Are there better ways to model HCP/FCC mixing (e.g., bicrystals, phase interfaces)?

3. **Box Size and Atom Count**
   - Is 50x50x50 sufficient for tensile deformation studies?
   - Should we recommend larger system for better statistics?

4. **Potential File Suitability**
   - Confirm Zhou04 EAM/alloy has Mg-Al cross-interaction parameters
   - Consider if MEAM (Jelinek 2012) is more appropriate despite being a backup candidate

5. **Simulation Parameters**
   - Is 1e9/s strain rate acceptable?
   - Should we recommend multiple strain rates for rate-dependence study?

### 10.2 Transition to WF-02

After reviewer approval, WF-02 will:
- Select and validate potential function (EAM/alloy Zhou04 vs MEAM Jelinek)
- Define `pair_style` and `pair_coeff` parameters
- Map Mg and Al elements to atom types in data file
- Document potential selection rationale

### 10.3 Transition to WF-03A

After WF-02 approval, WF-03A will:
- Write complete LAMMPS input script
- Implement equilibration, minimization, and deformation stages
- Configure stress-strain output and trajectory dumping
- Include proper thermo output and restart files

---

## 11. Additional Notes

### 11.1 Not Adopted Approaches

**Ordered Intermetallic (TiAl-style)**
- `knowledge/cases/raw/TiAl/` shows B2-ordered alloy
- Not adopted because Mg-Al does not have widely-used B2 phase
- Could be considered if reviewer recommends it

**Interface Model (CuAL-style)**
- `knowledge/cases/raw/CuAL/` shows Cu-Al interface
- Not adopted because we want bulk alloy behavior, not interface
- Could be future work for grain boundary studies

**Bicrystal/Polycrystal**
- Not found in local examples
- Could be considered for studying grain boundary effects
- Higher complexity; defer to later work

### 11.2 Computational Considerations

- Atom count (~10k-15k) is moderate for single-node simulation
- EAM/alloy is computationally efficient compared to MEAM
- No reactive dynamics; can use larger timesteps (1 fs recommended)
- Deformation simulation (500k-5M steps) will require significant runtime

### 11.3 Validation Strategy

Once structure is generated:
1. Calculate density and compare with Mg-Al alloy reference values
2. Check for abnormal atomic volumes or local clustering
3. Verify energy minimization converges to reasonable PE
4. Confirm stress tensor is isotropic after NPT equilibration

---

**End of WF-01 Model Setup Draft**

**Status:** Awaiting `lammps-reviewer` approval
**Next Stage:** WF-02 (Potential Configuration)

---

## 12. Decision Revisions

### [REV-001] Potential family changed from Zhou04 EAM to MEAM Jelinek 2012

- **Date:** 2026-04-05
- **Stage:** WF-01
- **Original decision:** Zhou04 EAM/alloy (`CuAgAuNiPdPtAlPbFeMoTaWMgCoTiZr_Zhou04.eam.alloy`)
- **Revised decision:** MEAM Jelinek 2012 (`library.meam` + `MgAl.meam`)
- **Rationale:**
  - Coordinator instruction specified MEAM Jelinek 2012 as the potential family
  - MEAM provides better directional bonding description for HCP-based Mg-Al alloys
  - Jelinek 2012 is a widely-cited Mg-Al specific potential, whereas Zhou04 is a 16-element general-purpose potential where Mg-Al cross-terms may not be optimized
- **Impact on WF-01:**
  - No structural impact -- WF-01 only generates the initial data file
  - The structure file (MgAl_solid_solution.data) remains compatible with MEAM
  - Type mapping (Type 1 = Mg, Type 2 = Al) is unchanged
- **Impact on WF-02:**
  - WF-02 must configure `pair_style meam` instead of `pair_style eam/alloy`
  - Must provide correct `library.meam` and `MgAl.meam` file paths
  - Must verify pair_coeff element mapping against data file Masses section (per CL-010)
- **Impact on WF-03A:**
  - Minimization and dynamics will use the MEAM potential
  - No additional structural changes needed
