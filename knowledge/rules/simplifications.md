# LAMMPS MVP Simplifications

This file records every intentional simplification so the design does not drift.

## Current decisions

1. We do not modify Claude Code core agent loading beyond the existing feature
   flag support already added in `src/entrypoints/cli.tsx`.
2. We do not implement LAMMPS-only service mode, fixed built-in agents, or a
   custom built-in `lammpsAgents.ts` file.
3. We do not add a custom retrieval tool yet. Retrieval is handled by curated
   knowledge docs plus `Read`, `Glob`, and `Grep`, usually through a librarian
   agent.
4. We do not migrate the full OpenClaw runtime layout. We keep curated
   summaries in `knowledge/` and keep raw migration resources inside
   the unified `knowledge/` tree.
5. We do not enforce reviewer gates in code. Reviewer approval is defined in the
   coordinator and reviewer prompts.
6. We do not enable automatic HPC submission. HPC support remains optional and is
   deferred until the embedded workflow is stable.
7. We do not copy the full case library into prompts. Agents should cite raw case
   files on demand from `knowledge/cases/raw/`.
8. We keep the initial team to five practical roles: coordinator, reviewer,
   input-writer, case-librarian, analyst.
9. Visualizer and HPC submitter stay phase-2 roles unless you explicitly ask to
   add them.
10. Vector database integration is postponed. If manual retrieval becomes too
    slow, we can add a retrieval layer later without changing the current agent
    API.

## Why

- This keeps the first embedded version debuggable.
- It minimizes Claude Code core edits.
- It lets project-local agents override user-level agents cleanly.
- It keeps knowledge traceable to migrated source materials inside `knowledge/`.

## Update rule

Whenever we choose a simpler implementation than the handover documents propose,
record it here before moving on.
