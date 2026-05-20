# LAMMPS 工作流交接规范 (V3 — Team-Aware)

本文件定义最小可执行的多 agent 闭环规则，目标是让 coordinator 不只负责规划，还要稳定地推动子 agent 完成真实交接。

## 模式特定交接机制

### Team Mode

- 使用 `TaskCreate({ blockedBy })` 实现阶段间依赖
- 产物写入 `scratchpad/<stage>/` 目录
- 使用 `SendMessage` 进行 agent 间通信
- 使用 `shutdown_request` / `shutdown_response` 管理生命周期

### Standalone Mode (legacy)

- 使用 JSON packet 文件进行阶段间交接
- coordinator 负责 relay 和状态文件维护

## 一、标准闭环路径

### 1. 新建输入路径

适用场景：用户要新建或重写模拟输入。

顺序：

1. `lammps-case-librarian` 检索相近案例、势函数、已有规则
2. `lammps-input-writer` 生成草稿
3. `lammps-reviewer` 审查并给出 `PASS` / `REVISE` / `BLOCKED`
4. `lammps-coordinator` 汇总并决定下一步

规则：

- 高风险任务默认不得跳过 reviewer
- input-writer 草稿默认视为待审稿，不视为最终交付

### 2. 失败排查路径

适用场景：用户已有 `log.lammps`、screen 输出或异常现象。

顺序：

1. `lammps-case-librarian` 检索相似失败经验
2. `lammps-data-analyst` 分析已有日志或输出
3. 如涉及输入修复，再交给 `lammps-reviewer`
4. `lammps-coordinator` 汇总修复建议

### 3. 案例复用路径

适用场景：用户要求按已有案例改写。

顺序：

1. `lammps-case-librarian` 找最近案例
2. `lammps-input-writer` 按最小改动复用
3. `lammps-reviewer` 审查差异与风险
4. `lammps-coordinator` 给出最终交付说明

## 二、默认 reviewer gate

以下阶段默认必须走 reviewer：

- `WF-00`
- `WF-01`
- `WF-02`
- `WF-03A`

以下情况必须强制 reviewer：

- ReaxFF / COMB3
- MEAM 映射调整
- 多元体系
- 应变公式或应力输出修改
- restart / data 续算
- 用户明确要求"检查""review""审查"

`lammps-simulation-reasoner` 不参与 reviewer gate — 它是 advisory 角色，在 reviewer gate 前后均可介入。

## 三、标准交接包

### stage packet files

- `WF-00`: `work/cases/<slug>/SIMULATION_SCHEME.md` (markdown, not JSON)
- `WF-01`: `.lammps-project/wf01.packet.json`
- `WF-02`: `.lammps-project/wf02.packet.json`
- `WF-03A`: `.lammps-project/wf03a.packet.json`

### WF-00 packet -> WF-01

Minimum handoff content (via `SIMULATION_SCHEME.md`):

- `scheme_status`: `approved`
- `case_slug`: slug for the case directory
- `D1`: material system (element, crystal structure)
- `D2`: research objective (tensile/compression/shear/etc.)
- `D3`: thermodynamic conditions (temperature, pressure)
- `D4`: boundary and size (PBC strategy, atom count target)
- `D5`: loading parameters (strain rate, direction, timestep)
- `D6`: potential family (EAM/ReaxFF/MEAM/LJ — exact selection is WF-02)
- `D7`: acceptance criteria (quantifiable metrics)
- `locked_decisions`: [D1, D2, ...] confirmed decisions

Coordinator receives the approved `SIMULATION_SCHEME.md` and routes to `lammps-simulation-reasoner` before WF-01.

### reasoner -> coordinator (advisory)

`lammps-simulation-reasoner` evaluates D1-D7 physical reasonableness and writes `work/cases/<slug>/reasoner-assessment.md`. This is advisory only.

Minimum handoff content (from `reasoner-assessment.md`):

- `status`: `physically-sound` | `concerns-identified` | `significant-risks`
- `critical_concerns`: [list of critical-level concerns with citations]
- `advisory_concerns`: [list of medium/low concerns]
- `recommended_actions`: [top 1-3 actionable recommendations]
- `proceed_to_next_stage`: `recommended` | `caution` | `not-recommended`
- `design_root_cause`: `true` | `false` (for repair loop situations)

Coordinator reads `reasoner-assessment.md` and decides whether to pause for revision or proceed.

### librarian -> coordinator / writer / reviewer

- `family`
- `top_examples`
- `potential_candidates`
- `reusable_rules`
- `cautions`
- `confidence`

### input-writer -> reviewer / coordinator

- `files_changed`
- `source_examples`
- `manual_refs`
- `assumptions`
- `risk_points`
- `confidence`
- `self_check_passed_items`
- `review_focus`

### WF-01 packet -> WF-02

- `primary_route`
- `structure_provenance`
- `candidate_case_paths`
- `required_validation`
- `handoff_to_wf02`

### WF-02 packet -> WF-03A

- `selected_potential`
- `potential_candidates`
- `element_mapping`
- `evidence_refs`
- `known_risks`
- `fallback_options`

### WF-03A packet -> execute / repair

- `input_files`
- `source_examples`
- `manual_refs`
- `structure_inputs`
- `potential_inputs`
- `risk_points`
- `review_status`

Execution produces `run-result.json` under `.lammps-project/runs/` so repair/loop can trace back correctly.

### analyst -> coordinator / reviewer

`lammps-data-analyst` writes `analysis-report.json` under `.lammps-project/runs/`. Minimum content:

- `run_id`
- `files_inspected`
- `sections_used`
- `signals`
- `failure_modes`
- `confidence`
- `metrics`
- `d7_validation` (per-criterion comparison with D7 acceptance criteria)
- `literature_comparison` (key metrics vs literature benchmarks)
- `rollback_recommendation` (with `target` when analysis implies returning to `WF-03A`, `WF-02`, or `WF-01`)
- `wf05_trigger`
- `next_actions`

### repair-loop -> coordinator (routing recommendation)

`lammps-repair-loop.ts` produces `next-step.json` under `.lammps-project/runs/`. This is a routing recommendation, not a direct agent invocation. Coordinator reads this and routes to the appropriate agent.

- `repair_packet` (path to repair classification)
- `run_result_path` (path to run-result.json)
- `selected_actor` (routing recommendation: analyst/data-analyst/writer/reviewer/reasoner/coordinator)
- `next_mode` (bounded-auto-fix / failure-analysis / post-run-analysis / execution-setup)
- `bounded_task_prompt`
- `issues`
- `suggested_fixes`
- `auto_advance`
- `rollback_target` (if repair loop recommends rollback)

When `rollback_target` is set and the root cause might be design-level, coordinator also routes to `lammps-simulation-reasoner` to confirm whether the issue originates from a physically unreasonable assumption.

### reviewer -> coordinator

- `decision`: `PASS` | `REVISE` | `BLOCKED`
- `required_next_actor`: `lammps-input-writer` | `lammps-coordinator` | `blocked-user-decision`
- `scope`
- `evidence`
- `manual_refs`
- `case_refs`
- `fatal_issues`
- `major_issues`
- `required_fixes`
- `acceptance_checks`
- `confidence`

## 四、coordinator 约束

- 不要只说“会调用哪个 agent”，应尽可能真的先调用再汇总
- 若未调用子 agent，必须说明原因
- 若 reviewer 返回 `REVISE`，不得当作已完成交付
- 若 reviewer 返回 `BLOCKED`，必须停止推进并回到用户决策或上一步修复
- 每次 reviewer 输出后，coordinator 应通过 `/evidence-validate <stage>.json` 验证证据合规性（由 `src/evidence/evidence-gate.ts` 实现）
- 证据校验失败视同 BLOCKED，不得继续推进到下一阶段
- 若用户明确授权“你自己决定”“无需确认”“自动推进”，coordinator 应进入自治推进模式，但仍必须遵守相同阶段顺序和 reviewer gate
- 自治推进模式下，每个 reviewable stage 必须按以下顺序推进：writer -> reviewer -> 若 `REVISE` 则 writer 修复 -> reviewer 复审 -> 仅在 `PASS` 后进入下一阶段
- 自治推进模式下，coordinator 在调用 writer 前必须冻结当前阶段的核心设定，并在该阶段内保持一致；如 reviewer 要求修改，必须在下一次汇总中明确记录 `decision revision`
- 自治推进模式下，如 writer 声称产物已创建，coordinator 在送审前应确认这些产物实际存在
- 同一阶段若连续三次 `REVISE` 仍未 `PASS`，coordinator 应停止自动推进并报告 `blocked-by-review-loop`
- 每次汇总都要写明：
  - 当前阶段
  - 已调用的 agent
  - 当前状态
  - 下一步

## 五、最小状态词

coordinator 汇总时统一使用：

- `stage`
- `status`
- `agents_used`
- `artifact`
- `next_step`

自治推进模式额外建议输出：

- `frozen_decisions`
- `decision_revisions`

## 六、补充交接包（Team Mode 扩展）

### post-processor -> coordinator

- `case_slug`
- `simulation_type`
- `figures`（生成的图列表，含路径、状态、使用的模板）
- `required_not_generated`（缺失的必需图）
- `validation_issues`（验证失败项）
- `manifest_path`

### repair-loop 补充字段

repair-loop packet 额外包含：

- `generated_at`（生成时间戳）

coordinator 读取 repair-loop 输出后做最终路由决策。

### reviewer 补充字段

reviewer 输出额外包含：

- `mb_checks`（MB-001 至 MB-007 的检查结果）
- `required_next_actor` 增加 `lammps-simulation-architect` 选项

## 七、工作流模式扩展

除了原有的自治推进模式，coordinator 还需响应以下三种工作流模式（通过 `/workflow-guided`、`/workflow-semi`、`/workflow-auto` 或 `/workflow workflow-guided|workflow-semi|workflow-auto` 激活）：

### workflow-guided（引导模式）

- **仅在 WF 阶段边界确认**：每个阶段开始前展示简要计划，用 AskUserQuestion 确认后继续
- **不确认子步骤**：Reviewer 结果仅汇总、参数合理默认值自动决定、文件写入不询问
- 阶段内所有子步骤（审查、修复、agent 调度）自主执行
- 用户可在阶段边界调整方向或中断

### workflow-semi（半自动模式）

- 自主推进，自主决策，遵守相同阶段顺序和 reviewer gate
- 仅在以下情况停下提问：
  - 缺少物理参数且无合理默认值
  - Reviewer 连续 3 次 REVISE（blocked-by-review-loop）
  - 工具执行错误无法自修复
- 不为偏好性问题或低歧义选择停顿
- 完成时汇总所有自动决策供用户事后审查

### workflow-auto（全自动模式）

- **绝不使用 AskUserQuestion**
- 对所有不确定参数使用最佳工程判断
- 遇到工具错误自动修复（repair-loop）
- Reviewer 返回 REVISE 时自动修复并重新提交（最多 3 次，之后报告 blocked-by-review-loop）
- 整个工作流完成后输出一次完整执行报告
- Reviewer gate 仍然存在，但由 coordinator 自动处理

### 各模式共通规则

- 无论哪种模式，都遵守相同阶段顺序（WF-00 → WF-01 → WF-02 → WF-03A → WF-04 → WF-05）
- Reviewer gate 不跳过，但处理方式因模式而异
- 同一阶段连续 3 次 REVISE 未 PASS → 停止并报告 blocked-by-review-loop
- 可通过 `/workflow status` 查看当前模式

### 错误恢复规则（所有模式）

- 工具调用失败和子 agent 错误是正常现象 — 不要放弃工作流
- 遇到任何错误：记录错误 → 诊断原因 → 尝试修复 → **立即继续工作流**
- **绝不**报告错误后等待用户指令 — 永远先尝试自动恢复
- 遇到错误后，下一个 turn 必须主动恢复工作，不得等待用户输入
- 只在以下情况停止工作流：
  - 同一修复尝试连续失败 3 次
  - 真正无法恢复的基础设施问题（磁盘满、网络断开等）
