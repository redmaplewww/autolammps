# LAMMPS Embedded Knowledge

This directory embeds the LAMMPS workflow knowledge into this Claude Code project
with minimal changes to the CLI core.

Primary source materials originally came from `lammps-ai/` and its migration
archives, but the active knowledge base is maintained here as merged content.

Knowledge files:

- `simplifications.md` - records deliberate MVP simplifications
- `workflow-stages.md` - WF-01 to WF-05 stage contract
- `case-family-index.md` - normalized case-library categories
- `potential-selection.md` - force-field selection guidance
- `failure-patterns.md` - common LAMMPS failure diagnosis patterns
- `review-guidelines.md` - merged review protocol and risk levels
- `workflow-handoffs.md` - multi-agent handoff contract for the LAMMPS workflow
- `input-template-families.md` - high-risk input template families
- `input-self-check.md` - mandatory self-check before input submission
- `historical-lessons.md` - merged lessons distilled from historical dialogue and review materials
- `session-lessons.md` - distilled reusable rules from historical session archives

Usage rules:

- Agents should consult these summaries first.
- Raw cases remain under `knowledge/cases/raw/` as reference corpus.
- Migration archives are treated as source material only, not as an extra active knowledge source.
- New workflow rules should be added here before changing agent prompts again.
