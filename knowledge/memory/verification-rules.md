# Lesson Verification Rules

This file defines when a LAMMPS lesson is safe to store as confirmed.

## Authority rule

**Only the KB pipeline reviewer (`lammps-kb-reviewer`) may classify a lesson
as confirmed or pending.** The coordinator and other workflow agents provide
raw candidates with a confidence estimate, but the final verification decision
belongs to the pipeline.

## Raw entry confidence levels (written by coordinator/agents)

When writing to `.claude/lammps-kb-pipeline/raw/`, the source agent assigns a
confidence level:

| Confidence | Meaning | Pipeline action |
|------------|---------|-----------------|
| `high` | Two or more consistent local sources, or user-confirmed | Curator fast-tracks; reviewer still required |
| `medium` | One good source but not independently verified | Curator checks for deduplication; full review |
| `low` | Inferred, single noisy example, or domain-dependent | Curator may quarantine; reviewer decides |

## Confirmed lesson (pipeline reviewer decision)

A lesson is confirmed when the reviewer determines that at least one of the
following is true:

1. It is explicitly confirmed by the user.
2. It is supported by two or more consistent local sources, such as:
   - current project knowledge files
   - local raw case examples
   - observed input/output files from the current task
3. It is a direct correction of an error the agent just made and the
   correction is clearly grounded in local evidence.

## Pending lesson (pipeline reviewer decision)

A lesson must stay pending if any of the following apply:

- it comes from only one noisy or stale example
- it is inferred but not directly supported by a local source
- it depends on a domain assumption that may vary by material system
- it seems plausible but the user has not yet confirmed it

## Writing rules (for pipeline output only)

- Keep lessons short and reusable.
- Prefer pattern form: `situation -> mistake/risk -> fix/check`.
- Always include evidence paths.
- Never store speculative chemistry or force-field claims as confirmed.
- If unsure, the reviewer should keep it pending rather than confirmed.

## Coordinator restrictions

- The coordinator MUST NOT write to `confirmed-lessons.md` or
  `pending-lessons.md` directly.
- The coordinator writes raw entries to
  `.claude/lammps-kb-pipeline/raw/` only.
- The coordinator may ask the user one focused question to resolve
  uncertainty before writing the raw entry.
- If `.claude/lammps-kb-pipeline/` does not exist, fall back to
  `pending-lessons.md` with a `pipeline-bypass: true` note (see
  `learning-workflow.md` for exception handling).
