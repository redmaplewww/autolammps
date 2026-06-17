## 一、通用自检

- 是否引用了至少一个本地案例或模板
- 是否明确记录了关键假设
- 文件名是否符合所在案例族习惯
- 输出项是否足够支持后续分析

## 二、高风险必查项

### ReaxFF

- `atom_style charge`
- `fix qeq/reax`
- timestep 是否保守
- 邻居列表是否显式设置

### MEAM

- `pair_coeff` 前半提取元素与后半映射元素是否区分清楚
- 是否错误修改了 `data` 文件 atom types

### 高熵合金

- 升温 / 冷却阶段是否分段
- 变量命名是否一致
- 是否需要先单独弛豫

### 拉伸 / 应变

- 初始盒长是否冻结
- 应变公式是否基于固定初值
- 应力输出是否与单位一致
- fix npt 的耦合方向是否排除了 fix deform 所控制的方向

### 续算

- `restart` / `data` 来源是否验证
- box 尺寸是否检查
- 是否继承了过时中间文件

## 三、提交格式要求

`lammps-input-writer` 在提交给 `lammps-reviewer` 或 `lammps-coordinator` 时必须包含：

- `files_changed`
- `source_examples`
- `assumptions`
- `risk_points`
- `self_check_passed_items`
- `review_focus`

## 四、默认规则

- 高风险任务：默认先自检，再 reviewer
- 如果自检中发现关键项无法确认，不应直接交付，应标记风险并请求 reviewer

## [42df4c17] 拉伸模板热力学输出完整性自检项
- type: qa
- stage: WF-03A
- material: aluminum+magnesium+mg-al
- potential: unknown
- summary: 可复用 NPT→fix deform 拉伸模板必须在 thermo_style custom 中显式输出完整应力-应变-温度-盒长组合（stress、strain、temp、lx、ly、lz），以确保后处理阶段有足够数据计算工程应力-应变曲线和验证温度稳定性。
- lesson: 拉伸/应变模板的 thermo_style custom 必须包含 stress、strain、temp、lx、ly、lz 六项输出，保证后处理可计算完整应力-应变曲线。
- apply_when: 所有 NPT→fix deform 拉伸模拟模板（WF-03A），尤其 Mg-Al、Al 等金属合金体系
- evidence: .claude/lammps-kb-pipeline/raw/42df4c17-58da-40c3-aaa4-4aa470db8adf.json; .claude/lammps-kb-pipeline/reviews/42df4c17-58da-40c3-aaa4-4aa470db8adf-1775287359.json
- note: 增强已有自检清单。原始条目的"保存参考盒长"部分已被 CL-007 充分覆盖，增量贡献是热力学输出完整性要求——这是设计时（非调试时）的模板规范，与 CL-007（应变正确性）、CL-011（耦合正确性）、CL-012（运行时诊断）均不重叠。
