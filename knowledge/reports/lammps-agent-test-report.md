# LAMMPS Agent 测试报告

日期：2026-04-02

本文档记录了当前嵌入式 LAMMPS agent 系统的一次端到端能力测试。

## 测试范围

本次测试重点检查以下能力：

- 是否能作为 project agents 正常加载
- 是否会自动检索本地知识库
- 是否会在需要时搜索原始案例库
- 是否能基于本地证据进行推理和判断
- 是否能按团队角色分配或说明任务流转
- 是否能识别并报告当前实现缺口
- 是否能定位“过去犯过的错误、失败记录、经验总结”

## 测试环境

- 工作目录：`F:\opencode\claude-code-main\claude-code-main`
- agent 列表命令：`bun run src/entrypoints/cli.tsx agents`
- 本次测试的 agents：
  - `lammps-coordinator`
  - `lammps-case-librarian`
  - `lammps-reviewer`
  - `lammps-input-writer`
  - `lammps-analyst`

## 总体结论

当前这套 LAMMPS agent 层已经可以用于：检索、审查、规划、分析。

最强的能力是：

- 自动读取 `/knowledge/` 下的整理知识
- 自动搜索 `knowledge/cases/raw/` 下的原始案例
- 基于本地文件而不是空想来做判断

目前最重要的限制是：历史错误与经验库仍然不完整。

- agents 现在能稳定使用 `/knowledge/failure-patterns.md`
- 也能从本地案例里归纳失败线索
- 但 handover 里提到的 `failure-playbook`、`error-memory`、`corrections/` 还没有真正迁入当前活跃知识层
- 也还没有“自动把新教训写回知识库”的机制

## 测试矩阵

| 测试项 | 目标 | 结果 |
|------|------|------|
| Agent 加载 | 验证 project agents 可用 | 通过 |
| Librarian 检索 | 验证自动搜索知识库和案例库 | 通过 |
| Reviewer 审查 | 验证基于证据的审查行为 | 通过 |
| Analyst 日志分析 | 验证基于文件的分析能力 | 通过 |
| Coordinator 编排 | 验证 workflow 规划和任务分配 | 部分通过 |
| Input Writer 生成 | 验证基于案例的脚本生成 | 部分通过 |
| 错误经验检索 | 验证能否找到过去错误/经验 | 部分通过 |
| 自我记录问题 | 验证是否会记录新发现的问题 | 未通过 |

## 详细结果

### 1. Agent 加载

测试命令：

```powershell
bun run src/entrypoints/cli.tsx agents
```

观察结果：

- project agents 加载成功
- project 级的 `lammps-coordinator` 成功覆盖了 user 级同名 agent
- 当前活跃的 project agents 为：
  - `lammps-analyst`
  - `lammps-case-librarian`
  - `lammps-coordinator`
  - `lammps-input-writer`
  - `lammps-reviewer`

结论：

- 通过

### 2. Librarian 检索行为

测试目标：

- 让 `lammps-case-librarian` 针对 NiC 的 ReaxFF 沉积不稳定问题，自动搜索本地知识和案例，并找出失败原因和已有经验

实际表现：

- 自动读取了这些知识文件：
  - `/knowledge/case-family-index.md`
  - `/knowledge/failure-patterns.md`
  - `/knowledge/potential-selection.md`
- 自动搜索了这些原始案例方向：
  - `knowledge/cases/raw/NiC/`
  - `knowledge/cases/raw/金沉积/`
- 给出了较具体的失败原因，而不是泛泛而谈
- 能通过比较 NiC 与 Au 沉积案例，归纳出可复用经验

优点：

- 自动检索行为明确
- 能列出依据文件
- 能把知识文件和原始案例结合起来总结

限制：

- 它给出的“过去经验”主要是从原始案例中归纳出来的，不是真正来自历史纠错数据库

结论：

- 对“检索”能力：通过
- 对“历史错误经验检索”能力：部分通过

### 3. Reviewer 审查能力

测试目标：

- 给 `lammps-reviewer` 一段故意有问题的 NiC ReaxFF 脚本，检查它是否会先查知识库和案例，再给出审查意见

脚本问题包括：

- `atom_style atomic`
- 缺少 `fix qeq/reax`
- `units metal`
- `timestep 5.0`

实际表现：

- 自动查阅了本地知识和本地 ReaxFF 案例
- 给出 `REVISE`
- 准确识别出关键问题：
  - ReaxFF 的 atom style 不对
  - 缺少电荷平衡
  - 缺少 neighbor 设置
  - 时间步太大
  - units 很可能不匹配

优点：

- 审查是有证据支撑的
- 修改建议具体可执行
- 会引用本地文件作为依据

备注：

- 它引用了一个比较特殊但确实存在的路径：
  - `knowledge/cases/raw/NiC/NiC/in.NiC.reaxff`

结论：

- 通过

### 4. Analyst 分析能力

测试目标：

- 让 `lammps-analyst` 分析 `knowledge/cases/raw/GaLn/sphere/log.lammps`

实际表现：

- 会读取目标日志和附近的对照案例
- 能提炼出具体信号：
  - 最小化是否收敛
  - 温度/压力变化情况
  - 融化阶段后的压力波动是否异常
- 能判断：最小化阶段可信，但融化后的物理过程可信度偏低
- 能指出一个具体可疑点：相较邻近案例，可能缺少 overlap 清理

优点：

- 结论建立在真实文件之上
- 判断有质量感，不只是复述日志
- 后续建议简洁有效

结论：

- 通过

### 5. Coordinator 编排能力

测试目标：

- 让 `lammps-coordinator` 规划 NiC reactive deposition 的 `WF-01` 到 `WF-03A`，并说明各阶段如何分工、哪里需要 reviewer gate

实际表现：

- 会主动查 workflow 和知识文件
- 能按 `WF-01` 到 `WF-03A` 输出分阶段计划
- 能明确指出子 agent 分工：
  - `lammps-case-librarian`
  - `lammps-input-writer`
  - `lammps-reviewer`
- 会明确指出 reviewer gate

优点：

- workflow 感比较强
- 职责拆分清晰

限制：

- 这次测试更偏向“说明自己会如何分配任务”
- 还不能证明在这一轮里它一定真正调用了子 agent 完成整套协作

结论：

- 部分通过

### 6. Input Writer 生成质量

测试目标：

- 让 `lammps-input-writer` 基于本地高熵合金案例，生成一份 melt-solidify 的 WF-03A 草稿

实际表现：

- 会引用本地案例和势函数文件
- 生成了较完整的草稿脚本和假设说明
- 还能告诉 reviewer 下一步该重点检查什么

优点：

- 对本地案例利用较好
- 假设和 reviewer 检查项说得清楚

关键问题：

- 生成脚本里至少有一个明显 typo：
  - `${T_molid_low}` 应该是 `${T_melt_low}`

说明：

- 检索是有效的
- 但生成质量还不能直接信任，必须再经 reviewer 审查

结论：

- 部分通过

### 7. “过去错误 / 经验总结”检索能力

测试目标：

- 明确要求 agent 搜索仓库里真正存在的“错误记录、纠错文档、经验总结”，而不是只搜索提及这些词的地方

实际表现：

- 能正确指出当前真正活跃、可访问的错误类知识文件只有：
  - `/knowledge/failure-patterns.md`
- 也能正确指出以下资源目前并未真正接入当前活跃知识层：
  - `failure playbook`
  - `error memory`
  - `corrections/`
- 还能意识到某些 archive 或 migration 资料可能存在，但并未以可用知识形式落地

这是本次测试里最重要的一条结果。

结论：

- 部分通过

原因：

- agent 搜索行为本身是对的，也能如实报告现状
- 但底层知识能力还不完整，因为真正的历史教训库尚未进入当前活跃知识层

### 8. 是否会记录新问题

测试目标：

- 询问 coordinator：当前新发现的重复性问题会被记录到哪里

实际表现：

- 它会指向 `/knowledge/failure-patterns.md`
- 也能明确承认：目前没有自动记录机制
- 它能准确指出这个实现缺口

结论：

- 对“真正自动记录问题”这一能力：未通过
- 对“诚实识别缺口”这一点：通过

## 关于“是否会自动搜索知识库”的核心结论

当前 agents **确实会自动搜索当前活跃知识层**。

它们现在稳定会查的内容包括：

- `/knowledge/case-family-index.md`
- `/knowledge/workflow-stages.md`
- `/knowledge/potential-selection.md`
- `/knowledge/failure-patterns.md`
- `knowledge/cases/raw/` 下的相关原始案例

但它们现在**还没有**真正可用的完整历史记忆来源：

- 迁入后的 `failure-playbook`
- 迁入后的 `error-memory-playbook`
- 迁入后的 `corrections/`
- 自动把新经验写回去的机制

所以，对你最关心的问题，可以直接下结论：

- **是的**，它们会自动搜索当前项目里的知识文件和原始案例
- **但不是完整的历史经验系统**，因为 handover 里设想的那套错误经验库还没完整接进来

## 测试中额外发现的问题

1. `lammps-analyst` 在处理较大的 NiC 日志时，180 秒内超时。
   - 说明大日志分析还需要更细粒度的策略或辅助文档。
2. `lammps-input-writer` 即使检索做得不错，仍可能生成草稿级错误。
3. `lammps-coordinator` 的“规划和分工”表现很好，但“真实完成子 agent 协作”仍需进一步验证。
4. 当前历史失败知识明显比 handover 文档原先设想的要薄很多。

## 最终评估

### 当前优势

- project-agent 加载正常
- 当前知识文件的自动搜索正常
- 原始本地案例的自动搜索正常
- reviewer 和 analyst 能基于本地证据推理
- coordinator 能组织 workflow 并指出 reviewer gate
- agents 在被追问时能如实报告当前实现缺口

### 当前短板

- 还没有真正完整的历史纠错数据库进入活跃知识层
- 还没有自动记录新问题的机制
- 生成脚本仍然必须严格 review
- 大日志分析容易超时
- coordinator 的真实 delegation 只完成了部分验证

## 优先级最高的后续建议

1. 把真正的历史失败文档迁入当前 project knowledge：
   - failure playbook
   - error memory
   - corrections records
2. 明确“新发现的 recurring lessons 应该写到哪里”，并形成固定格式。
3. 对所有生成型脚本都保留 reviewer 闭环，不要直接信任 input-writer 的结果。
4. 给超大 `log.lammps` 增加更细的分析提示词或辅助知识文档。

## 报告状态

本报告已作为仓库内知识文档保存，反映了本次测试时 LAMMPS agent 系统的实际状态。
