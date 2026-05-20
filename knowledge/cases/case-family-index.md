# LAMMPS Case Family Index

Source corpus: `knowledge/cases/raw/`

This is a normalized map for retrieval. Agents should search the raw case tree
after identifying the best family.

## Core families

- `compression-deformation`
  - raw families: `压缩`
  - reference: `work/cases/cu-compress-demo/` (Cu FCC single-crystal, LAMMPS native modeling, Mishin EAM, WF-01 to WF-05 closed loop, OVITO Python verified)
  - common files: `in.cu_compress.lmp`, `log.lammps`, stress-strain data, `ovito_compress_viz.py`, `plot_results.py`
  - known lessons: PL-008 correction (fix print syntax), CL-007 (box length freeze), CL-011 (NVT + fix deform ensemble)
- `tensile-deformation`
  - raw families: `拉伸`, `Ni基合金拉伸`
  - common files: `in.1e9.lmp`, `in.lashen.lmp`, model/final structures
- `shear-and-elastic`
  - raw families: `剪切模量`, `TiAlNb剪切`, `ELASTIC`, `elastic`
  - common files: `in.shear.lmp`, triclinic or `fix deform` workflows
- `melt-solidify`
  - raw families: `融化凝固`, `凝固相变`, `高熵合金`, parts of `AGAuPt`, `ALNi`
  - common files: `in.melt.lmp`, `model.lmp`, liquid/final states, EAM/MEAM
- `reactive-and-deposition`
  - raw families: `NiC`, `GaN氧化`, `金沉积`, `腐蚀`, `吸附`
  - common files: `*.reaxff`, `in.*.reaxff`, `.data`, `log.lammps`
- `grinding-machining-interface`
  - raw families: `超声磨削-TiAlNb`, `磨削`, `MoS2/摩擦`
  - common files: hybrid potentials, substrate/tool regions, multiple models
- `shock-cascade-ttm`
  - raw families: `shock`, `pka级联`, `ttm`, `ttm-Cu`, `ttm-GAN`, `ttm-water`
  - common files: cascade or laser/thermal coupling inputs
- `alloy-and-segregation`
  - raw families: `NiPt`, `NiTi`, `Ni基合金偏聚`, `B2相`, `B2破碎`, `合金建模`
  - common files: EAM/MEAM potentials, `library.meam`, `*.eam.alloy`
- `gsfe-stacking-fault`
  - reference: `work/cases/al-gsfe-baseline/` (Al FCC {111} GSFE, validated baseline)
  - advanced: `work/cases/al-fcc-gsfe/` (multi-potential comparison, different orientation)
  - temperature: `work/cases/al-gsfe-temp/` (GSFE at 273-873 K)
  - common files: `in.gsfe_Al_baseline.lmp`, `Al99.eam.alloy`, `gsfe_baseline.txt`
  - method: two-slab {111} geometry, ppf boundary, z-only relaxation
  - orientation: x=[112], y=[-110], z=[-1-11]; b=a0/6[112] purely along x
  - validated results: USFE ~168 mJ/m2 at 0.73b, ISFE ~145 mJ/m2 at 1.0b
  - known lessons:
    - original in.Al_GSFE.lmp had jump filename bug (jump in.SFE1 must be changed to self)
    - x-only displacement IS physically correct (b lies purely along x=[112] in this frame)
    - adding vacuum gap + ppf boundary gives zero GSFE (slabs have no interaction) — NEVER do this
    - PPP + full relaxation cannot use displace_atoms + minimize (minimize heals the fault)
    - variable equal "c_eatoms" is live reference; must freeze via $ substitution (variable Eo equal $E)
    - al-fcc-gsfe used different {111} variant (111) with x=[-110] requiring x+y displacement
  - applicable: any FCC metal GSFE calculation (Al, Cu, Ni, Au, etc.)
- `simple-molecular-gas`
  - reference: `work/cases/o2-molecule-demo/` (O₂, 5 molecules, LJ + harmonic, molecule template + create_atoms random mol)
  - template: `knowledge/cases/templates/diatomic-molecule-template.md` (通用双原子分子模板，含参数速查表和改编 checklist)
  - common files: `*.mol` (molecule template), `in.*`, `dump.*.lammpstrj`, `log.lammps`
  - known lessons: PL-009 (create_atoms mol 必须配合 random 样式)
  - applicable: O₂, N₂, H₂, CO, NO, F₂, Cl₂ 等双原子气体分子建模

## Raw file patterns seen repeatedly

- input scripts: `in.*.lmp`, `in.melt.lmp`, `in.shear.lmp`, `in.1e9.lmp`
- structures: `model.lmp`, `final.lmp`, `B2_poly.lmp`, `*.data`
- potentials: `*.eam.alloy`, `*.meam`, `library.meam`, `*.tersoff`, `*.reaxff`
- outputs: `log.lammps`, dumps, stress-strain or thermo text files

## Retrieval guidance

1. Choose the nearest family first.
2. Search raw cases for matching `in.*` and potential files.
3. Prefer cases with the same material system and force-field family.
4. Treat raw cases as examples, not guaranteed-correct templates.
