# Current LAMMPS Agent Implementation Summary

This file records the current implementation method of the embedded LAMMPS agent
system in this Claude Code repository.

## 1. Implementation approach

The current LAMMPS system is embedded into Claude Code with project-local
configuration, not with a custom forked agent runtime.

Current method:

- use Claude Code's existing markdown agent loading mechanism
- place project agents under `/.claude/agents/`
- place project knowledge under `/knowledge/`
- keep source migration materials under `lammps-ai/`
- let agents use existing Claude Code tools for retrieval and execution

This means the LAMMPS system currently depends on Claude Code's built-in support
for:

- project agents
- user agents
- tool calling
- file reading/searching
- agent delegation

## 2. Current agent roster

Project-local LAMMPS agents are defined in `/.claude/agents/`.

### `lammps-coordinator`

File:

- `/.claude/agents/lammps-coordinator.md`

Role:

- top-level workflow coordinator
- manages staged LAMMPS workflow progression
- delegates to other LAMMPS agents
- enforces review checkpoints through prompt rules

Current settings:

- `model: sonnet`
- `color: green`
- `permissionMode: acceptEdits`
- `maxTurns: 120`

Delegation targets:

- `lammps-reviewer`
- `lammps-input-writer`
- `lammps-case-librarian`
- `lammps-analyst`

### `lammps-reviewer`

File:

- `/.claude/agents/lammps-reviewer.md`

Role:

- review gate for model setup, potential choice, and input scripts
- used to approve or reject `WF-01`, `WF-02`, and `WF-03A`

Current settings:

- `model: sonnet`
- `color: blue`
- `maxTurns: 80`

### `lammps-input-writer`

File:

- `/.claude/agents/lammps-input-writer.md`

Role:

- create or revise LAMMPS input artifacts
- adapt local examples into usable scripts

Current settings:

- `model: sonnet`
- `color: yellow`
- `permissionMode: acceptEdits`
- `maxTurns: 100`

### `lammps-case-librarian`

File:

- `/.claude/agents/lammps-case-librarian.md`

Role:

- retrieval specialist for knowledge docs and raw case library
- finds matching case families, examples, potentials, and workflow hints

Current settings:

- `model: sonnet`
- `color: cyan`
- `maxTurns: 60`

### `lammps-analyst`

File:

- `/.claude/agents/lammps-analyst.md`

Role:

- analyze `log.lammps`, thermo data, stress-strain outputs, and failure signs

Current settings:

- `model: sonnet`
- `color: magenta`
- `maxTurns: 100`

## 3. Agent loading behavior

The LAMMPS agents are loaded as project agents by Claude Code.

Important behavior:

- project agents in `/.claude/agents/` are loaded automatically
- project agents can override user agents with the same name
- this is already happening for `lammps-coordinator`

The current implementation does not register LAMMPS agents as Claude Code
built-in agents.

## 4. Current knowledge base logic

The knowledge layer is split into two parts.

### Curated project knowledge

Directory:

- `/knowledge/`

Current files:

- `/knowledge/README.md`
- `/knowledge/simplifications.md`
- `/knowledge/workflow-stages.md`
- `/knowledge/case-family-index.md`
- `/knowledge/potential-selection.md`
- `/knowledge/failure-patterns.md`
- `/knowledge/review-guidelines.md`
- `/knowledge/historical-lessons.md`
- `/knowledge/session-lessons.md`
- `/knowledge/experience/README.md`
- `/knowledge/experience/verification-rules.md`
- `/knowledge/experience/learning-workflow.md`
- `/knowledge/experience/confirmed-lessons.md`
- `/knowledge/experience/pending-lessons.md`
- `knowledge/memory/README.md`
- `knowledge/memory/verification-rules.md`
- `knowledge/memory/learning-workflow.md`
- `knowledge/memory/confirmed-lessons.md`
- `knowledge/memory/pending-lessons.md`

Purpose:

- provide short, stable, high-signal guidance
- normalize the case library into reusable categories
- define workflow stage rules
- define current implementation boundaries
- keep migration-derived rules merged into the active knowledge base instead of
  exposing migration classifications as a separate searchable layer
- provide a split memory model for confirmed and pending lessons
- separate curated knowledge from live writable lesson memory

### Raw migration source materials

Directory:

- `lammps-ai/`

Purpose:

- preserve the original handover docs
- preserve migration notes and case-library source materials
- serve as the raw corpus that agents can inspect when needed

Important raw source area:

- `knowledge/cases/raw/`

This raw case library is not directly embedded into prompts. Instead, agents are
expected to:

1. read the curated knowledge files first
2. identify the best case family
3. search the raw case tree for matching examples
4. cite or adapt those examples carefully

## 5. Current knowledge flow used by agents

The intended logic is:

1. `lammps-coordinator` identifies the current workflow stage
2. `lammps-case-librarian` retrieves local evidence
3. `lammps-input-writer` or `lammps-analyst` performs the task
4. `lammps-reviewer` gates reviewable stages
5. `lammps-coordinator` reports state and next step to the user

In practice, the first files agents are expected to consult are:

- `/knowledge/case-family-index.md`
- `/knowledge/workflow-stages.md`
- `/knowledge/potential-selection.md`
- `/knowledge/failure-patterns.md`
- `/knowledge/historical-lessons.md`
- `/knowledge/session-lessons.md`
- `/knowledge/experience/confirmed-lessons.md`
- `/knowledge/experience/pending-lessons.md`

Passive learning logic:

- agents should consult `knowledge/memory/verification-rules.md` before storing a new lesson
- verified lessons go to `knowledge/memory/confirmed-lessons.md`
- suspicious or single-observation lessons go to `knowledge/memory/pending-lessons.md`
- user confirmation may be requested when it would safely resolve uncertainty

Then they may search:

- `knowledge/cases/raw/`
- `lammps-ai/*.md`

## 6. Current workflow architecture

The workflow model follows the handover docs but is currently prompt-enforced,
not code-enforced.

Current workflow stages:

- `WF-01` model setup
- `WF-02` potential configuration
- `WF-03A` input script writing
- `WF-03B` HPC submission
- `WF-04` data analysis
- `WF-05` visualization

Current implementation rule:

- `WF-01`, `WF-02`, and `WF-03A` should pass `lammps-reviewer` before advancing

Current limitation:

- this is implemented by agent prompt instructions, not by hard-coded runtime
  logic in Claude Code

## 7. Current architecture diagram

```text
User
  |
  v
lammps-coordinator
  |
  +--> lammps-case-librarian
  |
  +--> lammps-input-writer
  |
  +--> lammps-reviewer
  |
  +--> lammps-analyst
  |
  v
Local knowledge + raw case library

/knowledge/
  +
/knowledge/experience/
  +
knowledge/memory/
  +
knowledge/cases/raw/
```

## 8. Tools and execution model

The current LAMMPS system uses Claude Code's existing tool model.

It does not currently add a dedicated LAMMPS retrieval tool.

The effective working method is:

- retrieve by `Read`, `Glob`, `Grep`
- inspect or execute by existing Claude Code tools
- coordinate sub-work via Claude Code agent delegation

## 9. Supporting runtime changes currently present

There is one earlier runtime support change already present in this repo:

- `src/entrypoints/cli.tsx` now reads feature flags from
  `C:/Users/1/.claude/features.json`

Current feature file:

- `C:/Users/1/.claude/features.json`

Purpose:

- allow toggling existing Claude Code features without additional core edits

There is also an environment-level compatibility fix already in use:

- `CLAUDE_CODE_USE_NATIVE_FILE_SEARCH=1`

Reason:

- user/project markdown agents were not loading correctly on this Windows setup
  unless native file search was enabled

## 10. Known current implementation state

What is implemented now:

- project-local LAMMPS agent team
- project-local LAMMPS knowledge summaries
- project-local experience memory with confirmed and pending lesson areas
- live writable lesson memory under `knowledge/memory/`
- project agent loading verified
- project `lammps-coordinator` successfully overrides user-level version
- smoke tests for `lammps-coordinator` and `lammps-case-librarian` passed

What is not implemented yet:

- fixed LAMMPS-only service mode
- code-level review gates
- dedicated retrieval service or vector DB integration
- embedded HPC submitter
- embedded visualizer
- case-library-derived workflow templates beyond current summaries
- automated runtime hook for lesson recording outside prompt-driven behavior

## 11. Source materials used for the current implementation

Primary handover sources:

- `knowledge/source/handover/lammps-handover.md`
- `knowledge/source/handover/lammps-handover-index.md`
- `knowledge/source/handover/lammps-agents-detail-1.md`
- `knowledge/source/handover/lammps-agents-detail-2.md`
- `knowledge/source/handover/lammps-agents-detail-3.md`
- `knowledge/source/handover/lammps-integration-steps.md`
- `knowledge/source/handover/migration-guide.md`
- `knowledge/source/handover/package-manifest.md`
- `knowledge/cases/raw/INDEX.md`

## 12. Maintenance rule

Whenever the LAMMPS system changes, update this file to reflect:

- current agents
- current knowledge layout
- current runtime dependencies
- current workflow enforcement method
- current verified status
