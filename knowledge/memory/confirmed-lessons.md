# Confirmed Operational Lessons

This file stores confirmed operational LAMMPS lessons with direct script,
review, runtime, or analysis impact.

Always-read consumers should use `core-checks.md` first. Use this file only for
matching CL detail/evidence after a core check triggers, or via `lammps-knowledge`
MCP search by CL ID or topic.

Literature-derived metal design insights were moved to
`knowledge/memory/metal-research-insights.md`.

## [CL-001] ReaxFF review must reject missing charge handling
- status: confirmed
- category: review
- lesson: For local ReaxFF workflows, missing charge-capable atom style or missing `fix qeq/reax` is a blocker and should be rejected at review. Omitting `atom_style charge` (or `full`) or `fix qeq/reax` in a ReaxFF input is a misconfiguration, not an optional optimization — ReaxFF requires dynamic charge equilibration and cannot produce physically meaningful results without it.
- evidence: `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/NiC/in.NiC.reaxff`; `knowledge/cases/raw/GaN氧化/in.GaN.reaxff`
- note: Re-check exact pair style syntax for the chosen example family.

## [CL-002] Generated LAMMPS scripts still require reviewer gating
- status: confirmed
- category: workflow
- lesson: Even when local retrieval is strong, generated draft scripts can still contain variable or naming mistakes and must pass `lammps-reviewer` before trust.
- evidence: `knowledge/rules/workflow-stages.md`; `knowledge/reports/lammps-agent-test-report.md`
- note: Treat input-writer output as draft until reviewed.

## [CL-003] Fixed or frozen atoms must not receive broad initial velocities
- status: confirmed
- category: input
- lesson: If a model contains fixed, frozen, or boundary-constrained atoms, do not apply broad `velocity` initialization to those groups; initialize only mobile atoms.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/2026-03-25_fixed_atoms_no_velocity.md`; `knowledge/corrections/playbooks/lammps-failure-playbook.md`; knowledge/corrections/playbooks/lammps-failure-playbook.md
- note: This should be part of both script review and runtime sanity checks.

## [CL-004] Overlap deletion must stay narrow and avoid all-all broad deletion
- status: confirmed
- category: workflow
- lesson: `delete_atoms overlap` should use a narrow threshold and should not use broad `all all` deletion on sensitive structures, because it can silently destroy the target model.
- evidence: `knowledge/corrections/playbooks/lammps-failure-playbook.md`; `knowledge/corrections/playbooks/error-memory-playbook.md`
- note: Re-check group scope before any overlap cleanup in adsorption, deposition, or interface models.

## [CL-005] Running to completion is not enough without explicit acceptance criteria
- status: confirmed
- category: workflow
- lesson: A simulation finishing without an error is not sufficient acceptance; task-specific success metrics must be defined and checked.
- evidence: `knowledge/corrections/playbooks/lammps-failure-playbook.md`; `knowledge/corrections/playbooks/error-memory-playbook.md`
- note: Prefer explicit structural or deposition metrics instead of “run completed”.

## [CL-006] Validate restart or data provenance before continuing a run
- status: confirmed
- category: workflow
- lesson: Before continuing from a `restart` or `data` file, verify the file source, generation time, and box dimensions instead of assuming the intermediate file is valid.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/2026-03-22_v9_wrong_restart_file.md`
- note: This is especially important for multilayer or vacuum-containing models.

## [CL-007] Engineering strain must freeze the initial box length
- status: confirmed
- category: input
- lesson: When computing engineering strain, freeze the initial box length as an immediately-evaluated variable (via the `${var}` substitution trick) before starting any deformation; do not use a dynamic equal-style variable that tracks `lx`. In tensile scripts that equilibrate with NPT then switch to fix deform, capture the reference length right at the transition point, and do not assume later thermo_style changes will preserve the strain baseline.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/by-date/2026-03/COR-2026-03-11-001.md`; `knowledge/examples/tensile_al_small/in.tensile_small`; `.claude/lammps-kb-pipeline/raw/58f0ab83-627c-4cae-84ca-cc66c6c74407.json`
- note: Reuse validated stress-strain snippets before writing a fresh formula. The example `in.tensile_small` uses `variable L0 equal lx` (equal-style, not frozen) but avoids the bug by computing strain from time rather than lx/L0; do not copy that variable as a strain-reference template.

## [CL-008] Search local examples before writing high-risk input files
- status: confirmed
- category: workflow
- lesson: Before writing a high-risk LAMMPS `in` file, search local examples or validated snippets first; do not write from memory when a close template exists.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/by-date/2026-03/COR-2026-03-11-001.md`; `knowledge/archive/migration-unpacked/agent-core/lammps-workflow/AGENTS.md`
- note: This is especially important for strain formulas, reactive force fields, and multi-element workflows.

## [CL-009] Deposit region bounds must be recalculated when migrating deposition cases
- status: confirmed
- category: input
- lesson: When reusing a deposition case (e.g. NiC spherical deposition), do not copy `deposit_re_lo` and `deposit_re_up` values directly. These depend on the `mobile` group's current `zmax` and `lattice units` setting, so they must be recalculated for each new model geometry during case migration.
- evidence: `knowledge/cases/raw/NiC/球形沉积/in.NiC.reaxff` (lines 39-41: `variable deposit_re_lo equal 5.2 #bound(mobile,zmax)/3.61`); knowledge/cases/raw/NiC/球形沉积/in.NiC.reaxff
- note: Add this check to a future deposition section of `knowledge/templates/input-self-check.md`.

## [CL-010] ReaxFF pair_coeff element names must correctly map to data file atom types and ffield entries
- status: confirmed
- category: review
- lesson: For `pair_style reax/c` and `pair_style reaxff`, the element name list on the `pair_coeff` line must correctly name each atom type in atom-type order. Each name must exist in the ffield file and must correspond to the physical element that atom type actually represents in the data file. A mismatch will not cause a runtime error but will silently produce wrong physical results. At review, cross-reference the `pair_coeff` element list against the ffield element definitions and the data file atom types.
- evidence: `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/AlCuO/in.in` (correct ReaxFF example using ffield.reax); `knowledge/cases/raw/NiC/in.NiC.reaxff`
- note: This is independent of the charge handling check (CL-001). Both checks must pass for ReaxFF inputs.

## [CL-011] fix npt must not compete with fix deform in the same direction
- status: confirmed
- category: input
- lesson: When using fix deform to control strain in a given direction such as `x`, fix npt must only couple pressure in the non-deforming directions such as `y` and `z`. If fix npt also controls the deforming direction, the barostat and the strain controller will fight over the same box degree of freedom and produce incorrect results or instability.
- evidence: `knowledge/examples/tensile_al_small/in.tensile_small` (lines 36-37); `knowledge/manuals/lammps/fix_nh.md`; `knowledge/manuals/lammps/fix_deform.md`
- note: Add a coupling-direction check to the tensile section of `knowledge/templates/input-self-check.md`. Safe pattern: `fix npt` on non-deforming directions only, then `fix deform` on the deforming direction.

## [CL-012] Verify NPT equilibration stability before starting fix deform
- status: confirmed
- category: workflow
- lesson: After NPT equilibration and before switching to fix deform, run a short diagnostic thermo checkpoint that outputs `lx`, `ly`, `lz`, and pressure until the box dimensions and pressure have plateaued. This helps distinguish true equilibration problems from later strain-formula or boundary-condition mistakes.
- evidence: `.claude/lammps-kb-pipeline/raw/9ccc2c97-7ecb-4805-a9f6-85c94ae04cd0.json`; `.claude/lammps-kb-pipeline/reviews/9ccc2c97-7ecb-4805-a9f6-85c94ae04cd0-1775228390.json`
- note: Non-redundant with CL-007 (strain reference) and CL-011 (barostat/deform coupling). Use this as a debugging checkpoint for NPT-to-deform workflows.

## [CL-013] Fixed boundaries (boundary f) need a vacuum buffer or fixed substrate near the box face
- status: confirmed
- category: workflow
- lesson: When using `boundary f` (fixed, non-periodic) in any direction, atoms that move past the fixed box face during thermal motion are deleted on the next reneighboring step. This causes "Lost atoms" errors or silent atom loss. Prevent this by either (1) adding a small vacuum layer between the outermost mobile atoms and the fixed box face in that direction, or (2) fixing a thin substrate region near the contact boundary with `fix setforce 0 0 0` so it cannot accelerate toward the wall. Do not place mobile atoms directly adjacent to a fixed boundary face. The `thermo_modify lost` option can make the loss visible but does not prevent it.
- evidence: https://docs.lammps.org/boundary.html; .claude/lammps-kb-pipeline/raw/827d1e12-1a5d-4351-bd0a-1ac7da5f0404.json
- note: Apply when: Any LAMMPS model using non-periodic fixed boundaries (boundary f). Apply during WF-01 setup review and WF-03 pre-run checks.

## [CL-014] Any complex loading scenario must equilibrate fully before applying deformation or boundary constraints
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: For ANY simulation that involves external loading — tensile, compressive, shear, nanoindentation, scratching, cutting, shock, or any deformation protocol — the structure MUST be fully equilibrated BEFORE any load, constraint, or boundary layer is applied. This is a universal workflow rule, not limited to HEA or specific material systems. The correct protocol is: (1) build structure with full periodic BC (p p p), all atoms free; (2) energy minimization (minimize or cg); (3) NPT relaxation at target temperature with sufficient duration (≥50 ps for ~100k atoms, scale with system size); (4) verify T, P, and energy have all converged; (5) ONLY THEN apply fixed boundary layers, rigid substrates, thermostat regions, or Newtonian layers; (6) brief NVT re-equilibration with constraints active; (7) finally start the loading stage. Skipping equilibration before loading causes: artificial internal stress locked into the structure, inability to reach target temperature, catastrophic atom loss during loading, and physically meaningless stress-strain responses. This rule applies regardless of material system (pure metal, alloy, HEA, ceramic, composite), loading type (mechanical, thermal, radiation), or boundary condition strategy.
- evidence: `work/cases/hea-nanoscratch/in.equil.lmp` (incorrect: boundary set before minimization); `work/cases/hea-nanoscratch/log.scratch_05.lammps` (consequence: 19k atoms lost, T spike to 21508K, stable T only 142K vs target 300K); `knowledge/archive/migration-unpacked/agent-core/lammps-workflow/projects/.legacy/Al_compress/scripts/in.compress.lmp` (correct: minimize + NPT 50ps → then fix deform)
- note: Apply when: WF-03A input review for ANY deformation, loading, indentation, scratching, cutting, shock, or shear simulation; WF-02 ensemble selection; WF-01 setup review for non-periodic or constrained models.

## [CL-015] Restart files carry fix/group state that silently breaks multi-stage workflows — prefer data file handoff
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: LAMMPS restart files carry active fix definitions, group assignments, and integration state. When a subsequent script reads a restart and re-declares fixes with the same IDs but different groups, only SOME fixes show "Resetting" warnings while others silently persist on the OLD group from the restart. This causes: (1) atoms that should be integrated with NVE/NVT receiving NO integration (frozen) or DOUBLE integration (energy drift); (2) pressing phases appearing "stable" because substrate atoms are effectively frozen by stale restart fix state; (3) scratch phases failing catastrophically because the incorrect dynamics accumulate over time. The correct approach for multi-stage workflows is: write_data (not write_restart) at each stage boundary, then read_data in the next stage. Data files do NOT carry fix state, group definitions, or integration history — all potentials, groups, and fixes must be declared fresh, eliminating state conflicts. This applies to ANY multi-stage LAMMPS workflow: equilibration → deformation, equilibration → nanoindentation, equilibration → scratching, relaxation → loading, etc.
- evidence: `work/cases/hea-nanoscratch/in.scratch_v2_05.lmp` (reads restart.equil_v2, double integration confirmed in log); `work/cases/hea-nanoscratch/in.scratch_v3_05.lmp` (reads equil_v3.data, all state declared fresh — correct approach); `work/cases/hea-nanoscratch/in.equil_v3A.lmp` + `in.equil_v3BC.lmp` (correct multi-stage data file handoff)
- note: Apply when: WF-03A any multi-stage LAMMPS workflow with stage boundaries; WF-02 input review when restart files are used as stage handoff.

## [CL-016] Trajectory atoms at z=box_max with periodic z-boundary are periodic wrapping, NOT explosion
- status: confirmed
- category: analysis
- severity: HIGH
- lesson: When analyzing LAMMPS dump trajectories with periodic boundaries (e.g. `boundary f f p`), atoms near z=0 will appear at z=box_zmax due to periodic wrapping. This is NOT atoms flying to the top of the box or model explosion. Before diagnosing "model explosion", "substrate disintegration", or "atoms escaping", ALWAYS check the boundary conditions first. With `boundary f f p`, z is periodic: atoms at z=0 and z=zmax are the SAME atoms through the periodic boundary. The correct way to analyze is to use unwrapped coordinates (xu,yu,zu) in dump, or to account for periodicity in analysis. Failing to recognize periodic wrapping leads to false explosion diagnoses and wasted debugging time.
- evidence: `work/cases/hea-nanoscratch/analyze_scratch05.py` (misdiagnosed sub_z_max=180 as substrate explosion); actual cause was periodic z-boundary wrapping of atoms near z=0; user correction (2026-04-10)
- note: Apply when: WF-04 trajectory analysis for any model with mixed periodic/non-periodic boundaries; dump file interpretation.

## [CL-xxx] Paper reproduction must be based on full text — guessing parameters is prohibited
- status: confirmed
- category: reproduction
- lesson: Paper reproduction tasks MUST obtain and read the full text PDF BEFORE any simulation input is built. All TTM coefficients, model geometry, potential choice, pulse parameters, grid resolution, observation windows, and measurement methods must come from the paper, not from reconstructed guesses based on abstracts and figure captions. The PRB 92 174104 double-pulse Al case demonstrated catastrophic failure from parameter guessing: wrong potential (Zhou vs Zhakhovskii), 10x intensity overestimate (incident vs absorbed fluence), 250x model undersizing (16 nm vs 4000 nm slab), and wrong physics engine (fix ttm/mod Beer's law vs paper's Helmholtz wave equation). Result: complete model explosion (T_lattice 270,000 K, T_electron 1,500,000 K) and zero physical reproduction.
- evidence: work/cases/paper-reproduction/prb92-174104-double-pulse-al/povarnitsyn2015.pdf; work/cases/paper-reproduction/prb92-174104-double-pulse-al/README.md; work/cases/paper-reproduction/prb92-174104-double-pulse-al/outputs/delay000ps.log
- note: This is a hard rule. No paper reproduction workflow may proceed past WF-01 without the full paper text available and key parameters extracted. If the full text cannot be obtained, the case must be flagged as BLOCKED, not approximated.

## [CL-017] Never write LAMMPS commands from memory — always consult the manual first
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: When writing ANY LAMMPS command that you are not 100% certain of the exact syntax, you MUST consult the official LAMMPS documentation (https://docs.lammps.org/) before writing it. Guessing command syntax from memory or partial recall produces wrong scripts that waste user time with trial-and-error debugging. This applies especially to commands used infrequently (rerun, read_dump, dump_modify, fix proposals, etc.). The correct workflow is: (1) identify the command; (2) fetch and read the official doc page; (3) cross-check examples; (4) only then write the command. Specific教训 — rerun command syntax: `rerun` uses keyword-value pairs (NOT positional args). Correct syntax is `rerun file [first N] [last N] [every N] dump x y z`. The `dump` keyword is required and must be the LAST keyword. Its arguments are passed to `read_dump`, whose valid fields are only: x, y, z, vx, vy, vz, q, mol, ix, iy, iz, fx, fy, fz. `type` is NOT a valid read_dump field — atom types come from `read_data` and do not change during simulation. Official examples: `rerun dump.file dump x y z vx vy vz`, `rerun dump1.txt first 10000 every 1000 dump x y z`.
- evidence: User correction (2026-04-15); https://docs.lammps.org/rerun.html; https://docs.lammps.org/read_dump.html
- note: Apply when: ANY LAMMPS command writing, especially for commands outside the top-20 most-used (run, fix, group, pair_style, compute, dump, variable, thermostat/barostat fixes, minimize, read_data, velocity, region). For less common commands (rerun, read_dump, fix shake, fix qeq, kspace_modify, neigh_modify, dump_modify, etc.), manual consultation is mandatory before writing.

## [CL-018] Goal-feature mismatch: simulation missing critical physical features
- status: confirmed
- category: workflow
- severity: CRITICAL
- lesson: When a user requests a simulation like "dislocation cutting precipitate", the simulation MUST contain both a dislocation AND a precipitate in the atomic model. The current D2 objective is free-form text with no structured feature checklist. Reviewer MB-001~007 only check command syntax, not goal consistency. Input Writer is not required to verify that output contains target features. The fix requires: (1) D2.1 structured feature extraction in WF-00; (2) MB-008 goal-model consistency check at WF-01 gate; (3) validate-goal-features.js mechanical verification script. A simulation missing its core research object is WORSE than a total failure because it "looks successful".
- evidence: Production case — user requested dislocation-precipitate interaction, agent completed full workflow without dislocation in model, did not detect the omission.
- note: Most critical workflow gap discovered to date. Apply at every WF-01 reviewer gate. Reinforcement: All WF-01 reviews MUST execute MB-008 against D2.1 feature list.

## [CL-019] Runtime structural degradation undetected
- status: confirmed
- category: runtime
- severity: HIGH
- lesson: Simulations can exit code 0 with normal thermo but have corrupted atomic structure: surface atom ejection (grinding), local voids (relaxation), coordination anomalies, energy outliers. Current WF-04 only analyzes global thermo, never per-atom diagnostics. Fix requires: (1) WF-03A must embed diagnostic computes (pe/atom, coord/atom, centro/atom, cna/atom) in input scripts; (2) WF-04 must run structural health check BEFORE macroscopic metric extraction; (3) D7 must include structural integrity criteria (lost_atoms_max, energy_outlier_max_fraction, bulk_coordination_defect_max); (4) structural-health-ovito.py provides the per-atom analysis.
- evidence: Grinding surface atom ejection case; local void appearance after relaxation case. Both had exit code 0 and normal thermo.
- note: Complementary to CL-018. CL-018 catches "wrong thing built", CL-019 catches "built thing degraded". Apply at every WF-04 analysis step. Reinforcement: WF-04 MUST complete structural health check (Step 0) before any macroscopic metric extraction.
