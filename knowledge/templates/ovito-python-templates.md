# OVITO Python 模板清单

模板目录：`.angsheng/templates/ovito/`

## 核心渲染引擎

| 模板 | 用途 | 说明 |
|------|------|------|
| `render_engine.py` | 通用渲染引擎 | **所有渲染必须经过此模块**。保证 70-80% 填充率，支持 opengl/tachyon/ospray/anari |

## 快照渲染

| 模板 | 用途 |
|------|------|
| `render_snapshot.py` | 单帧结构快照（使用 render_engine） |
| `render_frame.py` | 指定帧渲染（使用 render_engine） |
| `focus_region_render.py` | 局部区域聚焦渲染（先过滤再 render_engine） |
| `renderer_compare.py` | 多渲染器对比输出（opengl/tachyon/ospray/anari） |

## 结构分析

| 模板 | 用途 |
|------|------|
| `cna_render.py` | CNA 结构分析着色渲染（使用 render_engine） |
| `dislocation_tracking.py` | DXA 位错线提取与渲染（使用 render_engine） |
| `dislocation_time_series.py` | 位错密度时间序列（数据导出 + render_engine 渲染） |
| `cluster_analysis.py` | 团簇/缺陷统计与渲染（使用 render_engine） |

## 场分析

| 模板 | 用途 | 说明 |
|------|------|------|
| `stress_field_map.py` | 应力场空间分布 | 手动 Viewport（ColorLegendOverlay），但仍用 render_engine 的 bbox() |
| `temperature_field_map.py` | 温度场空间分布 | 手动 Viewport（ColorLegendOverlay），但仍用 render_engine 的 bbox() |

## 数据导出

| 模板 | 用途 |
|------|------|
| `rdf_analysis.py` | RDF g(r) 计算 + CSV 导出 + matplotlib 曲线 |
| `export_dump_columns.py` | 导出 dump 文件指定列到 CSV |

## 标准分析流程（pipelines）

组合模板，一键完成某类仿真的全部 OVITO 分析和数据导出。位于 `.angsheng/templates/ovito/pipelines/`。

| 流程 | 适用仿真类型 | 用法 |
|------|-------------|------|
| `metal_tension_pipeline.py` | 单轴拉伸/压缩 | `python metal_tension_pipeline.py dump.lammpstrj log.lammps figures/` |
| `shear_pipeline.py` | 剪切 | `python shear_pipeline.py dump.lammpstrj log.lammps figures/` |
| `melting_pipeline.py` | 熔化/凝固 | `python melting_pipeline.py dump.lammpstrj log.lammps figures/` |
| `general_pipeline.py` | 通用 | `python general_pipeline.py dump.lammpstrj [log.lammps] [figures/]` |

每个流程输出：
- 结构快照（PNG，使用 render_engine）
- CNA 着色图（PNG）
- CNA 演化数据（CSV）
- `pipeline_manifest.json`（全部产出的索引）
- 注：matplotlib 曲线图需单独步骤生成

## 测试

| 路径 | 说明 |
|------|------|
| `.angsheng/templates/ovito/tests/` | 24 个测试脚本 |

## render_engine.py API 速查

```python
from render_engine import RenderEngine

engine = RenderEngine("dump.lammpstrj")

engine.add_modifier(modifier)          # 添加 OVITO modifier
engine.add_to_scene()                  # 添加到场景
engine.compute(frame=0)                # 预计算某帧
engine.bbox(frame=0)                   # 获取边界盒 (min, max)
engine.num_frames                      # 总帧数

engine.render("out.png", frame=0)                                    # 默认 OpenGL 1920x1080
engine.render("out.png", renderer="tachyon")                         # Tachyon 渲染
engine.render("out.png", view_direction="x")                         # 改变视角
engine.render("out.png", size=(2560, 1440))                          # 自定义分辨率
engine.render("out.png", background=(0.0, 0.0, 0.0))               # 黑色背景
engine.render("out.png", hide_cell=False)                           # 显示模拟盒

engine.render_multiple_views("base", frame=0, views=("x", "y", "z")) # 多视角
engine.render_animation("anim.mp4", fps=10)                          # 动画

engine.remove_from_scene()             # 从场景移除
```

## OVITO Python 3.13.1 注意事项

- 正确类名：`CentroSymmetryModifier`（不是 `CentrosymmetryModifier`）
- 验收标准：`python -c "import ovito"` 是否成功，不依赖 CLI 命令
- render_engine 的 LSP import 错误是虚假的 —— Python 运行时同目录导入正常工作

## 案例参考

- `work/cases/cu-compress-demo/ovito_compress_viz.py` -- CNA + CentroSymmetryModifier 压缩轨迹可视化
- `work/cases/cu-compress-demo/plot_results.py` -- matplotlib 应力-应变 + 温度曲线图
