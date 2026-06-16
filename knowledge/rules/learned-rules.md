# Learned Rules — Bob Case Templates + Safety Rules

This file contains distilled LAMMPS modeling templates extracted from Bob老师案例深度学习, plus operational safety rules from incident post-mortems.

## Safety-Critical Rules

### [bb637bff] 物理性质计算强制验证规则 (PL-009衍生)
- **stage**: WF-01
- **apply_when**: 所有WF-02性质验证、所有界面/面缺陷计算、所有物理性质结果交付
- **rules**:
  1. 必须与至少1个文献/DFT/实验值做数量级对比，偏差>50%必须暂停排查
  2. PBC下界面/面缺陷计算必须确认界面数量，通用公式 γ=ΔE/(N_interfaces×A)
  3. 异常信号(如GSFE在完整Burgers向量后不回零)不能归因为数值误差，必须追根溯源
  4. 多势函数一致性不能替代与物理基准的比对
- **evidence**: work/cases/fe-bcc-gsfe/; knowledge/corrections/reference-corpus/2026-04-09-gsfe-pbc-pl-009-5106c0a5.md

---

## Modeling Templates

### T-01: 润湿模拟 (Wetting Simulation)
- **pattern**: 壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- **key commands**: `setforce 0 0 0` (wall freeze), `fix nvt` (equilibrate), velocity impose, `dump`
- **applicable cases**:
  - 1丙烯液体润湿-雪人 [b37a9eb7]
  - 1十六烷润湿-雪人 [73e40fc2]
  - 1沟槽表面水滴润湿-呢嘉 [e2d32161]
  - 1油包水-雪人 [62adccf5]
  - 1硅表面水滴结冰-雪人 [5452d132]
  - 1氯化钠液滴润湿-雪人 [d5c67a5f]
  - 1非对称润湿MDPD模拟-雪人 [3fffc7ea]
  - 1水分子穿孔扩散-无 [2d76dd1f]
  - MDPD气模 [7bd04681]
  - 二元液滴MDPD润湿移动 [e124da91]
  - 多孔聚氨酯吸附渗透 [4e09888f]
  - 水蒸气凝结 [44e8603d]
  - 沟槽表面润湿带气体 [74b6ff8c]
  - 液滴输运MDPD [d297c0cd]
  - 纳米矩形超疏水微结构表面液体流动 [fecaac90]
  - 高分子微结构流动 [61d9b157]
  - 石墨烯表面-冰 [ad46bb4f]
  - 磁-液滴移动 [eebde5bd]
  - lj热阻 [369c8be7]

### T-02: 力学加载 (Mechanical Loading)
- **pattern**: fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- **key commands**: `fix deform`, `compute stress/atom`, `fix ave/time`
- **applicable cases**:
  - 1金属单轴拉伸-雪人 [e66c2e69]
  - 1聚丙烯拉伸-雪人 [b9a0062e]
  - 铜片剪裁拉伸 [e268e38c]
  - 铝块剪切应变 [8f7daef3]
  - 弹性常数计算 [39b44796]
  - 两种局部应力 [f7d631c9]
  - 冰黏附 [2c8ac2ed]
  - 聚氨酯拉切 [9b8b13bb]
  - 烷烃OPLSAA [1763cead]
  - 热导比热粘度计算 [42244855]
  - SiO2表面冰摩擦 [2e8c0707]

### T-03: MDPD/DPD 模板
- **pattern**: hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd
- **key commands**: `pair_style hybrid/overlay mdpd/rhosum mdpd`, `fix mvv/dpd`
- **applicable cases**:
  - 1MDPD粘度计算-雪人 [d57b396d]
  - 1油水界面DPD-雪人 [aa5577cf]
  - 悬浮液DPD [78ef5704]
  - 磁场_磁流体_DPD [564ba315]

### T-04: ReaxFF 模板
- **pattern**: pair_style reax/c + fix qeq/reax + reax/c/species，先 NPT 平衡再 fix deform 加载
- **key commands**: `pair_style reax/c`, `fix qeq/reax`, `fix reax/c/species`
- **applicable cases**:
  - 1环氧树脂reaxff-fly [758ef0da]
  - 有机物热解 [798055d8]
  - 水泥 [3b162c30]

### T-05: 表面张力计算 (Surface Tension)
- **pattern**: stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- **key commands**: `compute stress/atom`, `fix ave/spatial`, P_N - P_T integration
- **applicable cases**:
  - 1MDPD表面张力-雪人 [5bf94ed0]
  - 1spce水表面张力-walker [d4f1ffc4]
  - 1氩表面张力-walker [17074c9e]
  - 液体氩表面张力计算 [286f6894]
  - 硫化氢表面张力计算 [0f99bee4]

### T-06: 扩散模板 (Diffusion)
- **pattern**: delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布
- **key commands**: `delete_atoms`, `fix rigid`, high-T acceleration, `fix ave/chunk`
- **applicable cases**:
  - 1气体扩散-无 [01850fdc]
  - 1超临界驱替-雪人 [efaa88b4]
  - 超高分子量聚乙烯 [3f02dc87]

### T-07: 冲击模板 (Shock)
- **pattern**: fix wall/piston 或 velocity set 施加冲击速度，监控应力波传播和局部温度
- **key commands**: `fix wall/piston`, `velocity set`, stress wave monitoring
- **applicable cases**:
  - 冲击气泡波 [39bc4b9f]
  - 激波纳米气泡 [c882d8fb]
  - 镍冲击 [16cf6199]

### T-08: 石墨烯模拟 (Graphene)
- **pattern**: 常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置
- **key commands**: `pair_style tersoff` / `pair_style airebo`, p p f boundary
- **applicable cases**:
  - 石墨烯修饰 [ca732252]
  - 石墨烯剥离 [92874050]
  - 足球烯膜 [9d894423]
  - 金刚石探针磨石墨烯 [5d034510]

---

## Common Pre-processing Steps

These are shared across most templates:

| Step | Command | Used by |
| --- | --- | --- |
| Minimize first | `minimize 1e-10 1e-10 1000 10000` | T-01, T-02, T-05 |
| NVT/NPT equilibrate | `fix nvt` / `fix npt` | All |
| Wall freeze | `setforce 0 0 0` | T-01 |
| Rigid molecules | `fix rigid` | T-01 (molecular), T-06 |
| Long-range electrostatics | `kspace_style pppm 1e-4` | T-01, T-05, T-06 |
| Strain-controlled loading | `fix deform` | T-02, T-04 |
| Spatial averaging | `fix ave/spatial` / `fix ave/chunk` | T-01, T-05, T-06 |

---

## Retrieval Guide

Use MCP search to find specific cases by template or material:
```
search_lammps_knowledge query="wetting template wall freeze" source_tier="rule"
search_lammps_knowledge query="mechanical loading EAM fix deform" source_tier="rule"
search_lammps_knowledge query="ReaxFF qeq species" source_tier="rule"
```
