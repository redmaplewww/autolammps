# Matplotlib 图表规范

> 本文件定义 LAMMPS 后处理中所有 matplotlib 图表的标准模板。后处理 Agent 必须基于本文件中的模板生成图表，不允许凭空编写。

## 一、全局样式

```python
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

FIGURE_SIZE = (10, 6)
DPI = 150
FONT_SIZE = 12
LINE_WIDTH = 1.5

plt.rcParams.update({
    'font.size': FONT_SIZE,
    'axes.labelsize': FONT_SIZE + 2,
    'axes.titlesize': FONT_SIZE + 4,
    'legend.fontsize': FONT_SIZE - 1,
    'figure.dpi': DPI,
    'savefig.dpi': DPI,
    'savefig.bbox': 'tight',
})
```

## 二、应力-应变曲线模板

适用仿真类型: `uniaxial-tension`, `uniaxial-compression`

```python
fig, ax = plt.subplots(figsize=FIGURE_SIZE)
ax.plot(strain, stress, 'b-', linewidth=LINE_WIDTH, label='Simulation')

# 标注屈服点（如果有）
if yield_point is not None:
    ax.axhline(y=yield_stress, color='r', linestyle='--', alpha=0.7, label=f'Yield: {yield_stress:.2f} GPa')
    ax.axvline(x=yield_strain, color='r', linestyle=':', alpha=0.5)

# 标注弹性模量区间
if elastic_modulus is not None:
    strain_fit = np.linspace(0, yield_strain * 0.8, 100)
    stress_fit = elastic_modulus * strain_fit
    ax.plot(strain_fit, stress_fit, 'g--', linewidth=1.0, alpha=0.7, label=f'E = {elastic_modulus:.1f} GPa')

ax.set_xlabel('Engineering Strain')
ax.set_ylabel('Engineering Stress (GPa)')
ax.set_title('Stress-Strain Curve')
ax.legend()
ax.grid(True, alpha=0.3)
fig.savefig('stress_strain_curve.png', dpi=DPI, bbox_inches='tight')
plt.close(fig)
```

## 三、剪应力-剪应变曲线模板

适用仿真类型: `shear`

```python
fig, ax = plt.subplots(figsize=FIGURE_SIZE)
ax.plot(shear_strain, shear_stress, 'b-', linewidth=LINE_WIDTH, label='Simulation')

ax.set_xlabel('Shear Strain (gamma)')
ax.set_ylabel('Shear Stress (GPa)')
ax.set_title('Shear Stress-Strain Curve')
ax.legend()
ax.grid(True, alpha=0.3)
fig.savefig('shear_stress_strain.png', dpi=DPI, bbox_inches='tight')
plt.close(fig)
```

## 四、温度/能量/压力演化模板

适用仿真类型: 所有

```python
fig, axes = plt.subplots(nrows, 1, figsize=(10, 4 * nrows), sharex=True)

# 温度
axes[0].plot(timestep, temp, 'r-', linewidth=LINE_WIDTH)
axes[0].set_ylabel('Temperature (K)')
axes[0].set_title('Thermodynamic Evolution')
axes[0].grid(True, alpha=0.3)

# 势能
axes[1].plot(timestep, pe, 'b-', linewidth=LINE_WIDTH)
axes[1].set_ylabel('Potential Energy (eV)')
axes[1].grid(True, alpha=0.3)

# 压力（如果需要）
if pressure is not None:
    axes[2].plot(timestep, pressure, 'g-', linewidth=LINE_WIDTH)
    axes[2].set_ylabel('Pressure (bar)')
    axes[2].grid(True, alpha=0.3)

axes[-1].set_xlabel('Timestep')
fig.savefig('thermo_evolution.png', dpi=DPI, bbox_inches='tight')
plt.close(fig)
```

## 五、D7 验收标注图模板

适用仿真类型: 所有（必选）

```python
fig, ax = plt.subplots(figsize=FIGURE_SIZE)

# 画主曲线（根据仿真类型选择）
ax.plot(x_data, y_data, 'b-', linewidth=LINE_WIDTH, label='Simulation')

# 标注每条 D7 验收标准
d7_colors = {'met': 'green', 'not_met': 'red', 'cannot_compute': 'gray'}

for criterion in d7_validation:
    status = criterion['status']
    color = d7_colors.get(status, 'gray')
    target = criterion.get('criterion', '')
    value = criterion.get('computed_value')

    if target_range_min is not None and target_range_max is not None:
        ax.axhspan(target_range_min, target_range_max, alpha=0.15, color=color,
                   label=f'D7: {target} [{status}]')
        ax.axhline(y=target_range_min, color=color, linestyle='--', alpha=0.6)
        ax.axhline(y=target_range_max, color=color, linestyle='--', alpha=0.6)
    if value is not None:
        ax.axhline(y=value, color=color, linestyle='-', alpha=0.8)

ax.set_xlabel(x_label)
ax.set_ylabel(y_label)
ax.set_title(f'D7 Validation: {case_slug}')
ax.legend(loc='best', fontsize=9)
ax.grid(True, alpha=0.3)
fig.savefig('d7_validation.png', dpi=DPI, bbox_inches='tight')
plt.close(fig)
```

## 六、温度-能量曲线（熔化/凝固）

适用仿真类型: `melting/solidification`

```python
fig, ax1 = plt.subplots(figsize=FIGURE_SIZE)

ax1.plot(temperature, energy, 'b-', linewidth=LINE_WIDTH, label='Potential Energy')
ax1.set_xlabel('Temperature (K)')
ax1.set_ylabel('Potential Energy (eV)', color='b')
ax1.tick_params(axis='y', labelcolor='b')

ax2 = ax1.twinx()
ax2.plot(temperature, volume, 'r-', linewidth=LINE_WIDTH, alpha=0.7, label='Volume')
ax2.set_ylabel('Volume (A^3)', color='r')
ax2.tick_params(axis='y', labelcolor='r')

ax1.set_title('Temperature vs Energy & Volume')
fig.legend(loc='upper right', bbox_to_anchor=(0.9, 0.9))
ax1.grid(True, alpha=0.3)
fig.savefig('temp_vs_energy.png', dpi=DPI, bbox_inches='tight')
plt.close(fig)
```

## 七、命名规则

| 图表 | 文件名 |
|------|--------|
| 应力-应变曲线 | `stress_strain_curve.png` |
| 剪切曲线 | `shear_stress_strain.png` |
| 温度演化 | `temperature_evolution.png` |
| 势能演化 | `potential_energy.png` |
| 热力学演化 | `thermo_evolution.png` |
| 温度-能量 | `temp_vs_energy.png` |
| D7 验收 | `d7_validation.png` |
| 弹性模量拟合 | `elastic_modulus_fit.png` |

## 八、数据提取规则

从 `log.lammps` 提取数据时：

1. 找到 thermo header 行，确定每列的含义。
2. 跳过重复的 header 行（LAMMPS run 分段时会产生多个 header）。
3. 只读取数值行，忽略非数值行。
4. 应变计算：`strain = (Lx - Lx0) / Lx0`（工程应变），从 thermo 的 `Lx/xy/...` 列获取。
5. 应力计算：使用 thermo 中的 `Pxx Pyy Pzz` 列，`stress = -(Pxx + Pyy + Pzz) / 3`，单位转换 `bar -> GPa` 除以 10000。
6. 剪切应力：使用 `Pxy` 列，`shear_stress = -Pxy / 10000` GPa。
7. 温度、能量直接从 `Temp` 和 `PotEng` 列读取。
8. 如果列名不确定，必须先检查 thermo header 再提取，不允许猜测列索引。

## 九、单位转换参考

| LAMMPS 单位（metal） | 换算 |
|----------------------|------|
| 压力 `bar` -> `GPa` | `/= 10000` |
| 长度 `Angstrom` | 直接使用 |
| 能量 `eV` | 直接使用 |
| 温度 `K` | 直接使用 |
| 时间步 `fs` | 直接使用 |

## 十、禁止事项

- **禁止**在没有参考模板的情况下从零编写 matplotlib 代码。
- **禁止**硬编码轴范围（必须从数据自动计算，可添加 5% 边距）。
- **禁止**省略轴标签和单位。
- **禁止**使用非 `Agg` 后端（必须用 `matplotlib.use('Agg')`）。
- **禁止**在脚本中调用 `plt.show()`（只 `savefig`）。
- **禁止**猜测 thermo 列的索引，必须先读取 header 行。
- **禁止**在 D7 验收标注图中遗漏任何 D7 标准项。

### 工具隔离铁律（最高优先级）

- **禁止用 matplotlib 渲染任何原子结构图。** 原子快照、CNA 着色、应力/温度场、位错、团簇、截面、轨迹可视化——凡是需要展示原子位置的图，全部用 OVITO。
- **禁止使用 `scatter`、`scatter3D`、`plot`（点模式）来模拟原子图。** matplotlib 没有原子渲染能力，用散点图"假装"原子结构是不可接受的垃圾产出。
- **matplotlib 的唯一合法用途是画标量曲线和数据图。** 如果不确定某张图该用哪个工具，问自己："这张图需要展示原子在哪里吗？" 如果是 → OVITO。如果不是 → matplotlib。
