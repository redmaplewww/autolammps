# LAMMPS Execution Workflow (V2)

This file defines the execution layer for local and future Linux/HPC use.

## Goal

- provide one stable execution interface even when the current machine has no LAMMPS binary
- allow dry-run validation on Windows
- preserve a clean migration path to Linux where `lmp` or `lmp_mpi` becomes available

## Entry Points

- CLI wrapper: `bun run lammps execute --input <in.lmp> [--workdir <dir>]`
- underlying script: `scripts/lammps-execute.ts`
- repair inspection: `bun run lammps repair [--run <run.json>] [--workdir <dir>]`
- underlying repair script: `scripts/lammps-auto-repair.ts`
- repair-loop planning: `bun run lammps loop [--repair <repair.json>] [--workdir <dir>]`
- underlying loop script: `scripts/lammps-repair-loop.ts`

Note: `--invoke` flag has been removed from `loop`. Repair loop only outputs `next-step.json` for Coordinator to route.

## Current Behavior

- if a runnable LAMMPS command is available, the script launches it
- if no runnable command is available, the script records a dry-run execution plan
- all runs write metadata under `.lammps-project/runs/`

## Command Resolution Order

1. `--command "..."`
2. `LAMMPS_COMMAND` environment variable
3. `.lammps-project/execution.json`

## Linux Migration Path

- set `.lammps-project/execution.json` local or linux command to `lmp` or `lmp_mpi`
- or export `LAMMPS_COMMAND="lmp"`
- keep using the same wrapper command: `bun run lammps execute ...`

## Run Artifacts

Each run records:

- execution metadata JSON (`run-result.json`)
- stdout capture
- stderr capture
- resolved log path
- whether the run was `dry_run` or actually launched

## Auto-Repair (V2)

The repair layer does pure classification. It does NOT route or invoke agents.

It does:

- classify the last run as `completed`, `dry_run_only`, `missing_artifact`, `input_syntax_failure`, `runtime_instability`, `bonding_failure`, `numerical_failure`, or generic `runtime_failed`
- generate a repair packet under `.lammps-project/runs/*.repair.json`
- include `run_status` and `wf05_trigger` fields
- suggest the next actor category (for Coordinator to decide)

It does NOT:

- set `requiredNextActor` (removed in V2)
- update project state directly (removed in V2)
- invoke any agent

## Repair-Loop (V2)

The repair loop turns a repair packet into a routing suggestion. It does NOT directly invoke agents.

It does:

- read the latest `.repair.json` packet
- choose the next actor and mode:
  - `execution-setup`
  - `post-run-analysis`
  - `failure-analysis`
  - `bounded-auto-fix`
- build a constrained task prompt for the selected actor
- output `next-step.json` with `run_result_path`, `rollback_target`, and `generated_at` fields

Coordinator reads `next-step.json` and makes the final routing decision.

It does NOT:

- invoke any agent via `claude` CLI (removed in V2)
- accept `--invoke` flag (removed in V2)
- set `requiredNextActor`

## Error Summary Helper

- CLI wrapper: `bun run lammps summarize-error ...`
- underlying script: `scripts/lammps-error-summary.ts`

Purpose:

- append a rollback/error digest into `.lammps-project/stage-summary.md`
- append a concise active issue into `.lammps-project/open-issues.md`
- write `.lammps-project/error-summary.json`

## Non-Goals

- no scheduler submission yet
- no remote SSH execution yet
