# LAMMPS Agent Team Template

This template defines the agent team configuration for LAMMPS workflow orchestration.

## Team Structure

- **team-lead**: `lammps-coordinator` (常驻)
  - Pure routing and state tracking
  - Uses `TeamCreate`, `Agent`, `SendMessage`, `TaskCreate`, `TaskUpdate`, `TaskStop`
  - Never writes scripts, analyzes logs, or makes technical decisions

- **按需 spawn 的 teammates** (通过 `Agent({ team_name, name })` 创建):

| Teammate Name   | Agent Type                    | Spawn 时机                          | Stage    |
|-----------------|-------------------------------|-------------------------------------|----------|
| `architect`     | `lammps-simulation-architect` | WF-00 方案设计                      | WF-00    |
| `reasoner`      | `lammps-simulation-reasoner`  | WF-R 物理合理性审查                  | WF-R     |
| `writer`        | `lammps-input-writer`         | WF-01/WF-02/WF-03A 输入生成         | WF-01-03A|
| `reviewer`      | `lammps-reviewer`             | 每个 review gate                    | Gates    |
| `analyst`       | `lammps-data-analyst`         | WF-04 数据分析                      | WF-04    |
| `postprocessor` | `lammps-post-processor`       | WF-05 可视化                        | WF-05    |
| `librarian`     | `lammps-case-librarian`       | 按需检索                            | Any      |
| `paper-researcher` | `lammps-paper-researcher`  | 按需文献检索                        | Any      |

## Backend

- **in-process**: AsyncLocalStorage 隔离，共享 MCP 连接

## Communication

- `SendMessage` 用于 coordinator → teammate 指令传递
- `TaskCreate/TaskUpdate` 用于任务分配和进度跟踪
- `task.blocks/blockedBy` 用于 review gate 同步阻塞
- Scratchpad 用于跨 teammate 的持久化知识共享

## Lifecycle

1. `bun run lammps team` 或 `bun run lammps --team` 启动
2. Coordinator 自动执行 `TeamCreate({ team_name: "lammps" })`
3. 按 workflow 阶段按需 spawn teammates
4. Review gate 通过 `task dependency` 实现同步阻塞
5. 阶段完成后 `SendMessage({ type: "shutdown_request" })` 关闭 teammate
6. 会话结束时 `TeamDelete` 清理
