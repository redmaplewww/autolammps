# Agent Self-Evolution Baseline

Status: baseline design v0.2
Date: 2026-05-26
Scope: controlled self-evolution for project agents, especially the LAMMPS workflow agents

## 1. Purpose

The current system already supports knowledge sedimentation: memories, work logs, review logs, auto-memory extraction, and auto-dream consolidation. This document defines the next layer: agent self-evolution.

Self-evolution means the system can inspect historical work, identify agent behavior problems, create improvement proposals, and test candidate agent definitions. In the current baseline, the preferred self-evolution target is **context optimization**, not adding more agent rules.

Context optimization means using less, sharper, more task-matched context while preserving auditability and reviewer gates. The goal is to reduce irrelevant lesson loading, avoid prompt bloat, and keep final-result reliability anchored in artifacts and review decisions.

## 2. Non-Negotiable Safety Rule

Self-evolution must never directly modify active agent definitions, core prompts, workflow rules, or production knowledge files.

Forbidden without human review:

- Editing `.angsheng/agents/*.md`
- Editing `ANGSHENG.md`
- Editing `knowledge/rules/*.md`
- Editing active workflow commands, hooks, or feature flags
- Promoting self-evolution proposals into production behavior

Allowed automatically:

- Read transcripts, work logs, review logs, and agent definitions
- Generate diagnostic reports
- Generate proposal JSON/Markdown files
- Generate candidate copies of agent definitions under a proposal directory
- Generate derived context indexes and context-pack proposals
- Run offline checks or replay tests against those candidate copies

Human review is the release gate. A proposal may be applied only after a person inspects the proposal, validates the candidate copy, and explicitly asks the coding agent to apply it.

## 3. Current Baseline

Existing mechanisms:

- `extractMemories`: extracts durable memories from recent conversation turns.
- `autoDream`: consolidates memories across sessions.
- `project-memory/`: records current project state, decisions, reviews, and work logs.
- Agent memory: agent definitions can opt into `memory: user|project|local`.
- LAMMPS KB pipeline: raw lessons should enter a buffer before promotion.

Gap:

- These systems remember facts and lessons, but do not evaluate agent behavior.
- Static agent prompts in `.angsheng/agents/*.md` do not evolve unless manually edited.
- Reviewer and workflow failures are not yet transformed into structured agent-improvement proposals.

## 4. Target Architecture

The self-evolution loop has six layers.

### Layer 1: Evidence Collection

Read-only inputs:

- `project-memory/work-log.md`
- `project-memory/review-log.md`
- `project-memory/decisions.md`
- `.angsheng/projects/<project>/**/*.jsonl`
- `.angsheng/agents/*.md`
- Optional: `knowledge/reports/*.md`

Evidence should be stored as references, not copied wholesale into proposals.

### Layer 2: Behavior And Context Evaluation

Compute per-agent signals:

- Stages handled
- PASS / REVISE / BLOCKED / FAIL counts
- Repeated issue patterns
- Rollback causes
- Recovery success
- Evidence of role-boundary violations
- Token/time hotspots where available
- Broad memory files loaded where a small lesson card would suffice
- Agent prompts that accumulate generic rules instead of task-scoped context

The first implementation is heuristic and local-file based. Later versions may use a reviewer agent to grade the evidence.

### Layer 3: Proposal Generation

Generate proposal files under:

```text
agent-improvement-proposals/YYYY-MM-DDTHH-mm-ss/
```

Each proposal must include:

- `id`
- `target_agent`
- `proposal_type`
- `risk_level`
- `observed_problem`
- `evidence_paths`
- `proposed_change`
- `predicted_impact`
- `validation_plan`
- `human_review_required: true`
- `auto_apply_allowed: false`

### Layer 4: Candidate Copies

When requested, generate candidate copies under:

```text
agent-improvement-proposals/<run-id>/candidate-agents/<agent>.md
```

Candidate copies may include proposed changes or TODO markers, but the active `.angsheng/agents/*.md` files must remain unchanged.

### Layer 5: Offline Validation

Validation should use replay or benchmark tasks before any production prompt change:

- Compare original agent vs candidate copy.
- Measure review rounds, runtime failures, rollback frequency, and final outcome quality.
- Reject changes that improve one case by hard-coding a brittle rule.

### Layer 6: Human-Gated Apply

Only a human may approve applying a proposal. The apply step must:

- Reference the proposal ID.
- Show the exact diff.
- Update a changelog.
- Preserve rollback instructions.
- Run relevant tests or smoke checks.

## 5. Initial Implementation Scope

The v0.1 implementation provides a read-only audit script:

```bash
bun run self-evolve:audit
```

Outputs:

- `project-memory/agent-evolution-report.md`
- `agent-improvement-proposals/<run-id>/proposals.json`
- `agent-improvement-proposals/<run-id>/proposals.md`
- Optional candidate copies when `--materialize-copies` is passed

It does not modify active agents.

## 6. Proposal Categories

Recommended categories:

- `context-optimization`: reduce context while preserving evidence coverage
- `context-index`: generate a derived index so agents retrieve small lesson cards instead of full memory files
- `context-pack`: prepare task-scoped evidence bundles for a stage or agent
- `benchmark`: add replay cases to measure context reduction and quality preservation

Avoid defaulting to `prompt-rule` or `review-check`. More rules can make work slower and more brittle unless an offline replay proves they improve outcomes.

## 7. Agent-Specific Strategy

### lammps-input-writer

Primary target for context-pack optimization during generation.

Good proposal triggers:

- Reviewer REVISE due to syntax mistakes
- Scheme mismatch
- Wrong LAMMPS command ordering
- Repeated packet inconsistency

Preferred improvement type:

- Provide a compact context pack: top 3-5 matched lessons, 1 matching local case, exact manual refs.
- Avoid loading entire `confirmed-lessons.md` or `pending-lessons.md` unless the task is explicitly knowledge curation.
- Keep reviewer gate as the correctness guarantee.

### lammps-reviewer

Primary target for trigger-gated evidence context.

Good proposal triggers:

- Runtime failure that reviewer could have caught
- Repeated syntax class not in mandatory checks
- Missing evidence requirements

Preferred improvement type:

- Always load mandatory-check index.
- Load command-matched lesson excerpts and manual refs only.
- Keep pending lessons advisory unless their trigger terms match the artifact.

### lammps-coordinator

Primary target for result-only context passing.

Good proposal triggers:

- Late discovery of design-level issue
- Wrong rollback target
- Missing reasoner route
- Excessive user-facing progress spam in workflow-auto

Preferred improvement type:

- Pass RESULT blocks and compact context digests, not full evidence chains.
- Store long evidence in files and pass paths or IDs forward.
- Preserve pure delegator boundaries.

### lammps-simulation-architect / reasoner

Targets for staged WF-00 context loading.

Good proposal triggers:

- Design root cause confirmed after failed run
- Missing physics check
- Bad default parameters

Preferred improvement type:

- Start from D1-D7 schema and nearest cases.
- Add literature benchmarks second.
- Add narrow lesson cards only when risk triggers match.

## 8. Acceptance Criteria

A self-evolution proposal is acceptable only if:

1. It cites concrete evidence paths.
2. It targets the correct agent or rule file.
3. It is not merely a restatement of a one-off failure.
4. It includes a validation plan.
5. It predicts context-size or workflow-complexity impact.
6. It does not bypass human review.
7. It does not directly alter active behavior.

## 9. Rejection Criteria

Reject proposals that:

- Overfit to one material system or one user request.
- Add broad vague wording like "be more careful" without a checkable behavior.
- Move technical responsibility into the coordinator.
- Remove reviewer gates.
- Increase autonomy beyond the human-review rule.
- Suggest direct edits to active agent definitions without candidate-copy testing.
- Add more checklist or prompt text without a measurable context or quality benefit.
- Make the workflow more complex without reducing context, failures, or review rounds.

## 10. Development Roadmap

### P0: Read-only audit and proposal generation

- Implement `scripts/agent-self-evolution-audit.ts`.
- Generate reports and context-optimization proposals only.
- Enforce `auto_apply_allowed: false` in every proposal.

### P0.5: Derived lesson index

- Generate a derived lesson index with trigger terms and target agents.
- Do not replace source memory files.
- Use the index only to build compact context packs.

### P1: Candidate copy materialization

- Add `--materialize-copies` to copy target agent files into the proposal run directory.
- Insert proposed change notes into candidate copies without touching active files.

### P2: Proposal reviewer

- Add an `agent-evolution-reviewer` agent or script.
- Validate proposal quality and overfitting risk.

### P3: Replay benchmark

- Convert historical work logs into replay tasks.
- Compare original vs candidate agent prompts.

### P4: Human-gated apply helper

- Add a script that can show diffs for an approved proposal.
- The script should require an explicit proposal ID and never run automatically.

## 11. Baseline Policy

For this project, self-evolution is advisory by default:

```text
diagnose -> propose context optimization -> copy/index-for-test -> validate -> human review -> explicit apply
```

There is no automatic production modification path.
