---
name: lammps-visualization
description: >
  LAMMPS 后处理可视化 Skill。基于 render_engine.py 保证 70-80% 模型填充率，
  提供标准金属分析流程（CNA、DXA、RDF、应力场、温度场、位错等），
  按仿真类型生成一致的图表清单。OVITO 渲染原子，matplotlib 渲染曲线。
---

# LAMMPS 可视化 & 后处理 Skill

## 核心原则

1. **render_engine.py 是唯一渲染入口** —— 所有原子渲染必须通过 `.angsheng/templates/ovito/render_engine.py`
2. **OVITO 渲染原子，matplotlib 渲染曲线** —— 不可混用
3. **模板优先** —— 不即兴写脚本，从模板出发改路径/参数
4. **仿真类型决定图表清单** —— 同类型仿真必须产出相同图表集

## 工具边界（不可违反）

| 工具 | 用途 | 禁止 |
|------|------|------|
| OVITO + render_engine | 原子结构快照、CNA、应力/温度场、位错、团簇、截面 | 用 matplotlib scatter 模拟原子 |
| matplotlib | 应力-应变曲线、温度/能量演化、RDF g(r)、D7 验证图、相分数时序 | scatter/scatter3D 显示原子位置 |

## 优先知识来源

- `knowledge/rules/post-processing-standards.md` —— 图表清单主规范
- `knowledge/rules/ovito-rendering-standards.md` —— OVITO 渲染规范
- `knowledge/rules/matplotlib-standards.md` —— matplotlib 曲线模板
- `knowledge/templates/ovito-python-templates.md` —— 模板索引
- `knowledge/manuals/ovito/` —— OVITO 手册笔记

## OVITO 模板目录

所有模板位于 `.angsheng/templates/ovito/`：

### 核心引擎

| 模板 | 用途 |
|------|------|
| `render_engine.py` | 通用渲染引擎，70-80% 填充率保证 |
| `render_snapshot.py` | 单帧快照 |
| `render_frame.py` | 指定帧渲染 |
| `renderer_compare.py` | 多渲染器对比 |

### 结构分析

| 模板 | 用途 |
|------|------|
| `cna_render.py` | CNA 结构分析着色渲染 |
| `dislocation_tracking.py` | DXA 位错线提取与渲染 |
| `dislocation_time_series.py` | 位错密度时间序列 |
| `cluster_analysis.py` | 团簇/缺陷统计 |

### 场分析

| 模板 | 用途 |
|------|------|
| `stress_field_map.py` | 应力场空间分布 |
| `temperature_field_map.py` | 温度场空间分布 |

### 数据导出

| 模板 | 用途 |
|------|------|
| `rdf_analysis.py` | RDF g(r) 计算 + 导出 |
| `export_dump_columns.py` | 导出 dump 文件指定列 |
| `focus_region_render.py` | 局部区域聚焦渲染 |

## 标准分析流程 (pipelines/)

位于 `.angsheng/templates/ovito/pipelines/`，一键完成某类仿真的全部 OVITO 分析：

| 流程脚本 | 适用仿真 | 产出 |
|----------|---------|------|
| `metal_tension_pipeline.py` | 拉伸/压缩 | 快照 + CNA + CSP + DXA + CSV |
| `shear_pipeline.py` | 剪切 | 快照 + CNA + DXA + 剪切应力CSV |
| `melting_pipeline.py` | 熔化/凝固 | 快照 + CNA + RDF(initial/final) + thermo CSV |
| `general_pipeline.py` | 通用 | 快照 + CNA + 多视角 + thermo CSV |

每个 pipeline 输出 `pipeline_manifest.json` 索引全部产出文件。

## render_engine.py 用法

```python
from render_engine import RenderEngine

engine = RenderEngine("dump.lammpstrj")

engine.add_modifier(SomeModifier())
engine.add_to_scene()

engine.render("snapshot.png", frame=0)
engine.render("snapshot_hq.png", frame=0, renderer="tachyon")
engine.render_multiple_views("view", frame=0, views=("x", "y", "z"))
engine.render_animation("animation.mp4", fps=10)

engine.remove_from_scene()
```

支持的渲染器字符串：`"opengl"` (默认)、`"tachyon"`、`"ospray"`、`"anari"`

## 标准金属分析流程

### 单轴拉伸/压缩 (uniaxial-tension / uniaxial-compression)

```
必选图表:
1. stress_strain.png          (matplotlib) 应力-应变曲线
2. initial_snapshot.png       (OVITO)     初始结构快照
3. deformed_snapshot.png      (OVITO)     终态结构快照
4. cna_initial.png            (OVITO)     初始 CNA 着色
5. cna_deformed.png           (OVITO)     终态 CNA 着色
6. d7_validation.png          (matplotlib) D7 验证仪表盘

可选图表:
7. cna_evolution.csv          (OVITO)     CNA 相分数时序数据
8. stress_field.png           (OVITO)     应力场分布
9. dislocation_snapshot.png   (OVITO)     位错线提取
10. multi_view.png            (OVITO)     多视角快照
```

### 剪切 (shear)

```
必选图表:
1. shear_stress_strain.png    (matplotlib) 剪切应力-应变曲线
2. snapshots                  (OVITO)     初始+终态快照
3. d7_validation.png          (matplotlib) D7 验证

可选图表:
4. cna 着色
5. 位错线
6. 应力场
```

### 熔化/凝固 (melting/solidification)

```
必选图表:
1. temp_vs_energy.png         (matplotlib) 温度-能量曲线
2. rdf_curve.png              (matplotlib) RDF g(r) 曲线
3. snapshots                  (OVITO)     关键态快照
4. d7_validation.png          (matplotlib) D7 验证
```

### 通用 (general)

```
必选图表:
1. thermo_evolution.png       (matplotlib) 热力学量演化
2. snapshot.png               (OVITO)     结构快照
3. d7_validation.png          (matplotlib) D7 验证
```

## 生成工作流

```
1. 读取 post-processing-standards.md
2. 读取 SIMULATION_SCHEME.md -> 确定 D2 仿真类型
3. 查表确定必选图表清单
4. 对每个图表：
   a. 选择正确模板
   b. 替换文件路径和参数
   c. 执行脚本，验证输出
5. 生成 post-processing-manifest.json
```

## 与工作流的关系

- 对应 `WF-05`
- WF-05 由专用 Agent `lammps-post-processor` 负责
- 本 skill 供 `lammps-post-processor` 调用
- 所有 OVITO 产出必须遵循 `knowledge/rules/ovito-rendering-standards.md`
- 所有 matplotlib 产出必须遵循 `knowledge/rules/matplotlib-standards.md`
