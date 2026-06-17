# LAMMPS 失败模式与防错规则

本文件已合并以下迁移资料中的高价值失败经验：

- failure playbook
- error memory playbook
- 已确认的纠错条目

如需进一步沉淀可复用经验，也要同时参考：

- `knowledge/memory/confirmed-lessons.md`
- `knowledge/memory/pending-lessons.md`
- `knowledge/rules/review-guidelines.md`

## 一、常见失败模式

### 1. `Lost atoms`

- 常见原因：几何不合理、局部重叠、时间步长过大、边界处理不稳
- 第一动作：检查结构、先最小化、减小 timestep、检查边界条件

### 2. `Bond atoms missing`

- 常见原因：拓扑不匹配、构型不稳、atom style 与体系不匹配
- 第一动作：核对数据文件拓扑和势函数兼容性

### 3. `Non-numeric atom coords` / 压力或能量数值爆炸

- 常见原因：初始构型过密、升温/升场过快、时间步偏大、阻尼不足
- 第一动作：检查 overlap、先预平衡、减小 timestep、分段加载外场或热过程

### 4. `Invalid pair style / pair coeff`

- 常见原因：势函数文件不匹配、元素映射错误、包未启用、`pair_coeff` 理解错误
- 第一动作：对照同类本地案例，核对 `pair_style`、元素顺序、库文件和参数文件

### 5. `Segmentation fault` / 异常中止

- 常见原因：数据文件格式损坏、混合势配置不稳、输入组合非法
- 第一动作：缩小成最小复现、对照稳定案例、优先检查最近改动点

### 6. 续算后结果整体失真

- 常见原因：误用了错误来源的 `restart` 或 `data` 文件
- 第一动作：核对来源、生成时间、box 尺寸、是否继承了旧的真空层或旧结构错误

## 二、已合并的关键防错规则

### 1. overlap 删除规则

- `delete_atoms overlap` 必须谨慎使用
- 禁止大阈值 `all all` 清理敏感结构
- 对吸附、沉积、界面模型，只能用更小阈值和更窄分组

### 2. 固定区赋速规则

- fixed / frozen / boundary 区原子不得被广义 `velocity all create ...` 覆盖
- 初始化速度时，只应给 mobile 或等效可动组赋值

### 3. ReaxFF 稳定性规则

- 复杂反应体系优先使用更小 timestep
- 先做无场或弱扰动预平衡，再逐步加载强场或反应条件
- 对 `qeq` 收敛警告要持续监控，不能只看是否跑完

### 4. 结果验收规则

- “跑完”不等于“成功”
- 每类任务都要有明确验收指标，例如：
  - 沉积判据
  - 结构稳定性指标
  - 目标相分数或缺陷统计

### 5. 续算前验证规则

- 从 `restart` / `data` 文件继续计算前，必须先检查 box 尺寸是否合理
- 不能默认中间文件就是正确基线
- 如果来源不明，优先回到最近一次已验证的最终结构

## 三、审查时必须检查的项

- 输入文件中失败发生点附近的命令
- 最近一次修改的参数
- 与最近似本地案例的差异
- 是否违反了固定区赋速、overlap、ReaxFF 稳定性等规则

## 四、使用原则

- 出现新失败模式时，先比对本文件
- 若本文件没有，再去本地案例和经验层中找近似条目
- 只有当新规则足够稳定时，才将其提升为 confirmed lesson
