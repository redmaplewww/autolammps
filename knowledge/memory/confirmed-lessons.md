## [CL-001] ReaxFF review must reject missing charge handling
- status: confirmed
- category: review
- lesson: For local ReaxFF workflows, missing charge-capable atom style or missing `fix qeq/reax` is a blocker and should be rejected at review. Omitting `atom_style charge` (or `full`) or `fix qeq/reax` in a ReaxFF input is a misconfiguration, not an optional optimization — ReaxFF requires dynamic charge equilibration and cannot produce physically meaningful results without it.
- evidence: `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/NiC/in.NiC.reaxff`; `knowledge/cases/raw/GaN氧化/in.GaN.reaxff`; knowledge/memory/confirmed-lessons.md; knowledge/rules/potential-selection.md; https://docs.lammps.org/fix_qeq.html; https://docs.lammps.org/fix_qeq_reaxff.html
- note: Re-check exact pair style syntax for the chosen example family. Reinforcement d327bc68: Enhancement to CL-001: adds fix qeq/shielded as the modern replacement for fix qeq/reaxff, and documents the silent zero-charge failure mode. NOTE: the original candidate incorrectly named "fix qeq/shuffled" which does not exist in LAMMPS; the correct command is fix qeq/shielded. Reinforcement d327bc68 (corrected): Acceptable charge equilibration fixes for ReaxFF include fix qeq/reaxff and fix qeq/shielded (the documented replacement, which yields identical results and will eventually supersede fix qeq/reaxff). Without either, the simulation runs on default zero charges, computing bond orders and reaction events that are physically wrong, with no runtime error. This applies to all ReaxFF material systems, not only Ni/C. Note: fix qeq/point, qeq/dynamic, and qeq/fire are also valid QEq solvers but use a point-charge model rather than the shielded-Coulomb model that ReaxFF requires; for ReaxFF, prefer qeq/reaxff or qeq/shielded. All ReaxFF workflows regardless of material system; applies to WF-02 input review and WF-03 runtime checks

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
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/2026-03-25_fixed_atoms_no_velocity.md`; `knowledge/corrections/playbooks/lammps-failure-playbook.md`; knowledge/corrections/playbooks/lammps-failure-playbook.md; .claude/lammps-kb-pipeline/raw/60052987-f9ef-429e-b067-6aa5ba288608.json; knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/2026-03-25_fixed_atoms_no_velocity.md
- note: This should be part of both script review and runtime sanity checks. Reinforcement 60052987: Real-world confirmation that applying velocity to fixed atoms is a nondeterministic bug: it can pass visual inspection on some seeds but cause catastrophic model explosion when it fails. Reinforces CL-003's severity from a correctness rule to a safety-critical rule. Applying velocity to fixed atoms is nondeterministic -- it can appear harmless with some seeds or configurations, making it a deceptive bug that passes visual inspection. When it does fail, the failure mode is catastrophic model explosion, not a recoverable warning. This makes CL-003 both a correctness rule and a safety-critical rule. Any script review flagging `velocity all` without excluding the fixed group should be treated as high severity even if the script appeared to work in prior runs. All LAMMPS scripts containing fixed, frozen, or boundary-constrained atoms; applies to WF-01 input review and WF-03 runtime checks. Any velocity create or velocity set command must be audited for group scope. Reinforcement 60052987: 对固定区原子施加 velocity 赋初速度具有非确定性——偶尔看似无害，一旦失败则为灾难性模型爆炸。此经验增强 CL-003，将其从正确性规则提升为安全关键规则。 Applying velocity to fixed atoms is nondeterministic — it can appear harmless with some seeds or configurations, making it a deceptive bug that passes visual inspection. When it does fail, the failure mode is catastrophic model explosion, not a recoverable warning. This makes CL-003 both a correctness rule and a safety-critical rule. Script review: any velocity all or velocity applied to a group that is not explicitly limited to mobile atoms. Runtime sanity: unexpected explosion after initial equilibration. All models with fixed, frozen, or boundary-constrained atom groups.

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
- evidence: `knowledge/archive/migration-unpacked/knowledge/knowledge/corrections/by-date/2026-03/COR-2026-03-11-001.md`; `knowledge/examples/tensile_al_small/in.tensile_small`; `.claude/lammps-kb-pipeline/raw/58f0ab83-627c-4cae-84ca-cc66c6c74407.json`; .claude/lammps-kb-pipeline/raw/58f0ab83-627c-4cae-84ca-cc66c6c74407.json; knowledge/memory/confirmed-lessons.md; .claude/lammps-kb-pipeline/raw/df95e93b-e8d1-43f6-b8cc-6e5c7158a8dc.json
- note: Reuse validated stress-strain snippets before writing a fresh formula. The example `in.tensile_small` uses `variable L0 equal lx` (equal-style, not frozen) but avoids the bug by computing strain from time rather than lx/L0; do not copy that variable as a strain-reference template. Reinforcement 58f0ab83: the reference box length must be frozen exactly at the NPT-to-fix-deform transition point; capturing it too early or too late gives a wrong strain baseline. Reinforcement df95e93b: The freeze-reference-length rule extends to output commands. In fix print and thermo_style custom output, verify that every variable reference points to the frozen L0 (or a derived variable built from it), not to a bare lx-tracking equal-style variable or an intermediate that was never frozen. A common mistake is computing strain correctly but printing an intermediate variable that still follows lx, producing output that shows zero or wrong strain even though the simulation is correct.

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
- note: Add this check to a future deposition section of `knowledge/templates/input-self-check.md`. Reinforcement 70f128f1: When migrating a deposition case, after recalculating deposit region bounds (CL-009), also verify that the mobile group region still covers the actual growing surface layer. The mobile_lo variable typically uses a hardcoded offset below model_hi (e.g. model_hi - 2 lattice units), and this offset assumes a specific surface depth. If the substrate geometry, lattice constant, or surface layer thickness changes, the offset may need adjustment -- otherwise atoms at the growing surface may fall outside the mobile group and receive no thermostatting. Case-migration checklist for deposition (extends CL-009): Reinforcement 70f128f1: When migrating a NiC spherical deposition case, after recalculating deposit region bounds, also verify the mobile group region definition still covers the true growing surface. The mobile_lo = model_hi - 2 offset is a physical assumption about surface depth that may not hold for different lattice constants, elements, or surface structures. Case-migration checklist for deposition (extends CL-009):
(1) Recalculate deposit_re_lo/deposit_re_up from the new bound(mobile,zmax) [CL-009].
(2) Independently verify that the mobile group region definition still covers the true growing surface. In the NiC spherical deposition template, mobile_lo = model_hi - 2 (lattice units), meaning the top 2 lattice layers of the substrate plus everything above are mobile. Although this variable updates automatically when model_hi changes, the hardcoded offset of 2 is a physical assumption about surface depth. If the new model has a different lattice constant, element, or surface structure, verify the offset still places mobile_lo close enough to the substrate top to include all surface atoms that should be thermostatted. A mobile region that starts too high will leave surface atoms frozen; one that starts too low will thermostat bulk atoms unnecessarily. Any LAMMPS deposition workflow where a mobile group is defined by a region relative to a substrate height variable, and the case is being reused or migrated to a different geometry or material system.
(1) Recalculate deposit_re_lo/deposit_re_up from the new bound(mobile,zmax) [CL-009].
(2) Independently verify that the mobile group region definition still covers the true growing surface. In the NiC spherical deposition template, mobile_lo = model_hi - 2 (lattice units), meaning the top 2 lattice layers of the substrate plus everything above are mobile. Although this variable updates automatically when model_hi changes, the hardcoded offset of 2 is a physical assumption about surface depth. If the new model has a different lattice constant, element, or surface structure, verify the offset still places mobile_lo close enough to the substrate top to include all surface atoms that should be thermostatted. A mobile region that starts too high will leave surface atoms frozen; one that starts too low will thermostat bulk atoms unnecessarily. Any LAMMPS deposition workflow that defines a mobile group via a region relative to model_hi or substrate height, especially when migrating deposition cases between different geometries or material systems.

## [CL-010] ReaxFF pair_coeff element names must correctly map to data file atom types and ffield entries
- status: confirmed
- category: review
- lesson: For `pair_style reax/c` and `pair_style reaxff`, the element name list on the `pair_coeff` line must correctly name each atom type in atom-type order. Each name must exist in the ffield file and must correspond to the physical element that atom type actually represents in the data file. A mismatch will not cause a runtime error but will silently produce wrong physical results. At review, cross-reference the `pair_coeff` element list against the ffield element definitions and the data file atom types.
- evidence: `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/AlCuO/in.in` (correct ReaxFF example using ffield.reax); `knowledge/cases/raw/NiC/in.NiC.reaxff`; knowledge/rules/potential-selection.md; knowledge/cases/raw/NiC/in.NiC.reaxff; .claude/lammps-kb-pipeline/raw/e2c59834-1111-4b17-a672-41390e932baa.json
- note: This is independent of the charge handling check (CL-001). Both checks must pass for ReaxFF inputs. Reinforcement e2c59834: Common failure mode — when migrating ReaxFF cases, do not copy pair_coeff element order from a source case without verifying against the current data file's Masses section, which is the authoritative source for which atom type number maps to which element.

## [CL-011] fix npt must not compete with fix deform in the same direction
- status: confirmed
- category: input
- lesson: When using fix deform to control strain in a given direction such as `x`, fix npt must only couple pressure in the non-deforming directions such as `y` and `z`. If fix npt also controls the deforming direction, the barostat and the strain controller will fight over the same box degree of freedom and produce incorrect results or instability.
- evidence: `knowledge/examples/tensile_al_small/in.tensile_small` (lines 36-37); `knowledge/manuals/lammps/fix_nh.md`; `knowledge/manuals/lammps/fix_deform.md`; .claude/lammps-kb-pipeline/raw/21abb37c-2965-4df0-b22e-8054375d4676.json; knowledge/examples/tensile_al_small/in.tensile_small; knowledge/archive/migration-unpacked/knowledge/knowledge/correct-examples/004-tensile-test.md
- note: Add a coupling-direction check to the tensile section of `knowledge/templates/input-self-check.md`. Safe pattern: `fix npt` on non-deforming directions only, then `fix deform` on the deforming direction. Reinforcement 21abb37c: When NPT is coupled to the tensile direction, the barostat continuously rescales the box toward the target pressure, relaxing the axial stress and suppressing transverse necking. This prevents the local stress concentration required for crack initiation and fracture, so the material appears to never break. For fracture studies and complete stress-strain curves including post-yield and failure, use NVT + fix deform instead. If NPT is retained for lateral pressure control, it may only couple to non-deforming directions, and the results should be interpreted as elastic-regime or lateral-pressure-controlled approximations, not as free-fracture conditions. This is the physical reason behind the coupling-direction rule. Applies to WF-03A metal tensile ensemble selection, WF-01 input review for tensile scripts, and self-check for tensile/strain sections. Any metal tensile simulation where fracture, necking, or complete stress-strain curves through failure are expected. Reinforcement 21abb37c: NPT barostat continuously rescales box toward target pressure, relaxing axial stress and suppressing necking, preventing local stress concentration needed for fracture. Use NVT + fix deform for full fracture curves. If NPT is used, only couple non-tensile directions, and treat results as elastic-regime or lateral-pressure approximation, not free-fracture conditions. Appended to CL-011: barostat suppresses necking → prevents stress concentration → no fracture. Recommended ensemble: NVT + fix deform for fracture studies. NPT on non-tensile directions only; treat as elastic-regime approximation. WF-03A metal tensile simulations; ensemble selection for fracture and stress-strain curves; applies when building tensile input scripts that need to produce fracture or complete stress-strain curves

## [CL-012] Verify NPT equilibration stability before starting fix deform
- status: confirmed
- category: workflow
- lesson: After NPT equilibration and before switching to fix deform, run a short diagnostic thermo checkpoint that outputs `lx`, `ly`, `lz`, and pressure until the box dimensions and pressure have plateaued. This helps distinguish true equilibration problems from later strain-formula or boundary-condition mistakes.
- evidence: `.claude/lammps-kb-pipeline/raw/9ccc2c97-7ecb-4805-a9f6-85c94ae04cd0.json`; `.claude/lammps-kb-pipeline/reviews/9ccc2c97-7ecb-4805-a9f6-85c94ae04cd0-1775228390.json`
- note: Non-redundant with CL-007 (strain reference) and CL-011 (barostat/deform coupling). Use this as a debugging checkpoint for NPT-to-deform workflows.

## [2a43876a] Grain-boundary tension depends on lateral constraints
- type: experience
- stage: unknown
- material: unknown
- potential: unknown
- summary: Lateral boundary conditions in metal grain-boundary tension can change the dominant failure mechanism.
- lesson: For metal bicrystal or grain-boundary tensile simulations, lateral boundary conditions must be treated as a primary physical variable. Free transverse conditions can favor partial-dislocation emission and propagation, while constrained transverse conditions can suppress dislocation activity and promote brittle grain-boundary opening. Record and compare the boundary condition explicitly before interpreting strength or failure trends.
- apply_when: WF-03A metal bicrystal and nanocrystalline tensile simulations
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: High-reuse deformation lesson with direct LAMMPS workflow implications; should live in confirmed lessons.

## [71471d65] Surface machining needs morphology plus defect analysis
- type: experience
- stage: WF-04
- material: unknown
- potential: unknown
- summary: Do not analyze metal nanoscratch or indentation by morphology alone.
- lesson: In metal nanoscratch, nanoindentation, and related surface-processing MD, morphology outputs such as groove depth, pile-up, and chip formation are not sufficient on their own. They must be paired with structural analysis such as CNA or PTM, DXA, and stacking-fault or twin tracking so the surface outcome can be tied back to the active subsurface mechanism.
- apply_when: WF-04 analysis for scratching, indentation, cutting, and wear simulations
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable analysis lesson for metal surface-processing workflows.

## [6f720bec] Nanocrystalline metals need grain-size scans
- type: experience
- stage: unknown
- material: magnesium
- potential: unknown
- summary: Grain size is a primary control variable in nanocrystalline metal deformation studies.
- lesson: For nanocrystalline metal MD, grain size must be treated as a first-class sweep variable, not a background detail. Mechanisms can switch from dislocation-dominated plasticity to grain-boundary-mediated sliding or rotation near a critical grain size, so temperature and strain-rate comparisons are incomplete unless the grain-size regime is also stated.
- apply_when: WF-01 and WF-03A nanocrystalline metal model setup and deformation studies
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Compact reusable lesson from the Mg nanocrystalline literature and broadly useful for metal MD planning.

## [f77fcec8] AM metals need explicit crystal-form comparisons
- type: experience
- stage: unknown
- material: unknown
- potential: unknown
- summary: AM metal tensile models should compare single-crystal, equiaxed, and columnar forms instead of defaulting to one surrogate microstructure.
- lesson: For additive-manufactured or selective-laser-melted metals, do not replace the real microstructure with a single generic polycrystal. Single-crystal, equiaxed-grain, and columnar-grain models can produce different strength, modulus, and deformation mechanisms, and columnar-grain loading direction can be decisive. Treat crystal form and grain orientation as explicit modeling variables.
- apply_when: WF-01 and WF-03A AM and SLM metal tensile workflows
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable modeling lesson for AM and SLM metal workflows.

## [23a83d36] Metal grain-boundary studies need boundary taxonomy not just Sigma
- status: confirmed
- category: workflow
- lesson: For metal grain-boundary simulations, do not classify a boundary only by Sigma. Grain-boundary angle class, symmetry, inclination, and faceting state can materially change migration, dislocation emission, decohesion, and shear response, so these descriptors must be recorded before comparing results across cases.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: High-reuse grain-boundary planning lesson distilled from the second-wave GB literature. Apply when: WF-01 and WF-03A bicrystal, nanocrystalline, and grain-boundary mobility workflows

## [92ed0cdc] GB chemistry can dominate metal boundary fracture
- status: confirmed
- category: workflow
- lesson: For metal grain-boundary fracture and embrittlement MD, do not assume the clean-boundary mechanism remains valid once hydrogen, helium bubbles, or segregating solutes are present. Grain-boundary chemistry can change the governing response to decohesion, amorphization, or ductile-to-brittle transition, so chemistry and defect population must be treated as first-class variables.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Strong reusable lesson from Ni grain-boundary embrittlement literature. Apply when: WF-03A grain-boundary fracture, embrittlement, and irradiation-damage studies

## [1696b67c] Metal nanolaminate studies must track interface character explicitly
- status: confirmed
- category: workflow
- lesson: For metal nanolaminate and layered-composite MD, do not reduce the design space to layer thickness only. Interface character, coherency, morphology stability, and the ability of dislocations or twins to transmit across the interface all materially affect strength, ductility, shock response, and thermal stability, and must be recorded as explicit comparison variables.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable interface-design lesson from Cu-Nb, Ag-Cu, and coherent nanolamellar literature. Apply when: WF-01 and WF-03A layered-metal, nanolaminate, and interface-design workflows

## [26ae1fbb] Metal cutting workflows need residual stress and roughness outputs
- status: confirmed
- category: workflow
- lesson: For metal cutting, microcutting, and diamond-cutting simulations, do not stop at force or chip formation. Residual stress, surface roughness, and subsurface defect distributions should be collected as standard outputs so processability can be tied to final surface integrity rather than only to instantaneous cutting response.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable analysis lesson from the expanded metal cutting literature. Apply when: WF-04 analysis for cutting, microcutting, and machining simulations

## [072b18f3] BCC refractory metals need their own deformation logic
- status: confirmed
- category: workflow
- lesson: For BCC refractory metals and refractory multi-principal alloys, avoid interpreting yielding and plasticity with FCC-default assumptions. Temperature-dependent yielding, defect mobility, and deformation mechanisms can differ enough that W, Ta, Mo, and related systems need a separate mechanism baseline before comparing them with Cu, Al, or Ni.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable lesson from the refractory-metal literature expansion. Apply when: WF-01 and WF-03A refractory-metal tensile, shock, and defect studies

## [a96e9c55] Ti and NiTi models must treat interstitials and phase response explicitly
- status: confirmed
- category: workflow
- lesson: For Ti, NiTi, and related Ti-alloy simulations, do not assume the host lattice alone determines the response. Interstitial species such as oxygen, nanotwins, and phase-transformation-assisted mechanisms can materially change ductility, yielding, and recoverable deformation, so these variables must be stated before transferring conclusions from one Ti-family system to another.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Compact high-reuse lesson from Ti and NiTi literature. Apply when: WF-01 and WF-03A Ti, NiTi, and Ti-alloy tensile or functional-response workflows

## [84a82a28] Ni-based superalloy MD needs matrix precipitate and interface views
- status: confirmed
- category: workflow
- lesson: For Ni-based superalloy simulations, do not interpret the response from the matrix alone. Single-crystal orientation, gamma-prime precipitate behavior, and interface dislocation evolution can each dominate different parts of yielding and hardening, so they should be analyzed as separate but coupled layers in the workflow.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable planning lesson from Ni-based superalloy subcategory coverage. Apply when: WF-01 and WF-03A Ni-based superalloy tensile, precipitate, and interface workflows

## [1c1edd15] HEA evidence must be split by mechanism class not one flagship alloy
- status: confirmed
- category: workflow
- lesson: For HEA and multi-principal-alloy MD, do not treat one representative composition as evidence for the whole class. Stacking-fault behavior, twinning, plastic inception, temperature response, and solidification pathways vary enough across compositions that HEA knowledge should be grouped by mechanism class rather than only by alloy family name.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable HEA lesson from the expanded HEA mechanism literature. Apply when: WF-01 and WF-03A HEA deformation, temperature, and solidification workflows

## [019d518a] AM metal workflows should start from solidification path and interface formation
- status: confirmed
- category: workflow
- lesson: For additive-manufacturing and directional-solidification metal workflows, avoid starting the interpretation at the final tensile stage. Bonding path, particle-assisted solidification, columnar-growth conditions, and interface formation frequently set the later microstructure and mechanical response, so the workflow should preserve these front-end process variables explicitly.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable lesson from AM and directional-solidification literature. Apply when: WF-01 and WF-03A additive-manufacturing, directional-solidification, and dissimilar-metal bonding studies

## [3921533a] HCP metals need separate twinning dislocation and crack clusters
- status: confirmed
- category: workflow
- lesson: For HCP metal MD, do not summarize behavior with a single “HCP deformation” label. Twinning, non-basal dislocation motion, tension-compression asymmetry, and crack propagation can dominate different studies in Mg, Ti, and Zr, so transfer of conclusions should be constrained by mechanism class first and material name second.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable HCP-planning lesson from the new HCP paper cluster. Apply when: WF-01 and WF-03A HCP metal deformation and fracture workflows

## [3e565f79] Shock spall fatigue and creep need separate workflow families
- status: confirmed
- category: workflow
- lesson: For metal MD, shock, spall, fatigue, and creep should be managed as separate workflow families. Even for the same Cu, Ni, Al, Ta, or Mg system, the loading history, observables, and failure criteria differ enough that reuse of scripts and interpretation must be deliberate rather than assumed.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: High-reuse workflow lesson distilled from dynamic-fracture and time-dependent paper clusters. Apply when: WF-01 and WF-03A dynamic-fracture, cyclic-loading, and time-dependent studies

## [38cbd51d] Radiation and diffusion studies should follow a cascade to sink to transport chain
- status: confirmed
- category: workflow
- lesson: For irradiation, diffusion, and segregation problems in metals, organize evidence along the sequence of primary cascade damage, defect sink behavior at boundaries or interfaces, and long-range transport or trapping of helium, hydrogen, or vacancies. This chain makes it easier to connect Cu, Fe, W, Cu-Nb, and HEA results without overgeneralizing from one stage alone.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable organizing lesson from irradiation, diffusion, and segregation literature. Apply when: WF-01 irradiation-damage, diffusion, and segregation workflows

## [bc6e9b35] Tribology and machining results need subfamily-specific outputs
- status: confirmed
- category: workflow
- lesson: For metallic tribology and machining MD, separate indentation, scratching, cutting, and wear as distinct contact families. Their core observables differ enough that output templates should be customized instead of reused wholesale, otherwise contact mechanics, surface integrity, and subsurface mechanism comparisons become noisy.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable analysis lesson from the expanded tribology and machining cluster. Apply when: WF-04 analysis for metal tribology and machining studies

## [aaefa571] Superalloy HEA and AM knowledge now form a linked process to mechanism network
- status: confirmed
- category: workflow
- lesson: As the metal packet grows, Ni-based superalloys, HEAs, and AM alloys should no longer be stored as isolated literature bins. Their common dependence on precipitates, interfaces, stacking-fault behavior, thermal gradients, and inherited defect structures makes a linked process-to-mechanism network more useful than separate topic silos.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Useful meta-lesson from the growing superalloy, HEA, and AM literature clusters. Apply when: WF-01 literature synthesis and workflow planning for complex alloys

## [71553f39] Pure-metal mechanism transfer should respect crystal family and carrier type
- status: confirmed
- category: workflow
- lesson: For pure and near-pure metal MD, do not transfer mechanisms under a generic metal label. BCC screw-dislocation control, HCP twinning and non-basal slip, and FCC grain-boundary or twin-mediated plasticity each form distinct transfer domains that should be respected before borrowing conclusions across Fe, Nb, V, Cr, Mo, Ni, or Co.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable synthesis lesson from the pure-metal mechanism expansion. Apply when: WF-01 literature synthesis and WF-03A pure-metal deformation workflows

## [ed66b489] Hydrogen helium and segregation evidence now supports an environment-assisted failure chain
- status: confirmed
- category: workflow
- lesson: For environment-assisted metal damage, organize evidence as a chain from trapping and diffusion to complexion or interface-state change and finally to altered fracture or plasticity. This makes it easier to integrate Fe, Ni, Cu, W, and Al studies without flattening hydrogen, helium, and solute segregation into one undifferentiated chemistry effect.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable organizing lesson from the expanded H-He-segregation corpus. Apply when: WF-01 and WF-03A environment-assisted fracture, diffusion, and irradiation workflows

## [e248536c] Annealing and recrystallization form a distinct thermal-microstructure workflow family
- status: confirmed
- category: workflow
- lesson: For metal MD, annealing and recrystallization should be managed as a dedicated thermal-microstructure workflow family. Recovery, grain rotation, grain-boundary migration, abnormal growth, interface migration, and precipitate evolution are linked strongly enough that they should not be hidden inside generic deformation or thermal notes.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable lesson from the annealing and recrystallization literature cluster. Apply when: WF-01 and WF-03A annealing, recovery, grain-growth, and recrystallization workflows

## [e2ca0f42] Metallic glass and crystal contact studies need different mechanism vocabularies
- status: confirmed
- category: workflow
- lesson: For metallic-glass versus crystalline-metal contact studies, do not force both into the same mechanism vocabulary. Metallic glasses are better organized around shear-band and STZ language, while crystalline metals usually require dislocation, twin, and pile-up language, and mixing those default vocabularies obscures comparison rather than helping it.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md
- note: Reusable contrast lesson from the metallic-glass versus crystalline contact corpus. Apply when: WF-04 contact-mechanics analysis across metallic glasses and crystalline metals

## [7161b096] Metal paper learning should prefer a PDF-first evidence ladder
- status: confirmed
- category: workflow
- lesson: For metal-paper learning, treat PDF or full-text access as the preferred evidence tier, then publisher pages, with abstract-only as a fallback. Topics driven by detailed mechanism sequences, boundary conditions, or thermal-history design are especially vulnerable to overcompression when only abstracts are used.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable research-workflow lesson directly supported by the new PDF capture process. Apply when: WF-01 literature research and paper-to-workflow transfer

## [c9110921] General grain boundary chemistry studies need complexion-aware routing
- status: confirmed
- category: workflow
- lesson: For impurity-driven grain-boundary failure in metals, do not collapse the mechanism into simple bond weakening. General grain boundaries can faceting-split into distinct complexion states, and terminal plane plus disordered interfacial structure can control the fracture response as much as the impurity species itself.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable grain-boundary chemistry lesson reinforced by the Ni-S full-text paper. Apply when: WF-03A grain-boundary segregation and embrittlement studies

## [ee7f1947] AM molten pool studies need base-metal genetic effect tracking
- status: confirmed
- category: workflow
- lesson: For molten-pool and AM solidification simulations, preserve the role of the base metal as an active structural template rather than a passive wall. Pre-melting layers, inherited nucleation sites, and the equiaxed-to-columnar transition should be analyzed together if the goal is to explain downstream microstructure and mechanical response.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable process-design lesson from the Al-Cu molten-pool full-text paper. Apply when: WF-01 and WF-03A additive-manufacturing and rapid-solidification workflows

## [2bd6fab1] HCP twin-spacing studies cannot inherit FCC nanotwin intuition by default
- status: confirmed
- category: workflow
- lesson: For HCP twin-spacing studies, avoid importing FCC nanotwin assumptions without verification. In HCP cobalt and potentially related low-SFE HCP systems, decreasing twin spacing can maintain the same family of hardening mechanisms and continue strengthening rather than triggering the FCC-style softening crossover.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable HCP twinning lesson strengthened by the hcp Co full-text paper. Apply when: WF-03A HCP twinning and strength-ductility design studies

## [CL-013] Fixed boundaries (boundary f) need a vacuum buffer or fixed substrate near the box face
- status: confirmed
- category: workflow
- lesson: When using `boundary f` (fixed, non-periodic) in any direction, atoms that move past the fixed box face during thermal motion are deleted on the next reneighboring step. This causes "Lost atoms" errors or silent atom loss. Prevent this by either (1) adding a small vacuum layer between the outermost mobile atoms and the fixed box face in that direction, or (2) fixing a thin substrate region near the contact boundary with `fix setforce 0 0 0` so it cannot accelerate toward the wall. Do not place mobile atoms directly adjacent to a fixed boundary face. The `thermo_modify lost` option can make the loss visible but does not prevent it.
- evidence: https://docs.lammps.org/boundary.html; .claude/lammps-kb-pipeline/raw/827d1e12-1a5d-4351-bd0a-1ac7da5f0404.json
- note: Technically verified against LAMMPS docs (boundary command: style f deletes atoms that cross the fixed face). Distinct from CL-003 which covers velocity initialization on frozen atoms. Two actionable mitigations provided. High reuse potential -- this is a common setup error for non-periodic models. Apply when: Any LAMMPS model using non-periodic fixed boundaries (boundary f). Apply during WF-01 setup review and WF-03 pre-run checks. Reinforcement 827d1e12: When using boundary f (fixed, non-periodic), atoms crossing the box face are deleted. Prevent by adding a vacuum buffer layer or fixing a thin substrate region near the boundary. When using `boundary f` (fixed, non-periodic) in any direction, atoms that move past the fixed box face during thermal motion are deleted on the next reneighboring step. This causes "Lost atoms" errors or silent atom loss. Prevent this by either (1) adding a small vacuum layer between the model surface and the fixed box face in that direction, or (2) fixing a thin substrate region near the contact boundary so it cannot reach the wall. Do not place mobile atoms directly adjacent to a fixed boundary face. WF-01 setup review and WF-03 pre-run checks for any model using non-periodic fixed boundaries

## [cdbb2827] Ionic crystal relaxation with full PPP boundaries can cause instability — add vacuum layer exceeding cutoff radius
- status: confirmed
- category: workflow
- lesson: For ionic crystals (e.g. CaF2, GaN, NaCl-type), using fully periodic boundary conditions (boundary p p p) during relaxation can cause ions to cross periodic boundaries and create ghost-image artifacts, leading to energy divergence or lost atoms. The fix is to add a vacuum layer along at least one axis, and the vacuum thickness MUST exceed the pair cutoff radius. For systems using kspace_style pppm (common for Coulombic ionic potentials), the vacuum should also be large enough to suppress spurious long-range electrostatic coupling between periodic slab images — a practical rule is vacuum >= cutoff + 5-10 Angstroms. If switching the boundary to non-periodic (e.g. boundary p p f), note that PPPM is disabled in the non-periodic direction; either use kspace_modify slab or keep p p p with sufficient vacuum. This applies to all ionic and polar crystal surface relaxation, slab modeling, adsorption, and interface simulations.
- evidence: quarantine/2026-04-04-ppp-cdbb2827.md; knowledge/manuals/lammps/boundary.md; knowledge/cases/raw/GaN氧化/in.GaN.reaxff; knowledge/archive/migration-unpacked/knowledge/knowledge/user-projects/caf2_cutting/cutting_v2.in; .claude/lammps-kb-pipeline/quarantine/2026-04-04-ppp-cdbb2827.md
- note: Confirmed after curator and reviewer agreement. Auto-quarantine was incorrect (classifier misjudged Chinese source). No existing lesson covers this intersection of ionic crystals, PPP boundaries, vacuum sizing, and kspace/PPPM considerations. Reviewer added critical kspace dimension and boundary-switching guidance missing from curator's original proposal. Apply when: WF-01 slab and surface model setup for ionic crystals (CaF2, GaN, NaCl, MgO, ZnO, LiF); WF-03 pre-production relaxation checks; any system using Coulombic pair styles with kspace_style pppm; slab geometry relaxation, adsorption, deposition, and interface models

## [1ac3ee30] Nickel hydrogen studies need trap and transport to be modeled together
- status: confirmed
- category: workflow
- lesson: For nickel hydrogen workflows, evaluate segregation energies and migration barriers together before classifying a grain boundary. Some Ni boundaries trap hydrogen strongly, others act as short-circuit diffusion paths, and some exhibit both tendencies depending on local geometry, excess volume, and elastic distortion.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable lesson distilled from the Ni H embrittlement and Ni fast-path/trapping full-text papers. Apply when: WF-03A nickel bicrystal, hydrogen diffusion, and intergranular fracture studies

## [f10bab4a] Ni based superalloy defect chemistry is as important as defect geometry
- status: confirmed
- category: workflow
- lesson: For Ni-based superalloy atomistic analysis, treat defect chemistry and defect geometry as a coupled system. Solute enrichment to partial dislocations, stacking faults, and precipitate-shearing defects can impose drag or transformation effects that are just as important as the geometric defect path itself.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable lesson from the Re-effect full-text paper and surrounding superalloy literature. Apply when: WF-03A Ni-based superalloy creep, gamma-prime shearing, and fault analysis

## [183c6416] BCC iron grain boundary chemistry should be treated as co segregation not single solute tuning
- status: confirmed
- category: workflow
- lesson: For ferritic iron and steel grain-boundary studies, avoid tuning one segregation species in isolation. Co-segregation and repulsive interactions between carbon, boron, phosphorus, sulfur, hydrogen, aluminum, and related species can reshape the local grain-boundary composition and structure enough to change the final embrittlement or cohesion picture.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable Fe GB chemistry lesson reinforced by the Fe C-B-Al full-text paper and related Fe studies. Apply when: WF-01 and WF-03A ferritic Fe, steel, and grain-boundary chemistry studies

## [df4a326c] Fracture ranking by decohesion energy is a useful early screen for metal grain boundaries
- status: confirmed
- category: workflow
- lesson: For bicrystal metal studies, a simple fracture-energy or decohesion-energy ranking can be an efficient first-pass screen before building more expensive crack-growth or traction-separation workflows. This is especially useful when the immediate goal is to compare plane families, tilt classes, or the direction of chemistry effects rather than to reproduce a full failure trajectory.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable screening lesson from the Fe grain-boundary fracture full-text paper. Apply when: WF-01 and WF-03A bicrystal strength screening and interface comparison

## [2697c58d] W tungsten environment studies should couple transport bubble growth and decohesion
- status: confirmed
- category: workflow
- lesson: For tungsten environment-effect studies, couple transport, trapping, bubble growth, and decohesion into a single analysis chain. Grain-boundary character can shift W between sink, fast-path, or decohesion-sensitive behavior, so isolated single-phenomenon interpretation often misses the controlling mechanism.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable W environment-effect synthesis from the growing tungsten literature cluster. Apply when: WF-01 and WF-03A tungsten grain-boundary, irradiation, and plasma-facing workflows

## [94e6757f] Ni3Al gamma prime studies should be organized from superdislocations to fault chemistry
- status: confirmed
- category: workflow
- lesson: For Ni3Al and gamma-prime-rich superalloy studies, organize the literature as a chain from superdislocation cores and dissociation through stacking-fault energies and chemistry to interface energetics and precipitate shearing or dissolution. This ordering is more transferable to atomistic workflow design than storing each paper as an isolated strengthening result.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable organization rule distilled from the new Ni3Al-focused paper set. Apply when: WF-01 and WF-03A gamma-prime, precipitate-shearing, and superalloy defect workflows

## [b174b7c2] Comparison axis is becoming a first class variable in contact and laser studies
- status: confirmed
- category: workflow
- lesson: For contact mechanics and laser-processing literature mining, prioritize studies that vary a clear comparison axis such as twin spacing, interface character, pulse count, target thickness, orientation, or chemistry. These papers transfer more directly into LAMMPS sweep design than single-condition case reports.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable workflow-design lesson from the expanding comparative paper set. Apply when: WF-01 literature mining and WF-03A/WF-04 parameter-sweep design

## [154ae545] Alpha iron hydrogen fracture needs dynamic GB activation not static GB weakening only
- status: confirmed
- category: workflow
- lesson: For ferritic iron hydrogen-fracture simulations, treat the grain boundary as a dynamically activated structure whose local disorder and stress concentration can be triggered by dislocation impingement and emission. Hydrogen then amplifies the decohesion susceptibility of this activated state, which is a richer mechanism than static GB weakening alone.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable mechanistic lesson from the PDF-backed alpha-Fe H-dislocation-GB paper. Apply when: WF-03A ferritic Fe bicrystal tensile, crack growth, and hydrogen embrittlement workflows

## [0d85a994] Tungsten environment effects now need a multiscale retention chain
- status: confirmed
- category: workflow
- lesson: For tungsten, the most transferable interpretation is a multiscale retention chain: surface uptake and implantation feed vacancy or defect trapping, which alters bulk transport, which then couples with mixed H-He interactions and eventually modifies grain-boundary mobility or decohesion. Treating these as isolated papers hides the dominant retention logic.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable tungsten synthesis rule from the new W additions in wave9. Apply when: WF-01 and WF-03A tungsten plasma-facing, irradiation, and diffusion studies

## [09e7d7f1] Ni3Al APB and fault literature should be read as thermodynamics plus kinetics
- status: confirmed
- category: workflow
- lesson: For Ni3Al and gamma-prime-rich superalloys, APB and planar-fault papers are most valuable when interpreted as a combined thermodynamic and kinetic layer. Intrinsic defects, segregation, substitutional alloying, and temperature can all shift which superdislocation or fault-mediated shearing pathway is actually accessible under load.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable gamma-prime lesson from APB thermodynamics and fault-chemistry additions. Apply when: WF-03A gamma-prime precipitate shearing, fault chemistry, and creep-defect studies

## [36ae7524] Environment assisted metal failure is converging toward coupled defect networks
- status: confirmed
- category: workflow
- lesson: For metal environment-effect studies, move away from one-species narratives. In Fe and W especially, vacancies, dislocations, grain boundaries, phase interfaces, and mixed H-He clusters form coupled defect networks that govern transport, retention, and decohesion more strongly than any isolated species descriptor.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the latest Fe and W additions in wave10. Apply when: WF-01 and WF-03A irradiation, hydrogen embrittlement, and mixed-species defect studies

## [8257fd7e] Ni3Al APB literature is now rich enough to support chemistry aware fault design
- status: confirmed
- category: workflow
- lesson: For Ni3Al and gamma-prime-rich superalloy workflows, APB, SISF, CSF, and generalized stacking-fault data should now be treated as a chemistry-aware design space. Alloying, intrinsic point defects, and temperature can all shift which fault-mediated shearing routes are viable, so static fault values should be read in context rather than copied directly.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable design lesson from the deepening APB and fault literature tree. Apply when: WF-01 and WF-03A gamma-prime alloy design, creep, and precipitate-shearing studies

## [f020cd91] AM and laser papers are most reusable when organized by process variable
- status: confirmed
- category: workflow
- lesson: For metallic laser-processing literature, organize papers by explicit process variable rather than by material name only. Pulse count, oxidation level, powder geometry, target thickness, and melt-pool convection mode are often more transferable to simulation design than the nominal alloy system itself.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable workflow lesson from the latest laser and AM additions. Apply when: WF-01 and WF-03A metallic laser-processing, powder-bed, and thermal-cycling workflow design

## [d85061da] By 300 papers environment assisted failure is best modeled as a defect network problem
- status: confirmed
- category: workflow
- lesson: At the 300-paper milestone, the strongest recurring pattern is that environment-assisted failure in metals emerges from interacting defect networks rather than from isolated hydrogen or helium variables. Vacancies, grain boundaries, phase interfaces, dislocations, mixed clusters, and process history repeatedly appear as coupled controls on trapping, transport, and decohesion.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Milestone synthesis lesson from the 300-paper corpus. Apply when: WF-01 and WF-03A hydrogen, helium, irradiation, and interface-failure workflow design

## [cd145e2b] By 300 papers process history is a first class variable in metal contact and AM studies
- status: confirmed
- category: workflow
- lesson: At the 300-paper stage, contact and additive-manufacturing papers are most transferable when their process-history variables are explicit. Prestrain, pulse count, thermal path, oxidation state, scratch rate, tool geometry, and coalescence route repeatedly change the mechanism ranking, so they should be elevated to first-class sweep variables in future simulations.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Milestone workflow lesson from the contact and AM literature growth. Apply when: WF-01, WF-03A, and WF-04 contact, machining, sintering, and laser-processing workflow design

## [5b20019f] Post 300 environment papers increasingly hinge on defect mobility not only defect presence
- status: confirmed
- category: workflow
- lesson: For post-300 metal environment studies, defect inventories alone are not enough. Hydrogen and helium now repeatedly appear through their effects on mobility, grain-boundary motion, cascade response, and near-surface retention, so these kinetic descriptors should be tracked alongside static trapping energies.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the new Fe/W papers in wave12. Apply when: WF-01 and WF-03A Fe/W irradiation, trapping, and transport workflows

## [c894e153] Ni3Al interface design is moving from scalar energies to plane chemistry and crack path control
- status: confirmed
- category: workflow
- lesson: For Ni3Al and Ni/Ni3Al studies, interface design should no longer rely on one scalar APB or interface-energy value. Plane dependence, pre-wetting transitions, alloying chemistry, and crack-path sensitivity now form a richer design space for understanding gamma-prime cohesion and failure.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the latest Ni3Al and Ni/Ni3Al interface additions. Apply when: WF-03A gamma-prime interface, APB, and crack-path studies

## [eb70c704] After 332 papers nickel environment effects deserve equal footing with Fe and W
- status: confirmed
- category: workflow
- lesson: At this stage of the literature map, nickel has enough standalone hydrogen and helium interface papers to justify its own environment-effects branch. It should no longer be studied only indirectly through superalloys; Ni bicrystals, nanovoids, helium distributions, and irradiation-modified transport all form a distinct transferable workflow family.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the expanding Ni environment-effect corpus. Apply when: WF-01 and WF-03A nickel environment-effects, trapping, and interface-failure studies

## [881fa8b6] Gamma prime literature is now crossing from mechanistic reading to design-map reading
- status: confirmed
- category: workflow
- lesson: For Ni3Al-based gamma-prime systems, the literature has matured enough to support design-map reading. Instead of only collecting isolated APB or superdislocation results, one can now connect composition, site preference, ordering energy, APB energy, and shearing resistance into a workflow for chemistry-aware strengthening design.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the new PDF-backed gamma-prime APB ML study and surrounding papers. Apply when: WF-01 and WF-03A gamma-prime design, precipitate shearing, and superalloy chemistry studies

## [f63aff64] At 360 papers environment studies support cross material transfer by defect descriptor not by alloy family
- status: confirmed
- category: workflow
- lesson: At the 360-paper stage, environment-assisted metal studies are most transferable when grouped by defect descriptor: vacancy trapping, grain-boundary mobility, interface decohesion, cluster transport, and retention history. These descriptors now recur strongly enough across Fe, Ni, W, steels, and superalloys that they provide a better transfer map than alloy-family names alone.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable milestone synthesis from the enlarged Fe-Ni-W-steel environment corpus. Apply when: WF-01 and WF-03A cross-material environment-effects synthesis and workflow planning

## [6fa52757] Ni Ni3Al interface literature now behaves like a full chemistry transport fracture subsystem
- status: confirmed
- category: workflow
- lesson: For Ni/Ni3Al and gamma-prime-rich systems, the literature now supports a subsystem view in which segregation chemistry, hydrogen transport, fracture strength, precipitate interaction, and superdislocation-related fault states are coupled. This is more faithful than using Ni/Ni3Al only as a source of interface-energy numbers.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the expanding Ni/Ni3Al and gamma-prime literature branch. Apply when: WF-03A gamma-prime interface, segregation, transport, and precipitate-interaction workflows

## [301d4961] Steel hydrogen trap literature now supports engineered trap design not only trap identification
- status: confirmed
- category: workflow
- lesson: For hydrogen-resistant steels, the literature now supports a real trap-design workflow. Interfaces can trap or exclude hydrogen, carbon-vacancy-rich carbides can be engineered to create accessible strong traps, and precipitate-interface structure has become a design variable rather than a passive feature.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the new steel PDF-backed papers and related trap literature. Apply when: WF-01 and WF-03A hydrogen-resistant steel microstructure and precipitate-interface design

## [fbb5120e] Gamma gamma-prime interfaces now behave as active diffusion assisted degradation structures
- status: confirmed
- category: workflow
- lesson: For Ni-based single-crystal superalloys, gamma/gamma-prime interfaces are no longer adequately described as static misfit-relief networks. The literature now shows that coupled interfacial dislocation structures can act as diffusion channels, facilitate local dissolution, and actively reshape the interface during creep degradation.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Reusable synthesis from the PDF-backed interface-network paper and surrounding superalloy interface studies. Apply when: WF-03A gamma/gamma-prime creep, rafting, and interface-degradation workflows

## [b1243427] At 400 papers the metal literature map is most reusable as a mechanism network not a reading list
- status: confirmed
- category: workflow
- lesson: At 400 papers, the metal literature map is most valuable as a mechanism network. Defect descriptors, interface classes, process-history variables, and chemistry-controlled trap or fault states now provide a stronger organizing logic than material-name buckets or citation chronology, and they should guide future workflow design and retrieval.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Milestone synthesis lesson from the complete 400-paper corpus. Apply when: WF-01 global literature synthesis and future workflow planning

## [7c115a97] The 400 paper corpus supports three mature design spaces for metal MD
- status: confirmed
- category: workflow
- lesson: The 400-paper corpus now supports three mature design spaces for metal MD. First, environment-defect networks in Fe, Ni, W, Ti, steels, and superalloys; second, gamma-prime and interface chemistry-fault networks in Ni3Al and Ni/Ni3Al systems; third, process-history-controlled contact and additive-manufacturing pathways spanning laser processing, sintering, indentation, scratch, cutting, friction, and wear.
- evidence: .claude/research/metal-paper-learning-2026-04-03.md; .claude/research/metal-paper-400-plan.md; .claude/cache/metal-paper-pdfs/manifest.json; .claude/cache/metal-paper-pdf-extracts/manifest.json
- note: Milestone synthesis from the converged 400-paper corpus. Apply when: WF-01 topic routing and WF-03A/WF-04 simulation design

## [CL-014] Any complex loading scenario must equilibrate fully before applying deformation or boundary constraints
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: For ANY simulation that involves external loading — tensile, compressive, shear, nanoindentation, scratching, cutting, shock, or any deformation protocol — the structure MUST be fully equilibrated BEFORE any load, constraint, or boundary layer is applied. This is a universal workflow rule, not limited to HEA or specific material systems. The correct protocol is: (1) build structure with full periodic BC (p p p), all atoms free; (2) energy minimization (minimize or cg); (3) NPT relaxation at target temperature with sufficient duration (≥50 ps for ~100k atoms, scale with system size); (4) verify T, P, and energy have all converged; (5) ONLY THEN apply fixed boundary layers, rigid substrates, thermostat regions, or Newtonian layers; (6) brief NVT re-equilibration with constraints active; (7) finally start the loading stage. Skipping equilibration before loading causes: artificial internal stress locked into the structure, inability to reach target temperature, catastrophic atom loss during loading, and physically meaningless stress-strain responses. This rule applies regardless of material system (pure metal, alloy, HEA, ceramic, composite), loading type (mechanical, thermal, radiation), or boundary condition strategy.
- evidence: `work/cases/hea-nanoscratch/in.equil.lmp` (incorrect: boundary set before minimization); `work/cases/hea-nanoscratch/log.scratch_05.lammps` (consequence: 19k atoms lost, T spike to 21508K, stable T only 142K vs target 300K); `knowledge/archive/migration-unpacked/agent-core/lammps-workflow/projects/.legacy/Al_compress/scripts/in.compress.lmp` (correct: minimize + NPT 50ps → then fix deform); `knowledge/archive/migration-unpacked/agent-core/lammps-workflow/in.11_fixed.lmp` (correct: staged relaxation before loading); CL-012 (NPT stability checkpoint); PL-004 (HEA standalone relaxation)
- note: Promoted from PL-011 and broadened per user directive (2026-04-10). Original scope was HEA-specific; now elevated to a universal rule for all complex loading scenarios. The BCC Fe GSFE case further validated this principle: even for 0K GSFE, energy minimization must complete before displacement is applied; for 300K GSFE, thermal equilibration must precede displacement. Cross-references: CL-007 (freeze reference length at transition point), CL-012 (verify equilibration stability), CL-003 (velocity on fixed atoms is nondeterministic). Apply when: WF-03A input review for ANY deformation, loading, indentation, scratching, cutting, shock, or shear simulation; WF-02 ensemble selection; WF-01 setup review for non-periodic or constrained models.

## [CL-015] Restart files carry fix/group state that silently breaks multi-stage workflows — prefer data file handoff
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: LAMMPS restart files carry active fix definitions, group assignments, and integration state. When a subsequent script reads a restart and re-declares fixes with the same IDs but different groups, only SOME fixes show "Resetting" warnings while others silently persist on the OLD group from the restart. This causes: (1) atoms that should be integrated with NVE/NVT receiving NO integration (frozen) or DOUBLE integration (energy drift); (2) pressing phases appearing "stable" because substrate atoms are effectively frozen by stale restart fix state; (3) scratch phases failing catastrophically because the incorrect dynamics accumulate over time. The correct approach for multi-stage workflows is: write_data (not write_restart) at each stage boundary, then read_data in the next stage. Data files do NOT carry fix state, group definitions, or integration history — all potentials, groups, and fixes must be declared fresh, eliminating state conflicts. This applies to ANY multi-stage LAMMPS workflow: equilibration → deformation, equilibration → nanoindentation, equilibration → scratching, relaxation → loading, etc.
- evidence: `work/cases/hea-nanoscratch/in.scratch_v2_05.lmp` (reads restart.equil_v2, double integration confirmed in log); `work/cases/hea-nanoscratch/in.scratch_v3_05.lmp` (reads equil_v3.data, all state declared fresh — correct approach); `work/cases/hea-nanoscratch/in.equil_v3A.lmp` + `in.equil_v3BC.lmp` (correct multi-stage data file handoff)
- note: User-confirmed root cause (2026-04-10). The pressing phase appeared stable precisely because restart fix state caused substrate atoms to be frozen. Cross-references: CL-006 (validate restart/data provenance). Apply when: WF-03A any multi-stage LAMMPS workflow with stage boundaries; WF-02 input review when restart files are used as stage handoff.

## [CL-016] Trajectory atoms at z=box_max with periodic z-boundary are periodic wrapping, NOT explosion
- status: confirmed
- category: analysis
- severity: HIGH
- lesson: When analyzing LAMMPS dump trajectories with periodic boundaries (e.g. `boundary f f p`), atoms near z=0 will appear at z=box_zmax due to periodic wrapping. This is NOT atoms flying to the top of the box or model explosion. Before diagnosing "model explosion", "substrate disintegration", or "atoms escaping", ALWAYS check the boundary conditions first. With `boundary f f p`, z is periodic: atoms at z=0 and z=zmax are the SAME atoms through the periodic boundary. The correct way to analyze is to use unwrapped coordinates (xu,yu,zu) in dump, or to account for periodicity in analysis. Failing to recognize periodic wrapping leads to false explosion diagnoses and wasted debugging time.
- evidence: `work/cases/hea-nanoscratch/analyze_scratch05.py` (misdiagnosed sub_z_max=180 as substrate explosion); actual cause was periodic z-boundary wrapping of atoms near z=0; user correction (2026-04-10)
- note: User-corrected (2026-04-10). Promoted from PL-012. Apply when: WF-04 trajectory analysis for any model with mixed periodic/non-periodic boundaries; dump file interpretation.

## [CL-xxx] Paper reproduction must be based on full text — guessing parameters is prohibited
- status: confirmed
- category: reproduction
- lesson: Paper reproduction tasks MUST obtain and read the full text PDF BEFORE any simulation input is built. All TTM coefficients, model geometry, potential choice, pulse parameters, grid resolution, observation windows, and measurement methods must come from the paper, not from reconstructed guesses based on abstracts and figure captions. The PRB 92 174104 double-pulse Al case demonstrated catastrophic failure from parameter guessing: wrong potential (Zhou vs Zhakhovskii), 10x intensity overestimate (incident vs absorbed fluence), 250x model undersizing (16 nm vs 4000 nm slab), and wrong physics engine (fix ttm/mod Beer's law vs paper's Helmholtz wave equation). Result: complete model explosion (T_lattice 270,000 K, T_electron 1,500,000 K) and zero physical reproduction.
- evidence: work/cases/paper-reproduction/prb92-174104-double-pulse-al/povarnitsyn2015.pdf; work/cases/paper-reproduction/prb92-174104-double-pulse-al/README.md; work/cases/paper-reproduction/prb92-174104-double-pulse-al/outputs/delay000ps.log
- note: This is a hard rule. No paper reproduction workflow may proceed past WF-01 without the full paper text available and key parameters extracted. If the full text cannot be obtained, the case must be flagged as BLOCKED, not approximated.

## [fa46bf12] 氯化钠溶液结冰
- status: confirmed
- category: workflow
- lesson: 相变模拟注意点：骤冷温度要足够低以诱导相变，但避免过冷导致结构冻结不自然
- evidence: migration/bob-case-learning/case-氯化钠溶液结冰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-氯化钠溶液结冰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\氯化钠溶液结冰
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 experience

## [43a538a4] 水合物
- status: confirmed
- category: workflow
- lesson: 相变模拟注意点：骤冷温度要足够低以诱导相变，但避免过冷导致结构冻结不自然
- evidence: migration/bob-case-learning/case-水合物.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-水合物.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水合物; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水合物\LT\jiawan.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水合物\LT\spce.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水合物\LT\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 experience

## [CL-017] Never write LAMMPS commands from memory — always consult the manual first
- status: confirmed
- category: workflow
- severity: HIGH
- lesson: When writing ANY LAMMPS command that you are not 100% certain of the exact syntax, you MUST consult the official LAMMPS documentation (https://docs.lammps.org/) before writing it. Guessing command syntax from memory or partial recall produces wrong scripts that waste user time with trial-and-error debugging. This applies especially to commands used infrequently (rerun, read_dump, dump_modify, fix proposals, etc.). The correct workflow is: (1) identify the command; (2) fetch and read the official doc page; (3) cross-check examples; (4) only then write the command. Specific教训 — rerun command syntax: `rerun` uses keyword-value pairs (NOT positional args). Correct syntax is `rerun file [first N] [last N] [every N] dump x y z`. The `dump` keyword is required and must be the LAST keyword. Its arguments are passed to `read_dump`, whose valid fields are only: x, y, z, vx, vy, vz, q, mol, ix, iy, iz, fx, fy, fz. `type` is NOT a valid read_dump field — atom types come from `read_data` and do not change during simulation. Official examples: `rerun dump.file dump x y z vx vy vz`, `rerun dump1.txt first 10000 every 1000 dump x y z`.
- evidence: User correction (2026-04-15); https://docs.lammps.org/rerun.html; https://docs.lammps.org/read_dump.html; three failed attempts on rerun_scratch_separate_grit_force.lammps
- note: This is a meta-workflow rule governing all LAMMPS command generation. Violation causes immediate user-visible failure and loss of trust. Apply when: ANY LAMMPS command writing, especially for commands outside the top-20 most-used (run, fix, group, pair_style, compute, dump, variable, thermostat/barostat fixes, minimize, read_data, velocity, region). For less common commands (rerun, read_dump, fix shake, fix qeq, kspace_modify, neigh_modify, dump_modify, etc.), manual consultation is mandatory before writing.

## [181b2d3c] 规则沟槽结构表面水蒸发
- status: confirmed
- category: workflow
- lesson: 相变模拟注意点：骤冷温度要足够低以诱导相变，但避免过冷导致结构冻结不自然
- evidence: migration/bob-case-learning/case-规则沟槽结构表面水蒸发.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-规则沟槽结构表面水蒸发.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\规则沟槽结构表面水蒸发
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 experience
