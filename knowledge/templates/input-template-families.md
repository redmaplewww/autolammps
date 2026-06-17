# LAMMPS 输入模板族

本文件定义当前优先维护的高风险输入模板族，供 `lammps-input-writer` 和 `lammps-reviewer` 优先复用。

## 一、模板族清单

### 1. ReaxFF 反应体系

适用场景：

- 沉积
- 氧化
- 吸附
- 电化学反应

必查项：

- `atom_style charge`
- `pair_style reaxff NULL` 或兼容写法
- `fix qeq/reax`
- 小 timestep
- 邻居列表设置

模板文件：

- `.claude/templates/lammps/reaxff-reactive.in`

### 2. MEAM 多元合金

适用场景：

- 二元或三元金属体系
- 需要 `library.meam` + 参数文件映射

必查项：

- `pair_coeff` 前半与后半元素映射
- `data` 文件 atom types 不得为了势函数强行改写
- 势函数文件与元素顺序一致

模板文件：

- `.claude/templates/lammps/meam-alloy.in`

### 3. 高熵合金融化凝固

适用场景：

- HEA 熔化、凝固、退火

必查项：

- 升温 / 保温 / 冷却分段
- 初始结构是否先单独稳定化
- 温度变量命名一致性

模板文件：

- `.claude/templates/lammps/hea-melt-solidify.in`

### 4. 拉伸 / 应变计算

适用场景：

- 单轴拉伸
- 应力应变曲线输出

必查项：

- 初始盒长冻结
- 工程应变公式
- 应力输出定义
- 变形方向与边界条件

模板文件：

- `.claude/templates/lammps/tensile-strain.in`

### 5. restart / data 续算

适用场景：

- 从中间状态继续
- 多阶段 workflow 切换

必查项：

- 来源文件是否可信
- box 尺寸是否合理
- 读取后是否重新声明必要势函数和 fix

模板文件：

- `.claude/templates/lammps/restart-continue.in`

## 二、使用规则

- 高风险任务优先从模板族开始，而不是从零写
- 模板只能作为骨架，仍需结合本地案例和用户需求最小改写
- 模板产物默认走 reviewer gate

### 6. 单轴压缩 / 应变加载

适用场景：

- 单轴压缩
- 应力应变曲线输出

必查项：

- 初始盒长冻结（CL-007）
- 压缩方向与 erate 符号（erate < 0 表示压缩）
- NVT + fix deform 形变系综（CL-011）
- fix print / fix ave/time 中 equal-style 变量的正确语法：必须用 `$(v_varname)`，裸 `v_varname` 会输出字面文本（PL-008）
- 横向边界保持自由或 NPT 控制

模板文件：

- `work/cases/cu-compress-demo/in.cu_compress.lmp`（Cu FCC 单晶压缩，LAMMPS 原生建模，Mishin EAM，WF-01 到 WF-05 完整闭环）

后处理模板：

- `work/cases/cu-compress-demo/ovito_compress_viz.py`（OVITO Python 3.13.1 验证通过）
- `work/cases/cu-compress-demo/plot_results.py`
