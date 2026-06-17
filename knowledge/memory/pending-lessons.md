# Pending Lessons

## [PL-001] NiC deposition instability may be strongly linked to ghost cutoff setup
- status: pending
- category: analysis
- lesson: In local NiC deposition cases, ghost-atom cutoff warnings may be a major precursor to atom loss or unstable reactive dynamics.
- evidence: `knowledge/rules/failure-patterns.md`; `knowledge/cases/raw/NiC/球形沉积/log.lammps`; `knowledge/cases/raw/NiC/in.NiC.reaxff`
- note: Promote only after checking more than one unstable NiC run or user confirmation.

## [PL-002] Large log analysis may need chunked reading instead of direct full-agent analysis
- status: pending
- category: analysis
- lesson: Very large `log.lammps` files may require narrower prompts or chunked inspection because full-agent analysis can time out.
- evidence: `knowledge/reports/lammps-agent-test-report.md`
- note: Promote after repeated observation or after adding a standard chunking method.

## [PL-003] HEA melt-solidify typo: ${T_molid_low} vs ${T_melt_low}
- status: pending
- category: input
- lesson: In generated HEA melt-solidify input scripts, verify variable names for temperature parameters—`${T_molid_low}` is a typo and should be `${T_melt_low}`.
- evidence: prior testing observation (single occurrence)
- note: Promote only after confirming this is a systematic generation pattern or after user verification.

## [PL-004] HEA systems may need standalone relaxation before formal production simulation
- status: pending
- category: workflow
- lesson: For some HEA workflows, the structure may need a separate stabilization or relaxation stage before the formal simulation stage begins.
- evidence: `knowledge/corrections/playbooks/error-memory-playbook.md`
- note: Promote only after matching more local HEA examples or user confirmation.

## [PL-005] MEAM pair_coeff mapping errors are a frequent source of false data-file edits
- status: pending
- category: potential
- lesson: In MEAM workflows, users or agents may incorrectly edit the data file atom-type count when the real problem is misunderstanding the two halves of `pair_coeff` element mapping.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/2026-03-28_meam_pair_coeff_mapping.md`
- note: Promote after one more independent local source or repeated observation.

## [PL-006] Atomsk transformed outputs may silently reorder type-element mapping
- status: pending
- category: input
- lesson: After orthogonalization or rotation with Atomsk, the resulting LAMMPS file may reorder type IDs, so the type-element mapping should be rechecked before reuse.
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/review-logs/08_cif_files_review.md`
- note: Promote after confirming the same pattern in more than one transformed structure workflow.

## [PL-007] In some hybrid workflows, `delete_atoms overlap` should wait until pair coefficients are fully initialized
- status: pending
- category: input
- lesson: For certain hybrid or force-dependent setups, `delete_atoms overlap` may need to be placed after all `pair_coeff` commands are defined instead of immediately after `pair_style`.
- evidence: `knowledge/source/mining/session-mining-summary.md`
- note: Promote only after confirming this rule against LAMMPS documentation or multiple independent local cases.

## [PL-008] fix print must not use ${} for runtime-evaluated variables
- status: pending
- category: input
- lesson: In LAMMPS fix print strings, bare v_varname produces literal text NOT variable values. The ONLY correct syntax is $(v_varname) with dollar-parentheses. Using bare v_varname or ${varname} both cause silent wrong output. This is high-severity because output files still contain valid-looking numbers making it easy to miss.
- evidence: `work/cases/cu-compress-demo/in.cu_compress.lmp` line 65 (bug found during review); `knowledge/manuals/lammps/variable.md` lines 157-165 (immediate variable substitution); `knowledge/manuals/lammps/fix_print.md` (fix print string evaluation rules); `work/cases/cu-tensile-3000/in.cu_tensile.lmp` line 39 (correct reference pattern using `$(v_strain)`)
- note: Promote to confirmed after observing the same pattern in one more independent case or after user confirmation. This is a high-severity silent-output bug that is easy to miss because the output file still has valid-looking numbers.

## [PL-009] TTM-MOD C_e coefficient must go in a_1 not a_0 for Drude model
- status: pending
- category: potential
- lesson: In LAMMPS fix ttm/mod, the C_e polynomial is C_e = C_0 + (a_0 + a_1*X + ...) * exp(-(A*X)^2) where X=Te/1000. For metals where C_e = gamma*Te (Drude model), the coefficient must be placed in a_1 (NOT a_0) because a_0 contributes a CONSTANT term independent of Te. Placing gamma*1000 in a_0 causes C_e to be constant, making Te overshoot by ~50x. The Au gamma coefficient (7.56e-9 eV/(K^2*electron)) must be multiplied by 1000 and placed as a_1 = 7.56e-6.
- evidence: LAMMPS Si.ttm_mod example in Examples/ttm/; `work/cases/paper-reproduction/laser/ttm_params_gpu.txt` (wrong); `work/cases/paper-reproduction/laser/ttm_params_corrected.txt` (fixed); LAMMPS fix ttm/mod manual section on C_e formula
- note: High severity — single line swap fixes Te from ~1M K to ~20K K. Promote after confirming with user or one more Au TTM simulation.

## [PL-010] fix ttm/mod f_2 outputs are energies not temperatures
- status: pending
- category: analysis
- lesson: LAMMPS fix ttm/mod output vector: f_2[1] = total electronic subsystem ENERGY (extensive, eV in metal units), f_2[2] = energy transferred from electrons to atoms on this timestep (eV). These are NOT electron temperatures. To get actual Te, read Te_out grid files which contain per-cell temperatures in temperature units.
- evidence: `knowledge/manuals/lammps/fix_ttm.md` lines 432-444; `work/cases/paper-reproduction/laser/log.lammps` f_2[1] values in millions (eV not K)
- note: Promote after confirming the documentation interpretation is consistent across multiple TTM runs.

## [PL-012] PROMOTED to CL-016 (2026-04-10)
- status: promoted
- category: analysis
- note: Promoted to CL-016 in confirmed-lessons.md. Periodic wrapping misdiagnosis corrected by user.

## [PL-011] PROMOTED to CL-014 (2026-04-10)
- status: promoted
- category: workflow
- note: Promoted and strengthened as CL-014 in confirmed-lessons.md. Scope broadened from HEA-specific to all complex loading scenarios per user directive.
- status: pending
- category: analysis
- lesson: LAMMPS fix ttm/mod output vector: f_2[1] = total electronic subsystem ENERGY (extensive, eV in metal units), f_2[2] = energy transferred from electrons to atoms on this timestep (eV). These are NOT electron temperatures. To get actual Te, read Te_out grid files which contain per-cell temperatures in temperature units.
- evidence: `knowledge/manuals/lammps/fix_ttm.md` lines 432-444; `work/cases/paper-reproduction/laser/log.lammps` f_2[1] values in millions (eV not K)
- note: Promote after confirming the documentation interpretation is consistent across multiple TTM runs.
## [PL-014] compute stress/atom outputs bar·Å³ — must divide by Voronoi atomic volume and convert to GPa
- status: pending
- category: input
- severity: HIGH
- lesson: `compute stress/atom` in LAMMPS metal units outputs **bar·Å³** (pressure × volume), NOT GPa. The raw values are NOT meaningful stress. The correct conversion uses **Voronoi per-atom volume** (NOT the uniform approximation V_box/N_atoms): **σ(GPa) = σ_raw(bar·Å³) / V_voronoi(Å³) × 1e-4**. Implementation in LAMMPS: `compute voro all voronoi/atom` then `variable v_sxx atom (c_satom[1]/c_voro[1])*1.0e-4`. The Voronoi approach is mandatory because it captures local volume variations at interfaces, surfaces, and near particles/defects where V_box/N_atoms is inaccurate.
- evidence: `work/cases/nbb2-creep-twinning/round5/rerun-a1.in` (fixed); `work/cases/nbb2-creep-twinning/round5/rerun-b1.in` (fixed); LAMMPS manual compute stress/atom (output units = pressure*volume); LAMMPS manual compute voronoi/atom (c_voro[1] = Voronoi cell volume in distance_units³)
- note: High severity — raw stress/atom values look like plausible numbers but are off by orders of magnitude. Voronoi volume is the ONLY acceptable method for atomic volume in per-atom stress conversion. Promote after user confirmation or one more independent case.
- apply_when: Any rerun script or input script using `compute stress/atom`; any post-processing that reads per-atom stress from LAMMPS dumps; WF-04 analysis stage

## [PL-013] LAMMPS region command defaults to lattice units — must add "units box" for Angstrom coordinates
- status: pending
- category: input
- severity: HIGH
- lesson: When using the `region` command in LAMMPS to define geometric shapes (sphere, cylinder, block, etc.), coordinates and dimensions are interpreted in LATTICE units by default. If you compute coordinates in Angstroms (e.g., `variable cx equal 14*3.524`) and pass them to `region sphere ${cx} ${cy} ${cz} ${pr}`, the values will be multiplied by the lattice constant, placing the region far outside the simulation box. The result is a silent failure: zero atoms in the group, no error, and the simulation runs without the intended geometry. The fix is to add `units box` to the region command: `region particle sphere ${cx} ${cy} ${cz} ${pr} units box`.
- evidence: work/cases/nbb2-creep-twinning/model-b/in.model-b.lmp (first version without `units box` produced Particle atoms: 0); LAMMPS manual region command documentation
- note: This is a particularly dangerous bug because LAMMPS does not produce an error or warning when a region has zero atoms. The group is simply empty. Reviewers should check the atom count output for any region-based group definition. This should be added to the input-self-check template.
- apply_when: WF-03A input review for any model using region commands with computed Angstrom coordinates; WF-01 setup review for inclusion, precipitate, or interface models
