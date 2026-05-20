# LAMMPS 项目状态管理

本文件定义 LAMMPS 项目的最小状态包规范。

## 一、目录规范

所有可执行算例、派生产物、运行记录与报告默认放在 `work/cases/<case-slug>/` 下，避免散落到仓库其他目录。

建议目录布局：

- `work/cases/<case-slug>/`
- `work/cases/<case-slug>/.lammps-project/`
- `work/cases/<case-slug>/in.*.lmp`
- `work/cases/<case-slug>/log.lammps`
- `work/cases/<case-slug>/figures/`
- `work/cases/<case-slug>/renders/` 或其他派生分析子目录

每个需要持续跟踪的 LAMMPS 项目，推荐在项目根目录创建：

- `.lammps-project/state.md` — **primary tracking file** maintained by coordinator
- `.lammps-project/decisions.md` — locked decisions (D1-D7)
- `.lammps-project/review-log.md` — reviewer history
- `.lammps-project/project.json` — structured state (legacy, maintained for scripts)
- `.lammps-project/execution.json` — LAMMPS command config
- `.lammps-project/wf01.packet.json`
- `.lammps-project/wf02.packet.json`
- `.lammps-project/wf03a.packet.json`
- `.lammps-project/stage-summary.md`
- `.lammps-project/open-issues.md`
- `.lammps-project/error-summary.json`
- `.lammps-project/work-log.md` — **append-only session log** maintained by CLI wrapper and agents
- `.lammps-project/runs/` — run outputs (see Section 二.6)

`SIMULATION_SCHEME.md` lives at `work/cases/<case-slug>/SIMULATION_SCHEME.md` (not in `.lammps-project/`).

## 二、文件职责

### 1. `state.md`

Primary tracking file. Coordinator writes this after every stage transition.

```
# Project State

- current_stage: WF-00 | WF-01 | WF-02 | WF-03A | WF-04 | WF-05
- status: in_progress | blocked | completed
- last_action: <timestamp> - <description>
- next_action: <next step>
- revises_count: { WF-01: 0, WF-02: 0, WF-03A: 0 }  (consecutive REVISE per stage)
- locked_decisions: [D1, D2, ...]
```

### 2. `decisions.md`

保存已经固定下来的选择：

- 势函数选择
- 模板选择
- 结构来源
- 关键边界条件或参数
- D1-D7 locked decisions from `SIMULATION_SCHEME.md`

### 3. `review-log.md`

保存 reviewer 历史结论：

- 审查时间
- 审查范围
- `PASS` / `REVISE` / `BLOCKED`
- 关键问题

### 4. `execution.json`

保存运行层配置：

- 本地 LAMMPS 命令
- Linux 默认命令
- Windows 默认命令
- HPC launcher 前缀
- `-log` 参数风格

### 4a-4c. `wf*.packet.json`

- `wf01.packet.json`: WF-01 structure provenance and modeling handoff
- `wf02.packet.json`: WF-02 potential selection, element mapping, evidence refs
- `wf03a.packet.json`: WF-03A input script handoff (input files, manual refs, risk points, review status)

### 5. `open-issues.md`

保存仍未解决的问题：

- 当前阻塞项
- 风险项
- 待确认假设

### 6. `.lammps-project/runs/`

所有运行产物存于此目录：

| File | Produced by | Content |
|------|-------------|---------|
| `<run-id>.json` | `lammps-execute.ts` | `run-result.json` — execution metadata |
| `<run-id>.repair.json` | `lammps-auto-repair.ts` | Classification of run result |
| `<run-id>.next-step.json` | `lammps-repair-loop.ts` | Routing recommendation for coordinator |
| `<run-id>-analysis.json` | `lammps-data-analyst` | `analysis-report.json` |

### 6a. `work-log.md`

Append-only session log. The CLI wrapper (`lammps-cli.ts`) writes session headers and footers automatically. Agents fill in work summaries.

Every entry follows this structure:

```markdown
## S-YYYYMMDD-HHMMSS

- **timestamp_start**: <ISO>
- **mode**: subcommand | default | interactive | script
- **subcommand**: <name> (if applicable)
- **agent**: <agent name>
- **working_directory**: `<cwd>`
- **prompt_summary**: <first 200 chars>
- **complexity**: simple | complex

<!-- work_summary placeholder: agent may fill this -->

- **timestamp_end**: <ISO>
- **exit_code**: 0

---
```

Agents that fill in the work summary replace the placeholder comment with a `### Work Summary` section containing task-specific fields (see each agent's `## Work log` section).

Log files (`log.lammps`, stdout, stderr) are stored alongside the case files in `work/cases/<case-slug>/`.

## 三、更新规则

- `lammps-coordinator`：优先维护 `state.md` 和 `decisions.md`
- `lammps-coordinator`：每次 stage transition 后更新 `state.md`
- `lammps-coordinator` / execution layer：可读取 `execution.json` 和 `runs/`
- `lammps-coordinator` / stage handoff layers：可读写 `wf*.packet.json`
- `lammps-reviewer`：优先追加 `review-log.md`
- `lammps-auto-repair.ts`：只写 `*.repair.json`，不写任何 state 文件
- `lammps-repair-loop.ts`：只写 `*.next-step.json`，不调用 agent
- `lammps-data-analyst`：写 `analysis-report.json` 到 `runs/`，触发 WF-05 可视化
- `lammps-cli.ts`：自动写 `work-log.md` 的 session header 和 footer
- `lammps-coordinator` / 各子 agent：结束时填充 `work-log.md` 的 work_summary
- 如发现阻塞项：更新 `open-issues.md`
- 如做出关键技术取舍：更新 `decisions.md`

## 四、最小更新原则

- 只有当 `.lammps-project/` 已存在时，agents 才默认读写这些文件
- 若目录不存在，不强制创建，除非用户明确要求初始化项目状态，或 coordinator 在复杂多轮/高风险项目中建议初始化
- 若需要新建算例目录，优先在 `work/cases/<case-slug>/` 下创建，不要把输入脚本、日志、渲染图或阶段状态文件散落到仓库根目录、`demos/` 或其他临时位置
- 更新时优先追加或小改，不做大规模重写
