## [8f75e2da] EAM/alloy Multi-Element Template (Mg-Al)
- type: template_snippet
- stage: WF-02
- material: aluminum+magnesium+mg-al
- potential: eam
- summary: Mg-Al EAM/alloy 最小可复用模板：pair_style eam/alloy + pair_coeff * * <file> Mg Al；元素顺序必须与 atom type 顺序一致，否则静默产生错误物理结果。
- lesson: Case: writing EAM/alloy input for multi-element alloys. Risk: wrong element list order on pair_coeff causes incorrect physical results without runtime error. Fix: list elements on pair_coeff in atom-type order (type 1, type 2, ...) and cross-check against data file and potential file header.
- apply_when: Any user or agent writing LAMMPS input scripts for multi-element alloys with EAM/alloy potentials; specifically Mg-Al, Cu-Ni, Fe-Ni-Cr, and HEA systems
- evidence: knowledge/potentials/POTENTIAL_GUIDE.md; knowledge/memory/wf01-mg-al-model-setup.md; knowledge/potentials/eam/CuAgAuNiPdPtAlPbFeMoTaWMgCoTiZr_Zhou04.eam.alloy
- note: Fills a gap in the KB: no multi-element EAM/alloy pair_coeff template existed. CL-010 covers element ordering for ReaxFF only; POTENTIAL_GUIDE.md only has single-element example. This template is the most commonly needed pattern for binary/HEA alloy simulations and is a prerequisite for the WF-02 step referenced in wf01-mg-al-model-setup.md.
