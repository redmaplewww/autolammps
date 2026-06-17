# WF-00: 仿真方案设计阶段

本文档定义 WF-00 阶段，供 `lammps-simulation-architect` 和 `lammps-reviewer` 参考。

## 一、阶段定义

WF-00 是所有多阶段仿真任务的入口阶段。
在 WF-00 完成之前，不得进入 WF-01。

**何时需要 WF-00：**
- 用户提供了模糊的仿真目标（如"我想模拟铜的高温拉伸"）
- 用户要求开始一个多阶段的新仿真项目
- 用户没有提供完整的方案参数

**何时不需要 WF-00：**
- 用户明确要求纯分析（已有 log.lammps）
- 用户要求纯知识检索
- 用户只要求单次执行现有案例

## 二、仿真方案必须包含的 7 项决策

| 编号 | 决策项 | 内容要求 | 依据要求 |
|------|--------|---------|---------|
| **D1** | 材料体系 | 元素组成、晶体结构（FCC/BCC/HCP/非晶等） | 必须 |
| **D2** | 研究目标 | 物理现象：拉伸/压缩/剪切/扩散/相变/反应等 | 必须 |
| **D3** | 热力学条件 | 温度、压力、环境（零温/常温/高温/高压等） | 必须 |
| **D4** | 边界与尺寸 | PBC 策略、模型尺寸、原子数目标 | 必须 |
| **D5** | 力学/物理加载 | 应变率、加载方向、时间步长、 thermostat/barostat | 必须 |
| **D6** | 势函数族 | EAM/ReaxFF/MEAM/LJ 等候选族（具体选型留给 WF-02） | 必须 |
| **D7** | 验收标准 | 可量化的成功指标（不是"跑通就好"） | 必须 |

## 三、方案输出格式

`work/cases/<slug>/SIMULATION_SCHEME.md`：

```markdown
# <案例名称> — 仿真方案 v<version>

> 创建时间: <timestamp> | Architect: lammps-simulation-architect

## 决策清单

| 编号 | 决策项 | 内容 | 依据 |
|------|--------|------|------|
| D1 | 材料体系 | <Cu, FCC> | 用户需求 |
| D2 | 研究目标 | <高温单轴拉伸> | 用户需求 |
| D3 | 热力学条件 | <300K, 1atm> | 文献基准 |
| D4 | 边界与尺寸 | <PBC all, ~10nm, ~4000 atoms> | 物理估算 |
| D5 | 力学/物理加载 | <1e8/s, x方向, 0.001fs timestep> | 文献基准 |
| D6 | 势函数族 | <EAM> | 案例参考 |
| D7 | 验收标准 | <yield strength 1-2 GPa, failure strain > 0.1> | 用户确认 |

## 风险评估

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| 高温下 EAM 适用性 | medium | 查文献确认 |
| 边界效应 | low | 10nm 以上 |

## 关键参考文献

- <paper 1>: <核心结论及关联>

## 审查记录

| 审查时间 | 审查人 | 结果 | 问题 |
|----------|--------|------|------|
| YYYY-MM-DD HH:MM | lammps-reviewer | PASS | - |

## 状态

- 方案状态: draft / under-review / approved
- 方案版本: v1.0
```

## 四、Architect 的行为要求

1. **必须调用 `lammps-case-librarian`** 检索相似案例作为参考
2. **必须调用 `lammps-paper-researcher`** 检索文献基准（尤其 D3/D5/D7）
3. **必须与用户确认 D7 验收标准**（用户目标）
4. **D1-D6 可以由 Architect 根据案例和文献推理**，但必须引用依据
5. **方案必须经过 `lammps-reviewer` 审查**（WF-00 Gate）后才能推进

## 五、审查前自检清单

Architect 提交审查前必须确认：

```
[ ] D1-D7 全部填写，无"待定"项
[ ] 至少引用 1 个本地参考案例
[ ] 至少引用 1 个文献基准（D3/D5/D7）
[ ] D7 验收标准可量化（包含具体数值或范围）
[ ] 风险评估中至少识别 1 个 medium+ 风险
[ ] 方案slug已在 work/cases/<slug>/ 下创建目录
```

## 六、审查清单（Reviewer）

`lammps-reviewer` 审查 WF-00 方案时，必须检查：

```
[ ] D1-D7 完整性
[ ] D7 验收标准可量化
[ ] 风险评估存在且合理
[ ] 参考文献真实存在
[ ] MB-001 ~ MB-007 不在触发范围内（仿真方案层面）
```

**注意**：WF-00 阶段主要检查方案逻辑，具体的 LAMMPS 命令级检查（MB-001~MB-007）
在 WF-01/WF-02/WF-03A 阶段由 Reviewer 再次执行。

## 七、方案锁定后的处理

方案审查通过后：
1. Architect 将 SIMULATION_SCHEME.md 状态改为 `approved`
2. Architect 将方案传递给 `lammps-coordinator`
3. Coordinator 将方案中的关键约束写入 MASTER.md
4. Coordinator 进入 WF-01

## 八、方案被 REVISE 的处理

如果 Reviewer 返回 `REVISE`：
1. Architect 接收审查反馈
2. 修改方案中的问题项
3. 重新提交 Reviewer 审查
4. 循环直到 `PASS` 或 `BLOCKED`

## 九、与 WF-01 的衔接

WF-00 完成后，SIMULATION_SCHEME.md 中的以下信息传递给 WF-01：

| SIMULATION_SCHEME.md | → WF-01 |
|---------------------|---------|
| D1 (材料体系) | 结构来源决策的输入 |
| D4 (边界与尺寸) | 模型尺寸约束 |
| D6 (势函数族) | 传给 WF-02 精确选型 |

WF-01 和 WF-02 的决策**不得违背 SIMULATION_SCHEME.md 中已锁定的 D1-D7**。
如有矛盾，必须回到 WF-00 由 Architect 处理。
