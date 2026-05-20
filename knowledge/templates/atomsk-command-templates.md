# Atomsk 命令模板清单

当前可用模板：

- `/.claude/templates/atomsk/create_basic_fcc.sh`
- `/.claude/templates/atomsk/create_basic_bcc.sh`
- `/.claude/templates/atomsk/cif_to_lammps.sh`
- `/.claude/templates/atomsk/polycrystal_basic.sh`
- `/.claude/templates/atomsk/orientation_alignx_unskew.sh`
- `/.claude/templates/atomsk/point_defects_basic.sh`
- `/.claude/templates/atomsk/twin_boundary_basic.sh`
- `/.claude/templates/atomsk/stacking_fault_basic.sh`
- `/.claude/templates/atomsk/dislocation_inclusion_basic.sh`

使用建议：

- 简单晶体：优先 `create_basic_fcc.sh` / `create_basic_bcc.sh`
- CIF 导入：优先 `cif_to_lammps.sh`
- 多晶：优先 `polycrystal_basic.sh`
- 旋转后输出到 LAMMPS：优先 `orientation_alignx_unskew.sh`
- 点缺陷：优先 `point_defects_basic.sh`
- 孪晶界：优先 `twin_boundary_basic.sh`
- 堆垛层错：优先 `stacking_fault_basic.sh`
- 位错-夹杂物复合体系：优先 `dislocation_inclusion_basic.sh`
