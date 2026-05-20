# LAMMPS 历史会话专题提炼

本文件基于历史 sessions、纠错记录和工作流记忆做专题提炼，只保留可复用规则，不保留原始会话流水。

## 一、从历史会话中反复出现的主题

### 1. `delete_atoms overlap` 的使用顺序和范围都很敏感

- 历史会话中多次出现对 `delete_atoms overlap` 的修正
- 相关模式包括：
  - 阈值不能过大
  - 不应对敏感体系直接 `all all`
  - 在依赖势函数初始化的场景中，应先完成 `pair_coeff` 再做 overlap 清理

当前使用建议：

- 先检查体系是否需要完全初始化势函数
- 先核对 group 范围
- 在沉积、吸附、界面体系里优先使用最小必要阈值

### 2. 高风险 `in` 文件不应从零凭印象写

- 历史纠错表明：写 `in` 文件前若不先检索案例库和正确模板，容易出现基础公式或关键参数错误
- 对拉伸、应变、势函数映射、反应力场任务尤其明显

当前使用建议：

- 写 `in` 文件前优先查：
  - 本地 case family
  - 已确认的 correct examples
  - confirmed lessons

### 3. 历史会话反复强调“错误必须落盘”

- 多个历史来源都强调：
  - 新错误要回写
  - failed / blocked 案例要复盘
  - 经验要从会话中提炼成规则，而不是只留在对话里

当前使用建议：

- 发现高价值错误后，优先写入 `knowledge/memory/`
- 只有稳定后才纳入主知识库规则摘要

## 二、当前可复用的会话级规则

### 1. 写 `in` 文件前先检索模板

- 这不是“建议”，而是降低出错率的核心动作
- 特别适用于：
  - 拉伸与应变计算
  - ReaxFF / COMB3
  - 高熵合金和多元素体系

### 2. 审查是 workflow 的一部分，不是附加项

- 历史会话中高风险任务多次体现 reviewer gate 的必要性
- 若脚本中包含新公式、新势函数、新映射，优先进入 reviewer

### 3. 大文件与长日志必须缩小处理范围

- 历史工作流和当前测试都说明：
  - 过长输入会超限
  - 大日志直接整体分析容易低效甚至超时

## 三、当前状态

- 本文件是"历史会话专题提炼层"
- 原始 sessions 仍只作为原始材料，不作为活跃知识入口

## 四、Coordinator Token 优化（2026-05-09）

### 问题根因

从 session `bfc43583`（Cu 拉伸工作流）分析：
- Coordinator 总消耗 ~138k cache_read_tokens
- 其中 messages 累积部分 ~103k tokens
- **最大来源**：sub-agent 返回的 tool_result（WF-01/03A Reviewer 每次 20-50k tokens）
- **次大来源**：Coordinator 自己读取技术文件（方案文件、日志、JSON）

### 解决策略：纯委托人架构

**核心原则**：Coordinator 不做技术工作，只做委托调度 + 项目记忆。

**三层防护**：
1. **Sub-agent Prompt 约束** — 强制要求每个 agent 返回结构化 RESULT（≤2k tokens）
2. **代码截断兜底** — `forkedAgent.ts` 中 `extractResultText()` 强制限制 ≤3k tokens
3. **Coordinator Prompt 硬规则** — 绝对不读 scratchpad/ 下的技术文件

### 已实施改动

1. `src/utils/forkedAgent.ts:extractResultText()` — 3k token 截断
2. 所有 lammps-*.md agent prompts — 添加 "Result Format for Coordinator (MANDATORY)" 段落
3. `.angsheng/agents/lammps-coordinator.md` — 重写为纯委托人定位
4. `project-memory/` — 新建目录（init.md, state.md, decisions.md, review-log.md）

### 预期效果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 每个 sub-agent → coordinator | 20-50k | ≤3k |
| Coordinator messages 增长 | ~103k | ~35-45k |
| Coordinator 200k 内可完成 | 2-3 阶段 | 8+ 阶段 |
| 总 workflow tokens | ~750k | ~400-500k |
