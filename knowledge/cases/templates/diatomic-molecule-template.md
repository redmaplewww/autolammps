# Template: Diatomic Molecule Modeling (双原子分子建模模板)

```yaml
# === MACHINE-READABLE METADATA ===
template_id: diatomic-molecule-template
version: 1.0
created: 2026-04-14
source_case: work/cases/o2-molecule-demo/
status: validated
applicability:
  - 双原子分子建模 (diatomic molecule modeling)
  - 使用 molecule template + create_atoms 的分子放置
  - LJ/harmonic 势函数的简单分子动力学
prerequisites:
  - LAMMPS 已安装且可执行 (lmp in PATH)
  - 了解分子模板 (molecule template) 格式
  - 了解 create_atoms 命令语法
artifacts:
  molecule_template: o2.mol          # 分子模板文件
  input_script: in.o2_model          # LAMMPS 输入脚本
  reference_output: dump.o2_model.lammpstrj  # 验证过的轨迹输出
known_pitfalls:
  - PL-009: create_atoms mol 关键字必须配合 random 样式
```

---

## 1. 概述 (Overview)

本模板展示如何：
- 编写一个 **双原子分子模板** (molecule template file)
- 编写配套的 **LAMMPS 输入脚本**，从模板创建 N 个分子
- 进行简单的能量最小化 + NVT 分子动力学

已验证的参考案例：`work/cases/o2-molecule-demo/`（O₂，5 个分子）

---

## 2. 分子模板文件 (Molecule Template File)

### 2.1 通用格式

```
# <分子名称> molecule template
# <说明>

<N> atoms
<Nb> bonds
<Na> angles
0 dihedrals
0 impropers

Coords

1    <x1>    <y1>    <z1>
2    <x2>    <y2>    <z2>

Types

1    <atom_type>
2    <atom_type>

Bonds

1    <bond_type>    1    2
```

### 2.2 已验证的 O₂ 模板 (o2.mol)

```lammps
# O2 molecule template
# Diatomic oxygen, bond length = 1.21 Angstrom
# atom_style molecular (no charges)

2 atoms
1 bonds
0 angles
0 dihedrals
0 impropers

Coords

1    0.0000    0.0000    0.0000
2    1.2100    0.0000    0.0000

Types

1    1
2    1

Bonds

1    1    1    2
```

### 2.3 常见双原子分子参数速查表

| 分子 | 键长 (Å) | 原子质量 (amu) | 备注 |
|------|----------|---------------|------|
| H₂   | 0.74     | 1.008         | 最简单 |
| N₂   | 1.10     | 14.007        | 三键 |
| O₂   | 1.21     | 15.999        | 本模板 |
| CO   | 1.13     | 12.011 / 15.999 | 异核双原子 |
| NO   | 1.15     | 14.007 / 15.999 | 异核双原子 |
| F₂   | 1.42     | 18.998        | |
| Cl₂  | 1.99     | 35.453        | |

**改写规则**：只需要修改 `Coords` 中原子 2 的 x 坐标为对应键长，以及 `Types` 中是否为相同原子类型。异核双原子需要两种 atom type。

---

## 3. LAMMPS 输入脚本模板 (Input Script Template)

### 3.1 完整已验证脚本 (in.o2_model)

```lammps
# ============================================================
# LAMMPS input: N <分子名> molecules in a box
# Pair style: lj/cut, Bond style: harmonic
# Units: real (Angstrom, kcal/mol, amu, fs)
# ============================================================

units           real
atom_style      molecular
dimension       3
boundary        p p p

# ---------- Simulation Box ----------
lattice         sc 1.0
region          box block 0 <L> 0 <L> 0 <L>
create_box      <ntypes> box &
                bond/types <nbondtypes> &
                extra/bond/per/atom 1 &
                extra/special/per/atom 1

# ---------- Mass & Force Field ----------
mass            <type_id> <mass>

pair_style      lj/cut <cutoff>
pair_coeff      <type_id> <type_id> <epsilon> <sigma>

bond_style      harmonic
bond_coeff      <bond_type_id> <k> <r0>

# ---------- Create Molecules ----------
molecule        <mol_id> <template_file>

create_atoms    0 random <N> <seed1> NULL mol <mol_id> <seed2>

# ---------- Energy Minimization ----------
neighbor        2.0 bin
neigh_modify    every 1 delay 0 check yes

minimize        1.0e-6 1.0e-8 1000 10000
reset_timestep  0

# ---------- NVT MD ----------
velocity        all create <T> <seed3> dist gaussian

timestep        1.0
fix             1 all nvt temp <T> <T> <Tdamp>

thermo_style    custom step temp pe ke etotal press density
thermo          50

# ---------- Output ----------
dump            1 all custom 100 <dump_filename> &
                id mol type x y z vx vy vz

run             <nsteps>
```

### 3.2 参数填写指南

| 占位符 | 含义 | O₂ 示例值 | 改写说明 |
|--------|------|-----------|----------|
| `<L>` | 盒子边长 (Å) | 20 | 保证分子不重叠，N 越大 L 越大 |
| `<ntypes>` | 原子类型数 | 1 | 同核=1，异核=2 |
| `<nbondtypes>` | 键类型数 | 1 | 一般 1 |
| `<type_id>` | 原子类型编号 | 1 | |
| `<mass>` | 原子质量 (amu) | 15.999 | 见速查表 |
| `<cutoff>` | LJ 截断距离 (Å) | 10.0 | 通常 2.5σ ~ 3.5σ |
| `<epsilon>` | LJ ε (kcal/mol) | 0.066 | 见常用力场参数表 |
| `<sigma>` | LJ σ (Å) | 2.96 | 见常用力场参数表 |
| `<k>` | 键弹簧常数 | 1100.0 | kcal/mol/Å² |
| `<r0>` | 平衡键长 (Å) | 1.21 | 见速查表 |
| `<N>` | 分子数量 | 5 | |
| `<T>` | 温度 (K) | 100.0 | |
| `<Tdamp>` | 恒温器阻尼 (fs) | 100.0 | 通常 100×dt |
| `<nsteps>` | MD 步数 | 1000 | |

### 3.3 常用 LJ 参数参考 (real 单位)

| 原子 | ε (kcal/mol) | σ (Å) | 来源 |
|------|-------------|-------|------|
| O (TraPPE) | 0.066 | 2.96 | TraPPE 力场 |
| N (TraPPE) | 0.072 | 3.31 | TraPPE 力场 |
| H (通用) | 0.044 | 2.65 | OPLS-UA 近似 |
| C (OPLS) | 0.066 | 3.50 | OPLS-AA sp2 C |
| Cl (OPLS) | 0.300 | 3.55 | OPLS-AA |

---

## 4. 已知陷阱 (Pitfalls)

### 4.1 [PL-009] create_atoms mol 关键字必须配合 random 样式

**错误写法**：
```lammps
create_atoms 0 mol o2mol 5 87287
```

**正确写法**：
```lammps
create_atoms 0 random 5 87287 NULL mol o2mol 87288
```

**原因**：`mol` 是 `create_atoms` 的 **关键字参数**（keyword argument），不是位置参数。它必须出现在 `random` 样式参数之后。

**完整语法**：
```
create_atoms <type> random <N> <seed> <region|NULL> mol <template-ID> <seed2>
```

**参数说明**：
- `type` = 0 → 使用模板中定义的原子类型
- `N` = 要创建的分子数量
- `seed` = 随机位置种子
- `NULL` = 在整个盒子中放置（或指定 region ID）
- `template-ID` = `molecule` 命令定义的模板名
- `seed2` = 分子旋转/取向的随机种子

**报错信息**：
```
ERROR: Unknown create_atoms command option mol (src/create_atoms.cpp:169)
```

### 4.2 create_box 必须预留键的空间

使用分子模板创建含键的分子时，`create_box` 必须声明：
```lammps
create_box 1 box bond/types 1 extra/bond/per/atom 1 extra/special/per/atom 1
```
否则运行时会报 topology overflow 错误。

### 4.3 异核双原子需要两种 atom type

例如 CO：模板中 C 是 type 1，O 是 type 2，需要 `create_box 2`，并分别设置 `pair_coeff 1 1`、`pair_coeff 2 2`、`pair_coeff 1 2`。

---

## 5. 改写为其他分子的 Checklist (改编检查清单)

将本模板改写为其他双原子分子时，逐一检查：

- [ ] 修改 `o2.mol` 中 Coords 的原子 2 x 坐标为新键长
- [ ] 修改 `o2.mol` 中 Types（异核需两种 type）
- [ ] 修改 `in.*` 中 `mass` 为正确原子质量
- [ ] 修改 `pair_coeff` 的 ε 和 σ
- [ ] 修改 `bond_coeff` 的 k 和 r0
- [ ] 修改 `create_box` 的 ntypes（异核 = 2）
- [ ] 修改 `molecule` 和 `create_atoms` 中的模板路径和数量
- [ ] 修改盒子尺寸 L（确保密度合理）
- [ ] 修改温度 T（根据物理场景）

---

## 6. 验证标准 (Verification Criteria)

运行后检查以下内容确认成功：

1. **原子数正确**：`Created <2N> atoms`（N 个分子 × 2 原子/分子）
2. **能量最小化收敛**：Stopping criterion = energy tolerance 或 force tolerance
3. **温度稳定**：NVT 阶段温度在目标值附近波动，无发散
4. **轨迹文件完整**：dump 文件含预期帧数，`mol` 列正确标识分子
5. **无 ERROR 或 WARNING**：log.lammps 中无致命错误

---

## 7. 异核双原子扩展示例 (Heteronuclear Extension)

以 CO 为例，关键差异点：

```lammps
# --- CO molecule template (co.mol) ---
# 2 atoms, 1 bond, atom types: 1=C, 2=O

2 atoms
1 bonds
0 angles
0 dihedrals
0 impropers

Coords

1    0.0000    0.0000    0.0000
2    1.1282    0.0000    0.0000

Types

1    1     # C
2    2     # O

Bonds

1    1    1    2
```

```lammps
# --- in.co_model key differences ---
create_box  2 box bond/types 1 extra/bond/per/atom 1 extra/special/per/atom 1

mass        1 12.011    # C
mass        2 15.999    # O

pair_coeff  1 1 0.066 3.50   # C-C
pair_coeff  2 2 0.066 2.96   # O-O
pair_coeff  1 2 0.066 3.23   # C-O (geometric mean)

bond_coeff  1 1200.0 1.1282  # C≡O
```

---

## 8. 源文件索引 (Source File Index)

| 文件 | 路径 | 说明 |
|------|------|------|
| O₂ 分子模板 | `work/cases/o2-molecule-demo/o2.mol` | 已验证 |
| O₂ 输入脚本 | `work/cases/o2-molecule-demo/in.o2_model` | 已验证 |
| 运行日志 | `work/cases/o2-molecule-demo/log.lammps` | 5 mol, 100 K, 1000 steps |
| 轨迹文件 | `work/cases/o2-molecule-demo/dump.o2_model.lammpstrj` | 11 帧 |
| 本模板 | `knowledge/cases/templates/diatomic-molecule-template.md` | |
| LAMMPS molecule 文档 | `knowledge/manuals/lammps/molecule.md` | 格式参考 |
| LAMMPS create_atoms 文档 | `knowledge/manuals/lammps/create_atoms.md` | 语法参考 |
