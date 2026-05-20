# LAMMPS 后处理规范 (Post-Processing Standards)

> 本文件是后处理的唯一入口规范。`lammps-post-processor` 必须在开始工作前先读完本文件。

## 一、核心原则

1. **不凭印象编图**：所有图表必须基于模板或已验证的本地脚本。
2. **按仿真类型产出**：不同仿真类型有不同的必选/可选图表清单。
3. **产出一致性**：同类仿真必须产出相同类型的图表。
4. **先读规范再动手**：开始任何后处理任务前，必须先读完本文件和对应的模板。
5. **工具隔离（铁律）**：
   - **matplotlib 只允许画曲线图和数据图**（应力-应变、温度演化、能量演化、D7 验收标注等标量曲线）。
   - **所有原子结构图、轨迹图、快照图必须用 OVITO 渲染**（初始/变形/断裂结构快照、CNA 着色、位错、应力/温度场、RDF 空间分布等涉及原子坐标的图）。
   - **禁止用 matplotlib 画任何包含原子位置/结构/轨迹的可视化图**。matplotlib 没有原子渲染能力，任何试图用 scatter/plot 模拟原子图的产出都是不可接受的。

## 二、工具边界铁律

本节是强制性的，任何后处理任务都必须遵守。

### matplotlib 允许的图表类型（白名单）

只有以下类型的图可以用 matplotlib：

| 允许类型 | 示例 |
|---------|------|
| 标量量随时间/步的演化曲线 | 应力-应变、温度-时间、能量-时间、压力-时间、体积-时间 |
| 拟合线/标注曲线 | 弹性模量拟合线、D7 验收区间标注 |
| 统计分布图 | RDF 曲线（径向分布函数 r vs g(r)）、配位数直方图 |
| 数据导出的汇总图 | 位错密度-时间曲线、CNA 相比例-时间曲线 |
| 多曲线对比图 | 不同条件下的应力-应变对比 |

### OVITO 必须使用的图表类型（任何涉及原子坐标的图）

以下类型的图**必须用 OVITO**，**绝对禁止用 matplotlib**：

| 强制 OVITO 类型 | 原因 |
|----------------|------|
| 原子结构快照（初始/变形/断裂/压缩/剪切/熔化态） | 涉及原子三维坐标渲染 |
| CNA 结构分析着色渲染 | 需要按原子类型着色三维结构 |
| 应力场/温度场空间分布渲染 | 需要在原子位置上着色 |
| 位错线渲染 | 需要三维位错线可视化 |
| 团簇/缺陷区域渲染 | 需要空间选择和三维渲染 |
| 截面/切片渲染 | 需要空间切割后渲染 |
| 任意包含原子位置的渲染 | matplotlib 无原子渲染能力 |

### 违规判定

如果产出中出现以下任何情况，视为违规：

- matplotlib 脚本中出现 `scatter`/`scatter3D` 用于画原子位置 → **违规**
- matplotlib 脚本中尝试用圆形标记模拟原子图 → **违规**
- OVITO 应该渲染的快照被标记为 matplotlib 产出 → **违规**
- 任何图包含原子坐标数据但使用 matplotlib 生成 → **违规**

## 三、必读文件（每次任务前）

后处理 Agent 开始工作前，必须按顺序读取：

1. **本文件** (`knowledge/rules/post-processing-standards.md`)
2. **仿真方案** (`work/cases/<slug>/SIMULATION_SCHEME.md`) — 确定 D2 仿真类型
3. **分析报告** (`analysis-report.json`) — 获取已提取的指标和 D7 验证结果
4. **Matplotlib 规范** (`knowledge/rules/matplotlib-standards.md`)
5. **OVITO 渲染规范** (`knowledge/rules/ovito-rendering-standards.md`)
6. **OVITO 模板清单** (`knowledge/templates/ovito-python-templates.md`) — 选择对应模板

## 四、按仿真类型的图表清单

### 3.1 单轴拉伸 (uniaxial-tension)

| 编号 | 图表类型 | 工具 | 必选/可选 | 文件名 | 数据来源 |
|------|---------|------|---------|--------|---------|
| T-01 | 应力-应变曲线 | matplotlib | **必选** | `stress_strain_curve.png` | `log.lammps` thermo |
| T-02 | 弹性模量标注图 | matplotlib | 可选 | `elastic_modulus_fit.png` | T-01 衍生 |
| T-03 | 温度演化曲线 | matplotlib | 可选 | `temperature_evolution.png` | `log.lammps` thermo |
| T-04 | 势能演化曲线 | matplotlib | 可选 | `potential_energy.png` | `log.lammps` thermo |
| T-05 | 初始/变形/断裂结构快照 | OVITO | **必选** | `snapshot_initial.png`, `snapshot_deformed.png`, `snapshot_fracture.png` | `dump.lammpstrj` |
| T-06 | CNA 结构演化 | OVITO | 可选 | `cna_evolution.png` + `cna_evolution.csv` | `dump.lammpstrj` |
| T-07 | D7 验收标注图 | matplotlib | **必选** | `d7_validation.png` | `analysis-report.json` |

### 3.2 单轴压缩 (uniaxial-compression)

| 编号 | 图表类型 | 工具 | 必选/可选 | 文件名 | 数据来源 |
|------|---------|------|---------|--------|---------|
| C-01 | 应力-应变曲线 | matplotlib | **必选** | `stress_strain_curve.png` | `log.lammps` thermo |
| C-02 | 温度演化曲线 | matplotlib | 可选 | `temperature_evolution.png` | `log.lammps` thermo |
| C-03 | 势能演化曲线 | matplotlib | 可选 | `potential_energy.png` | `log.lammps` thermo |
| C-04 | 初始/压缩结构快照 | OVITO | **必选** | `snapshot_initial.png`, `snapshot_compressed.png` | `dump.lammpstrj` |
| C-05 | CNA 结构演化 | OVITO | 可选 | `cna_evolution.png` + `cna_evolution.csv` | `dump.lammpstrj` |
| C-06 | D7 验收标注图 | matplotlib | **必选** | `d7_validation.png` | `analysis-report.json` |

### 3.3 剪切 (shear)

| 编号 | 图表类型 | 工具 | 必选/可选 | 文件名 | 数据来源 |
|------|---------|------|---------|--------|---------|
| S-01 | 剪应力-剪应变曲线 | matplotlib | **必选** | `shear_stress_strain.png` | `log.lammps` thermo |
| S-02 | 温度演化曲线 | matplotlib | 可选 | `temperature_evolution.png` | `log.lammps` thermo |
| S-03 | 结构快照 | OVITO | **必选** | `snapshot_initial.png`, `snapshot_sheared.png` | `dump.lammpstrj` |
| S-04 | D7 验收标注图 | matplotlib | **必选** | `d7_validation.png` | `analysis-report.json` |

### 3.4 熔化/凝固 (melting/solidification)

| 编号 | 图表类型 | 工具 | 必选/可选 | 文件名 | 数据来源 |
|------|---------|------|---------|--------|---------|
| M-01 | 温度-能量/体积曲线 | matplotlib | **必选** | `temp_vs_energy.png` | `log.lammps` thermo |
| M-02 | 径向分布函数 RDF | OVITO | **必选** | `rdf_plot.png` + `rdf_data.txt` | `dump.lammpstrj` |
| M-03 | 结构快照(固/液态) | OVITO | **必选** | `snapshot_solid.png`, `snapshot_liquid.png` | `dump.lammpstrj` |
| M-04 | D7 验收标注图 | matplotlib | **必选** | `d7_validation.png` | `analysis-report.json` |

### 3.5 通用/其他 (general)

| 编号 | 图表类型 | 工具 | 必选/可选 | 文件名 | 数据来源 |
|------|---------|------|---------|--------|---------|
| G-01 | 热力学量演化(温度/能量/压力/体积) | matplotlib | **必选** | `thermo_evolution.png` | `log.lammps` thermo |
| G-02 | 结构快照 | OVITO | **必选** | `snapshot_final.png` | `dump.lammpstrj` |
| G-03 | D7 验收标注图 | matplotlib | **必选** | `d7_validation.png` | `analysis-report.json` |

## 五、图表产出流程

```
1. 读取 SIMULATION_SCHEME.md -> 确定 D2 仿真类型
2. 匹配本文件第三节 -> 确定必选图表清单
3. 检查可用数据文件 -> log.lammps, dump.lammpstrj, analysis-report.json
4. 对于每个必选图表:
   a. 选择对应的模板/参考脚本
   b. 替换文件路径和参数
   c. 生成脚本
   d. 执行脚本（如果环境支持）
   e. 验证产出文件存在且非空
5. 对于 D7 验收标注图:
   a. 读取 analysis-report.json 的 d7_validation
   b. 在主曲线上标注 D7 验收区间
6. 写出 post-processing-manifest.json
```

## 六、产出清单文件

每次后处理完成后，必须写出 `work/cases/<slug>/figures/post-processing-manifest.json`:

```json
{
  "case_slug": "cu-tensile-300k",
  "simulation_type": "uniaxial-tension",
  "generated_at": "2026-04-27T18:00:00Z",
  "figures": [
    {
      "id": "T-01",
      "type": "stress_strain_curve",
      "tool": "matplotlib",
      "path": "figures/stress_strain_curve.png",
      "status": "generated",
      "file_size_bytes": 45000,
      "source_data": "log.lammps",
      "template_used": "plot_results.py"
    }
  ],
  "required_not_generated": [],
  "errors": []
}
```

## 七、验证清单

每张图生成后必须检查：

- [ ] 文件实际存在（不依赖脚本返回码）
- [ ] 文件大小 > 0 且 > 1KB（排除空白图）
- [ ] 图片尺寸符合规范（matplotlib >= 800x600, OVITO >= 1280x720）
- [ ] 如果是 matplotlib 图，检查轴标签是否完整
- [ ] 如果是 OVITO 图，检查相机策略是否有明确记录
- [ ] D7 验收标注图是否标注了所有 D7 验收项

## 八、模板选择规则

### matplotlib 图表

- 优先使用 `work/cases/cu-compress-demo/plot_results.py` 作为参考骨架。
- 不可用时，使用 `knowledge/rules/matplotlib-standards.md` 中的标准模板。
- **禁止从零编写无参考的 matplotlib 代码**。

### OVITO 渲染

- 快照渲染：使用 `.angsheng/templates/ovito/render_snapshot.py`
- CNA 渲染：使用 `.angsheng/templates/ovito/cna_render.py`
- RDF 分析：使用 `.angsheng/templates/ovito/rdf_analysis.py`
- 局部区域：使用 `.angsheng/templates/ovito/focus_region_render.py`
- 应力场：使用 `.angsheng/templates/ovito/stress_field_map.py`
- 温度场：使用 `.angsheng/templates/ovito/temperature_field_map.py`
- 位错分析：使用 `.angsheng/templates/ovito/dislocation_tracking.py`

### 模板使用规则

1. **必须从已有模板改写**，不允许凭空编写 OVITO 或 matplotlib 脚本。
2. 改写时只替换文件路径、参数、颜色等变量，不改变骨架逻辑。
3. 改写后记录使用了哪个模板。

## 九、输出目录规范

```
work/cases/<slug>/figures/
├── stress_strain_curve.png          # matplotlib
├── temperature_evolution.png        # matplotlib
├── potential_energy.png             # matplotlib
├── d7_validation.png                # matplotlib
├── snapshot_initial.png             # OVITO
├── snapshot_deformed.png            # OVITO
├── snapshot_fracture.png            # OVITO
├── cna_evolution.png                # OVITO
├── cna_evolution.csv                # OVITO
├── plot_stress_strain.py            # 生成的脚本（保留可复现）
├── viz_snapshot.py                  # 生成的 OVITO 脚本
└── post-processing-manifest.json    # 产出清单
```

## 十、D7 验收标注图规范

D7 验收标注图是**每种仿真类型的必选产出**。要求：

1. 在主曲线上（应力-应变、剪切曲线等）标注每条 D7 验收标准。
2. 使用水平虚线标注验收区间上下界。
3. 在图例中列出每条 D7 标准及其状态 (`met` / `not_met`)。
4. 使用绿色标注 `met` 的标准，红色标注 `not_met`。
5. 标题格式: `D7 Validation: <case-slug>`。

## 十一、环境检查

后处理开始前先检查可用工具：

- `python -c "import matplotlib"` -> matplotlib 可用
- `python -c "import ovito"` -> OVITO Python 可用
- `python -c "import numpy"` -> NumPy 可用

如果某个工具不可用：
- matplotlib 不可用：只能输出 OVITO 图，matplotlib 图标记为 `skipped`。
- OVITO 不可用：只能输出 matplotlib 图，OVITO 图标记为 `skipped`。
- 两者都不可用：输出脚本草稿（不执行），标记为 `script_only`。
