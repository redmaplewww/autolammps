# LAMMPS Workflow Stages (V3 — Team-Aware)

## Operating modes

### Team Mode (recommended for full workflows)

- Enabled via `bun run lammps team` or `bun run lammps --team`
- Uses `TeamCreate`, `Agent({ team_name, name })`, `SendMessage`, `TaskCreate`/`TaskUpdate`
- Coordinator is team-lead; teammates are spawned on demand
- Communication via `SendMessage` and shared task list
- Scratchpad directory for cross-teammate file passing: `scratchpad/<stage>/`

### Standalone Mode (legacy, default)

- Uses `Agent({ subagent_type })` for one-shot agent dispatch
- File-based state tracking via `.lammps-project/`
- No persistent teammates; state files are the coordination mechanism

## Complete stage order (WF-00 through WF-05)

- `WF-00` Simulation scheme design
- `WF-01` Model setup
- `WF-02` Potential configuration
- `WF-03A` Input script writing
- `WF-04` Data analysis
- `WF-05` Visualization

### About WF-03B

`WF-03B` is **not** a separate workflow stage. It is an **optional branch** of WF-03A for HPC submission. When the user explicitly requests HPC/scheduler submission:
- WF-03A completes with a reviewed input script
- Then invoke the `lammps-hpc-submit` skill for HPC-specific submission configuration
- No additional reviewer gate is required for the HPC step
- HPC config is written to `.lammps-project/hpc-config.json`

## WF-R: Simulation Reasoner (Continuous Advisory)

**Agent**: `lammps-simulation-reasoner`

**Purpose**: Validate that simulation design decisions (D1-D7) are physically sound by cross-referencing literature and experimental data. Participates throughout the workflow.

**Entry points**:

- **Post-WF-00**: After `SIMULATION_SCHEME.md` is approved, before WF-01 begins
- **During repair**: When `lammps-data-analyst` flags a potential design-level issue
- **Post-WF-04**: After `analysis-report.json` is produced, to evaluate whether results match physical expectations
- **On-demand**: Coordinator routes to reasoner whenever physical reasonableness is in question

**Output**: `work/cases/<slug>/reasoner-assessment.md` with per-D1-D7 evaluation, literature comparison, and `proceed_to_next_stage` recommendation.

**Gate**: **Advisory only** — does not block the workflow. Coordinator decides how to act on the assessment.

| Reasoner status | Coordinator action |
|----------------|-----------------|
| `physically-sound` | Proceed normally |
| `concerns-identified` | Note in state, inform user, proceed unless critical |
| `significant-risks` | Inform user of critical risks, let user decide |
| `design_root_cause: true` (repair) | Route to `lammps-simulation-architect` for revision |

**Evidence sources**: `knowledge/papers/`, `knowledge/cases/raw/`, Sem Scholar MCP, Exa MCP.

## WF-00: Simulation Scheme Design

**Agent**: `lammps-simulation-architect`

**Purpose**: Convert vague user goals into a complete, reviewable simulation plan.

**Entry**: User provides a new or partial simulation request without an approved `SIMULATION_SCHEME.md`.

**Output**: `work/cases/<slug>/SIMULATION_SCHEME.md` with D1-D7 decisions.

**Gate**: `lammps-reviewer` must approve before WF-01.

**Exit**: Coordinator receives approved scheme and routes to `lammps-simulation-reasoner` for physical reasonableness review before WF-01.

## WF-01: Model Setup

**Agent**: `lammps-input-writer`

**Purpose**: Build or source the atomic structure.

**Input**: D1 (material), D4 (boundary/size) from `SIMULATION_SCHEME.md`.

**Output**: Structure file (`.data.lmp` or `.lmp`), `wf01.packet.json`.

**Gate**: `lammps-reviewer` must approve before WF-02.

## WF-02: Potential Configuration

**Agent**: `lammps-input-writer`

**Purpose**: Select the interatomic potential and configure pair style/pair coeff.

**Input**: D6 (potential family) from `SIMULATION_SCHEME.md`, structure from WF-01.

**Output**: Potential file, `wf02.packet.json`.

**Gate**: `lammps-reviewer` must approve before WF-03A.

## WF-03A: Input Script Writing

**Agent**: `lammps-input-writer`

**Purpose**: Write the complete LAMMPS input script with ensemble, loading, and output settings.

**Input**: D3 (thermo conditions), D5 (loading) from `SIMULATION_SCHEME.md`, structure + potential from WF-01/02.

**Output**: `in.*.lmp` input script, `wf03a.packet.json`.

**Gate**: `lammps-reviewer` must approve before execution.

**HPC branch**: If user requests HPC, invoke `lammps-hpc-submit` skill after approval.

## WF-04: Data Analysis

**Agent**: `lammps-data-analyst`

**Purpose**: Parse log output, compute metrics, interpret results, validate against D7 criteria and literature.

**Input**: `log.lammps`, `run-result.json`, `SIMULATION_SCHEME.md`.

**Output**: `analysis-report.json` under `.lammps-project/runs/`, rollback recommendation if needed.

**Gate**: No mandatory reviewer gate. Coordinator routes to WF-05 or initiates repair based on analyst output.

**Literature requirement**: `lammps-data-analyst` must cross-reference key metrics with literature benchmarks before finalizing `analysis-report.json`.

## WF-05: Visualization and Post-Processing

**Agent**: `lammps-data-analyst` (via `lammps-visualization` skill)

**Purpose**: Generate plots, structural visualizations, and annotated figures.

**Input**: `analysis-report.json` with `wf05_trigger` fields.

**Output**: Figures under `work/cases/<slug>/figures/`, annotated with D7 comparison values.

**Gate**: No mandatory gate. `lammps-data-analyst` triggers WF-05 when `wf05_trigger.generate_plots` is true.

## Stage outputs

| Stage | Output |
|-------|--------|
| WF-R | `reasoner-assessment.md` |
| WF-00 | `SIMULATION_SCHEME.md` |
| WF-01 | Structure file + `wf01.packet.json` |
| WF-02 | Potential file + `wf02.packet.json` |
| WF-03A | `in.*.lmp` + `wf03a.packet.json` |
| WF-03B | `.lammps-project/hpc-config.json` (optional) |
| WF-04 | `analysis-report.json` under `.lammps-project/runs/` |
| WF-05 | figures under `work/cases/<slug>/figures/` |

## Embedded MVP policy

- The coordinator should preserve stage order.
- WF-00, WF-01, WF-02, and WF-03A require reviewer approval before advancing.
- WF-05 is optional in the MVP.
- WF-01 should use the modeling route planner when structure provenance is not already explicit.
- If the user only asks for analysis, the workflow may start directly at WF-04, but the coordinator should state that it is entering a partial flow.

## Required coordinator behavior

- State current stage explicitly.
- Use librarian retrieval before technical decisions.
- Use the modeling route planner for WF-01 structure-source decisions when needed.
- Route to `lammps-simulation-reasoner` after WF-00 approval (advisory).
- Prefer lightweight stage packets for WF-01, WF-02, and WF-03A when `.lammps-project/` exists.
- Route reviewable artifacts to `lammps-reviewer`.
- Route analysis to `lammps-data-analyst` (WF-04+WF-05).
- Keep answers grounded in local docs, local cases, and user files.
