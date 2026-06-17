# Passive Learning Workflow

The LAMMPS agents should learn passively during ordinary work.

## Core rule: buffer first, never write directly to knowledge/

**Coordinator and all workflow agents MUST NOT directly write to
`confirmed-lessons.md` or `pending-lessons.md`.**

All discovered lessons, cases, corrections, and reusable patterns go through
the KB pipeline buffer first. Only after the pipeline processes and approves
them may they enter `knowledge/`.

## Ingestion flow

1. Finish the user-facing work first.
2. Notice repeated mistakes, fragile assumptions, or reliable fixes.
3. Write a raw lesson candidate into the KB pipeline buffer:
   - Path: `.claude/lammps-kb-pipeline/raw/`
   - Format: JSON with fields below.
4. Stop. Do not classify, confirm, or promote the lesson yourself.
5. Later, invoke `lammps-kb-coordinator` to run the full pipeline:
   - raw → curator (classify, dedupe, extract lesson)
   - candidate → reviewer (accept / revise / quarantine)
   - only reviewer-accepted items land in `knowledge/`

## Raw entry format (write to .claude/lammps-kb-pipeline/raw/)

```json
{
  "id": "<uuid>",
  "timestamp": "YYYY-MM-DDTHH:MM:SSZ",
  "source": "coordinator|analyst|reviewer|writer",
  "content_class": "experience|case|error|correction|qa",
  "title": "short descriptive title",
  "body": "full lesson text, situation → mistake/risk → fix/check",
  "evidence_paths": ["path1", "path2"],
  "context": "optional: material system, workflow stage, trigger event",
  "confidence": "high|medium|low"
}
```

## What the coordinator IS allowed to do

- Write raw entries to `.claude/lammps-kb-pipeline/raw/`.
- Ask the user one focused confirmation question when confidence is low.
- Call `lammps-kb-coordinator` to trigger pipeline processing.

## What the coordinator is NOT allowed to do

- Directly append to `confirmed-lessons.md`.
- Directly append to `pending-lessons.md`.
- Promote, classify, or verify lessons without the KB pipeline.
- Bypass the pipeline for any reason including "obviously confirmed."

## KB pipeline agent chain

| Stage | Agent | Action |
|-------|-------|--------|
| Curate | `lammps-kb-curator` | Classify, dedupe, extract reusable lesson |
| Review | `lammps-kb-reviewer` | Accept → promote, Revise → return, Quarantine → reject |
| Promote | `lammps-kb-coordinator` | Write approved items into `knowledge/` |

## Exception handling

- If the KB pipeline is unavailable (no `.claude/lammps-kb-pipeline/` directory),
  the coordinator may fall back to writing raw entries in
  `knowledge/memory/pending-lessons.md` as a temporary measure, but must
  note `pipeline-bypass: true` in the entry and migrate when the pipeline
  is restored.
- This exception does NOT apply when the pipeline directory exists.

## Write-back format for pipeline-approved lessons

After the pipeline promotes a lesson to `knowledge/`, the standard format is:

```text
## [ID] short title
- status: confirmed|pending
- category: review|input|analysis|retrieval|workflow|potential
- lesson: one reusable sentence
- evidence: path1; path2
- note: optional short caution or promotion condition
```
