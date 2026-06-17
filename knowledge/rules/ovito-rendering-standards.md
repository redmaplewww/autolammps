# OVITO Rendering Standards

## Goal

Avoid blank or misleading renders and keep OVITO outputs reproducible.

OVITO 是本项目渲染原子结构和轨迹图的**唯一工具**。任何涉及原子坐标、原子位置、三维结构、空间场分布的可视化都必须用 OVITO。matplotlib 不具备原子渲染能力，禁止用 matplotlib scatter/plot 模拟原子图。

## OVITO 独占范围

以下图表类型**必须且只能**用 OVITO 生成，使用其他工具视为违规：

- 原子结构快照（初始态、变形态、断裂态、压缩态等）
- CNA 结构分析着色渲染
- 应力场 / 温度场空间分布渲染
- 位错线提取与渲染
- 团簇 / 缺陷区域渲染
- 截面 / 切面渲染
- 轨迹动画
- 任何需要展示原子在哪里、原子结构长什么样的图

## Render Engine（强制）

**所有 OVITO 渲染脚本必须使用 `render_engine.py`。**

模板路径：`.angsheng/templates/ovito/render_engine.py`

```python
from render_engine import RenderEngine

engine = RenderEngine("dump.lammpstrj")
engine.add_to_scene()
engine.render("snapshot.png", frame=0)
```

### 禁止事项

- **禁止**直接调用 `Viewport`、`OpenGLRenderer`、`TachyonRenderer` 构造函数（render_engine 已封装）
- **禁止**使用 `zoom_all()` —— 它无法保证 70-80% 填充率
- **禁止**手动设置 `camera_pos`、`camera_dir`、`fov` 常量值
- 唯一例外：`stress_field_map.py` 和 `temperature_field_map.py` 因 ColorLegendOverlay 需要手动 Viewport，但仍须使用 render_engine 的 `bbox()` 方法计算相机

### 支持的渲染器

`engine.render()` 的 `renderer` 参数接受字符串：

| 字符串 | 渲染器 | 说明 |
|--------|--------|------|
| `"opengl"` | OpenGLRenderer | 默认，快速可靠 |
| `"tachyon"` | TachyonRenderer | 高质量，带环境光遮蔽 |
| `"ospray"` | OSPRayRenderer | 光线追踪，可能不可用 |
| `"anari"` | AnariRenderer | ANARI 后端，可能不可用 |

OSPRay 和 Anari 不可用时会抛出 RuntimeError，脚本应 try/except 捕获。

### 核心保证

render_engine 保证：

1. 模型占据最终图像的 **70-80%**
2. 基于边界框的正交相机放置
3. 自动隐藏模拟盒线框
4. 默认 1920x1080 分辨率
5. 白色背景

## Default Rules

- always load the actual target file first and verify particle count
- use `render_engine.RenderEngine` for all rendering —— do NOT call Viewport directly
- hide the simulation cell unless the box itself is part of the message (render_engine does this by default)
- decide the render intent explicitly before placing the camera:
  - `full-model`
  - `region-of-interest`
  - `cross-section`
  - `defect-focus`
- generate two classes of output when possible:
  - a robust OpenGL snapshot/animation for default deliverables
  - an optional Tachyon high-quality snapshot as a secondary artifact
- when using CNA, clearly state that it is structure classification, not a direct phase-fraction truth model

## Recommended Output Set

- `snapshot.png` - default OpenGL snapshot via render_engine
- `snapshot_tachyon.png` - optional Tachyon still image via render_engine
- `animation.mp4` - default OpenGL animation via render_engine
- `cna_evolution.csv`
- `cna_evolution.png`

## Validation Rules

- do not trust a render just because the script exits with code 0
- check that image size and file size are nontrivial
- OVITO images must be >= 1280x720 pixels
- if a render appears blank, first check:
  - whether render_engine was used correctly
  - whether the rendered frame index exists
  - whether particles were actually loaded

## Region-Of-Interest Practice

- for `full-model`, use `engine.render()` directly —— it computes bbox from all particles
- for `region-of-interest`, first apply slice/expression modifier to filter atoms, then call `engine.render()` —— it will compute bbox from the filtered set
- for `cross-section`, apply the sectioning modifier first, then `engine.render()` computes from remaining visible geometry
- always record which frame and which spatial/selection rule was used

## Deliverable Rules

- if the user asks to cover the whole model, verify the full geometry fits in frame
- if the user asks to focus on a local region, verify the target region is not lost in the full-model framing
- if the main render is unreadable, regenerate with a different camera strategy before delivering
