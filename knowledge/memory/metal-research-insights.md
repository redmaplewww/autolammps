# Metal Research Insights

This file stores literature-derived metal MD strategy insights that are useful for
WF-00 scheme design, WF-01 literature synthesis, and WF-03A mechanism planning.

It is intentionally separated from `confirmed-lessons.md` because these entries
are design/research routing knowledge, not mandatory reviewer guardrails.

Use `lammps-knowledge` MCP search first. Read this whole file only when broad
metal-mechanism synthesis is required.

## Topic Index

### Grain boundaries, interfaces, and nanolaminates

`2a43876a`, `6f720bec`, `f77fcec8`, `23a83d36`, `92ed0cdc`, `1696b67c`, `84a82a28`, `019d518a`, `38cbd51d`, `aaefa571`, `71553f39`, `ed66b489`, `e248536c`, `7161b096`, `c9110921`, `cdbb2827`, `1ac3ee30`, `183c6416`, `df4a326c`, `2697c58d`, `94e6757f`, `b174b7c2`, `154ae545`, `0d85a994`, `36ae7524`, `d85061da`, `5b20019f`, `c894e153`, `eb70c704`, `f63aff64`, `6fa52757`, `301d4961`, `fbb5120e`, `b1243427`, `7c115a97`

### HEA and multi-principal alloys

`23a83d36`, `072b18f3`, `1c1edd15`, `38cbd51d`, `aaefa571`, `e2ca0f42`, `f10bab4a`, `94e6757f`, `09e7d7f1`, `8257fd7e`, `881fa8b6`

### Ni superalloy, Ni3Al, and gamma-prime

`84a82a28`, `aaefa571`, `f10bab4a`, `94e6757f`, `09e7d7f1`, `8257fd7e`, `c894e153`, `eb70c704`, `881fa8b6`, `f63aff64`, `6fa52757`, `fbb5120e`, `7c115a97`

### Additive manufacturing, laser, and solidification

`f77fcec8`, `1c1edd15`, `019d518a`, `aaefa571`, `ee7f1947`, `b174b7c2`, `f020cd91`, `cd145e2b`, `7c115a97`

### Environment effects, hydrogen, helium, and irradiation

`92ed0cdc`, `38cbd51d`, `ed66b489`, `c9110921`, `1ac3ee30`, `183c6416`, `2697c58d`, `154ae545`, `0d85a994`, `09e7d7f1`, `36ae7524`, `d85061da`, `5b20019f`, `eb70c704`, `f63aff64`, `6fa52757`, `301d4961`, `7c115a97`

### HCP, Ti, Mg, Zr, and twinning

`2a43876a`, `71471d65`, `6f720bec`, `f77fcec8`, `23a83d36`, `92ed0cdc`, `1696b67c`, `26ae1fbb`, `072b18f3`, `a96e9c55`, `84a82a28`, `1c1edd15`, `019d518a`, `3921533a`, `3e565f79`, `38cbd51d`, `bc6e9b35`, `71553f39`, `ed66b489`, `e248536c`, `e2ca0f42`, `7161b096`, `c9110921`, `ee7f1947`, `2bd6fab1`, `cdbb2827`, `1ac3ee30`, `f10bab4a`, `183c6416`, `df4a326c`, `2697c58d`, `94e6757f`, `b174b7c2`, `154ae545`, `0d85a994`, `09e7d7f1`, `36ae7524`, `8257fd7e`, `f020cd91`, `d85061da`, `cd145e2b`, `5b20019f`, `c894e153`, `eb70c704`, `881fa8b6`, `f63aff64`, `6fa52757`, `301d4961`, `fbb5120e`, `b1243427`, `7c115a97`, `fa46bf12`, `43a538a4`

### Contact, machining, tribology, cutting, scratch

`71471d65`, `26ae1fbb`, `bc6e9b35`, `e2ca0f42`, `cdbb2827`, `b174b7c2`, `cd145e2b`, `7c115a97`

### Thermal microstructure, annealing, recrystallization

`1696b67c`, `aaefa571`, `e248536c`, `7161b096`, `f020cd91`, `cd145e2b`

### Meta synthesis and corpus routing

`aaefa571`, `ed66b489`, `e2ca0f42`, `7161b096`, `1ac3ee30`, `f10bab4a`, `183c6416`, `df4a326c`, `2697c58d`, `94e6757f`, `b174b7c2`, `154ae545`, `0d85a994`, `09e7d7f1`, `36ae7524`, `8257fd7e`, `f020cd91`, `d85061da`, `cd145e2b`, `5b20019f`, `c894e153`, `eb70c704`, `881fa8b6`, `f63aff64`, `6fa52757`, `301d4961`, `fbb5120e`, `b1243427`, `7c115a97`

## Entries

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
