---
name: lammps-atomsk-modeling
description: 使用 Atomsk 为 LAMMPS 工作流生成晶体、超胞、多晶、CIF 转换和基础缺陷结构。输出以 Atomsk 命令和参数文件为主。
---

# LAMMPS Atomsk Modeling Skill

当任务属于 WF-01 建模阶段，且 LAMMPS 自身不适合直接完成建模时，使用本 skill。

## 优先知识来源

- `knowledge/manuals/atomsk/official-tutorial-progress.md`
- `knowledge/manuals/atomsk/official-tutorial-core-notes.md`
- `knowledge/manuals/atomsk/command-reference.md`

## 优先模板

- `/.angsheng/templates/atomsk/create_basic_fcc.sh`
- `/.angsheng/templates/atomsk/create_basic_bcc.sh`
- `/.angsheng/templates/atomsk/cif_to_lammps.sh`
- `/.angsheng/templates/atomsk/polycrystal_basic.sh`
- `/.angsheng/templates/atomsk/orientation_alignx_unskew.sh`

## 工作原则

1. 先确认建模任务是否适合 Atomsk。
2. 先查官方教程学习记录，再选模板，不要凭印象写命令。
3. 对多元素、CIF 转换、取向调整、多晶任务，必须明确说明 type 映射与盒子处理。
4. 输出默认是 Atomsk 命令、参数文件和必要说明，而不是直接假设命令已执行。
