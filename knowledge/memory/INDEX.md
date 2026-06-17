# Knowledge Memory Index

This directory is the LAMMPS workflow memory layer. It is split into small,
purpose-specific files so agents can retrieve only the knowledge they need.

## Files

### Memory Layer (`knowledge/memory/`)

| File | Size | Purpose | Read policy |
| --- | --- | --- | --- |
| `core-checks.md` | ~5KB | Compact CL-001..CL-019 operational guardrail index | Always read for reviewer/input-writer gates |
| `confirmed-lessons.md` | ~20KB | Detailed confirmed operational lessons and evidence | Read by CL ID only after `core-checks.md` triggers, preferably through MCP search |
| `metal-research-insights.md` | ~48KB | Literature-derived metal MD design and mechanism insights | Read/search for WF-00 design and WF-01 literature synthesis only |
| `pending-lessons.md` | ~10KB | Unconfirmed lessons awaiting promotion | Search only when a known unresolved issue matches |
| `historical-lessons.md` | ~2KB | Legacy distilled lessons | Search only when current confirmed lessons are insufficient |
| `session-lessons.md` | ~4KB | Distilled historical session themes | Search only for broad workflow recovery |
| `verification-rules.md` | ~3KB | Lesson promotion standards | Read by KB pipeline agents |
| `learning-workflow.md` | ~3KB | Raw -> curate -> review -> promote process | Read by KB pipeline/coordinator agents |

### Rules Layer (`knowledge/rules/`)

| File | Size | Purpose | Read policy |
| --- | --- | --- | --- |
| `learned-rules.md` | ~6KB | 8 modeling templates (wetting, loading, DPD, ReaxFF, surface tension, diffusion, shock, graphene) + PL-009 safety rule | MCP search by template type; direct read only when selecting a template |
| `workflow-stages.md` | — | WF-00..WF-06 stage definitions | Read by coordinator/architect |
| `review-guidelines.md` | — | Review pass criteria | Read by reviewer |
| `mandatory-checks.md` | — | Non-negotiable pre-submit checks | Read by reviewer |
| `failure-patterns.md` | — | Known failure patterns and diagnostics | MCP search by error/symptom |
| `potential-selection.md` | — | Potential function selection guide | MCP search by material/potential |

## Agent Routing

| Agent | Required memory read | MCP-first retrieval targets | Avoid |
| --- | --- | --- | --- |
| `lammps-reviewer` | `core-checks.md` | `confirmed-lessons.md` by CL ID; manuals/cases by command/topic | Full `confirmed-lessons.md` unless MCP unavailable |
| `lammps-input-writer` | `core-checks.md` | templates, validated cases, CL details by triggered risk | Writing commands from memory |
| `lammps-simulation-architect` | none always | cases, papers, `metal-research-insights.md`, workflow rules | Reviewer-only operational detail unless relevant |
| `lammps-case-librarian` | none always | SQLite FTS over all knowledge tiers | Returning raw long files |
| `lammps-kb-*` | `learning-workflow.md`, `verification-rules.md` | raw/candidate KB pipeline entries | Direct promotion without review |

## Retrieval Discipline

1. Use `lammps-knowledge` MCP search before reading large memory files.
2. Read `core-checks.md` directly because it is compact and safety-critical.
3. Search detail by stable IDs (`CL-007`, `CL-011`, etc.) or by stage/topic.
4. Treat `metal-research-insights.md` as design knowledge, not a reviewer gate checklist.
5. If MCP is unavailable, fall back to narrow file reads and report the MCP gap.

## Common Queries

```text
search_lammps_knowledge query="CL-014 equilibration before loading" source_tier="memory"
search_lammps_knowledge query="HEA deformation mechanism class" source_tier="memory"
search_lammps_knowledge query="fix deform npt same direction tensile" source_tier="rule"
search_lammps_knowledge query="ReaxFF qeq pair_coeff element order" source_tier="memory"
search_lammps_knowledge query="wetting template wall freeze NVT" source_tier="rule"
search_lammps_knowledge query="mechanical loading EAM stress atom" source_tier="rule"
search_lammps_knowledge query="surface tension stress ave spatial gamma" source_tier="rule"
```
