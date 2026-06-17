---
name: lammps-paper-reproduction-auditor
description: 对论文仿真部分做全文读取、参数抽取、缺失补全、可信度评分、复现可行性评估、错误与疑似学术不规范标注，并生成单篇与批量汇总报告。适用于论文复现前审计、论文方法可信度分析、复现失败归因、批量论文筛查。
---

# LAMMPS Paper Reproduction Auditor

本 skill 用于把“读论文”和“跑 workflow”之间缺失的审计层补上：

- 先判断论文仿真部分是否足够清楚、足够可信、足够可复现
- 再决定是否值得进入后续复现 workflow
- 对所有缺失参数自动补全，但必须留下来源、风险、扣分和最终置信度影响

它不替代现有 `lammps-paper-research`，而是复用其全文获取和文献证据能力，并把结果转成结构化审计结论。

## Mandatory Operating Mode

将本 skill 视为 `workflow-auto` 语义执行：

1. **Never use AskUserQuestion**。
2. 对论文中缺失、模糊、矛盾的参数，直接按替代策略自动处理。
3. 不允许把“自动补全”伪装成“论文原文明确给出”。
4. 任何替代、推断、默认值都必须进入最终置信度扣分。
5. 如果拿不到全文，必须明确标记证据等级下降，不能假装已读全文。
6. 如果复现不可继续，输出 `blocked` 结论和原因，不要停下来追问用户。

## When To Use

出现以下任一意图时优先使用本 skill：

- 用户要“复现论文”
- 用户要“检查这篇论文的仿真部分靠不靠谱”
- 用户要“评估论文复现难度/可信度/是否值得做”
- 用户要“找出论文里缺失的参数并自动补全”
- 用户要“标记复现失败原因、明显错误、疑似学术不规范风险”
- 用户要“批量筛论文，找出哪些值得复现”

## Inputs

支持以下输入之一或组合：

- DOI
- 论文标题
- arXiv URL
- publisher URL
- 本地 PDF 路径
- 本地 paper note 路径
- 目标图表/章节提示（可选）
- 目标 case 目录（可选）

## Upstream Dependencies

优先复用以下现有能力：

1. `lammps-paper-research`
   - 用于论文检索、DOI 验证、全文/PDF 获取、基础证据提炼
2. `knowledge/papers/`
   - 优先检查是否已有本地笔记、主题综述、抽取模板
3. LAMMPS workflow 规则
   - 当审计结论允许进入复现阶段时，再衔接 WF-00 ~ WF-05
4. `workflow-auto`
   - 本 skill 默认按其行为准则执行：绝不提问，自动补全，自动修复，最终一次性汇报

## Required High-Level Workflow

严格按以下阶段执行：

### PR-00 Evidence Acquisition

- 先查本地 `knowledge/papers/`
- 若本地无足够证据，调用 `lammps-paper-research` 获取：
  - metadata
  - DOI verification
  - OA/full-text/PDF availability
  - supplementary availability if possible
- 将每篇论文证据等级标记为：
  - `pdf/full-text`
  - `publisher-page`
  - `abstract-only`
  - `metadata-only`

### PR-01 Reproduction Spec Extraction

从论文中抽取最小可复现规范，至少包含：

- paper metadata
- target claims
- target figures/tables/results
- material system
- force field / potential
- structure and composition
- cell size / atom count
- boundary conditions
- thermostat/barostat / ensemble
- timestep
- run length
- loading path / deformation settings
- analysis metrics
- measurement definitions
- comparison targets

对每个字段同时记录状态：

- `exact`
- `inferred`
- `substituted`
- `missing`

### PR-02 Missing-Parameter Scan

重点扫描以下高风险缺失项：

- 势函数或势文件版本
- 元素顺序 / type mapping
- 初始结构来源
- 晶格常数 / 组分比例
- 盒子尺寸 / 原子数
- 边界条件
- ensemble / thermostat / barostat
- timestep
- run steps / physical time
- 温度 / 压力
- 应变率 / 载荷路径
- dump/thermo 输出定义
- 应力、能量、缺陷统计、RDF、MSD 等测量口径
- 图表后处理方式

### PR-03 Replacement Resolution

不提问，直接按以下优先级补全缺失信息：

1. same paper supplementary
2. same paper appendix / figure caption / footnote
3. same paper other section cross-reference
4. cited prior paper for the exact method
5. same-author same-system prior paper
6. local verified case in `knowledge/cases/`
7. trusted literature benchmark / standard practice
8. potential documentation / OpenKIM / NIST / official source
9. engineering default

每个被补全参数都必须记录：

- `parameter_name`
- `replacement_value`
- `unit`
- `source`
- `source_level`
- `risk_level`
- `reason`
- `impact_on_confidence`

其中：

- `source_level`: `supplement`, `same-paper`, `cited-paper`, `same-author-paper`, `local-verified-case`, `trusted-benchmark`, `official-potential-doc`, `engineering-default`
- `risk_level`: `low`, `medium`, `high`, `critical`

### PR-04 Credibility And Reproducibility Scoring

总分 100，按以下维度评分：

1. `evidence_completeness` 20 分
2. `method_specification` 20 分
3. `parameter_recoverability` 20 分
4. `reproducibility` 15 分
5. `internal_consistency` 15 分
6. `result_verifiability` 10 分

附加扣分项：

- 每个 `engineering-default` 替代：-4 到 -10
- 每个 `critical` 缺失项：-8 到 -15
- 文内明显矛盾：-10 起
- 目标图表不可比对：-5 到 -15
- 全文缺失：至少 -20

输出：

- `overall_score` 0-100
- `grade`
  - `A` = 85-100
  - `B` = 70-84
  - `C` = 50-69
  - `D` = 30-49
  - `F` = 0-29
- `confidence_label`
  - `high`
  - `medium`
  - `low`
  - `blocked`

### PR-05 Error And Risk Tagging

对论文打标签。可多选：

- `full_text_missing`
- `supplement_missing`
- `key_parameter_missing`
- `potential_unspecified`
- `boundary_condition_unspecified`
- `ensemble_unspecified`
- `timestep_unspecified`
- `measurement_definition_missing`
- `figure_target_missing`
- `internally_inconsistent`
- `numerically_implausible`
- `physically_implausible`
- `reproduction_blocked`
- `explicit_error`
- `unsupported_claim`
- `suspected_misconduct`

标注规则：

- `explicit_error`: 只有在论文内部或与其自引证据直接冲突时才能打
- `suspected_misconduct`: 只能在存在较强证据链时打；严禁轻率断言“已证实学术不端”
- 若证据不足，只能写“风险”或“疑点”，不能下最终法律/伦理定性

### PR-06 Final Verdict

必须输出四类结论之一：

- `ready-for-reproduction`
- `reproducible-with-assumptions`
- `partial-only`
- `blocked`

同时写明：

- 是否建议进入后续 LAMMPS workflow
- 如果建议进入，哪些部分可先复现
- 如果不建议进入，阻塞点是什么

## Output Artifacts

单篇论文至少输出到：

- `knowledge/papers/audits/<paper-slug>/reproduction-spec.json`
- `knowledge/papers/audits/<paper-slug>/missing-parameters.json`
- `knowledge/papers/audits/<paper-slug>/credibility-scorecard.json`
- `knowledge/papers/audits/<paper-slug>/issue-tags.json`
- `knowledge/papers/audits/<paper-slug>/audit-report.md`

如果是批量筛查，还要输出：

- `knowledge/papers/audits/summary/reproduction-audit-summary.json`
- `knowledge/papers/audits/summary/reproduction-audit-summary.md`

## Output Schema Requirements

### `reproduction-spec.json`

至少包含：

- `paper_id`
- `title`
- `evidence_level`
- `sections_read`
- `target_artifacts`
- `simulation_spec`
- `field_status`
- `notes`

### `missing-parameters.json`

数组元素至少包含：

- `parameter`
- `status`
- `replacement_value`
- `unit`
- `source`
- `source_level`
- `risk_level`
- `impact_on_confidence`
- `reason`

### `credibility-scorecard.json`

至少包含：

- `paper_id`
- `overall_score`
- `grade`
- `confidence_label`
- `dimensions`
- `missing_parameters_count`
- `substituted_parameters_count`
- `blocked`
- `issue_tags`
- `verdict`

### `issue-tags.json`

至少包含：

- `paper_id`
- `tags`
- `explicit_errors`
- `inconsistencies`
- `misconduct_risks`
- `evidence_notes`

### `audit-report.md`

必须使用以下结构：

```md
# <paper title> - Reproduction Audit

## Verdict
- score:
- grade:
- confidence:
- final_status:

## Evidence Level
- full text status:
- supplementary status:
- sections read:

## Reproduction Scope
- target figures/tables:
- target claims:

## Missing And Replaced Parameters
- ...

## Credibility Scoring
- ...

## Error And Risk Tags
- ...

## Recommended Next Step
- enter workflow / partial-only / blocked
```

## Batch Summary Requirements

批量模式下，汇总报告至少包含：

- total papers audited
- papers by evidence level
- papers by grade
- average score
- median score
- ready-for-reproduction count
- blocked count
- top missing parameter categories
- papers with `explicit_error`
- papers with `suspected_misconduct`
- recommended reproduction shortlist

## Important Boundaries

1. 本 skill 的目标是“可信审计”和“复现可行性评估”，不是代替审稿系统。
2. 对“疑似学术不规范”只能给基于证据的风险标注，不能夸张定性。
3. 如果论文没有足够数值目标，本 skill 可以给出 `partial-only`，不要强装成完整复现就绪。
4. 任何自动补全都必须可追踪、可扣分、可审计。

## Final Answer Contract

最终返回给调用方时，至少包含：

- 论文标题 / 标识
- evidence level
- overall score
- confidence label
- final verdict
- missing parameter count
- substituted parameter count
- highest-risk missing items
- whether workflow should proceed
- artifact paths written

若存在严重问题，还必须额外写出：

- explicit errors found
- suspected misconduct risks
- why confidence was downgraded

## Recommended Invocation Style

推荐由 coordinator 或 architect 在以下模式调用：

- 先切换 `/workflow-auto`
- 再调用本 skill
- 然后根据 `final verdict` 决定是否进入普通 WF-00 ~ WF-05

如果调用方没有显式切到 `/workflow-auto`，本 skill 仍然应按 `workflow-auto` 行为自行执行：不提问、不等待、自动补全、最终统一汇报。
