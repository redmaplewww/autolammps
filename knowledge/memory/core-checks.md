# LAMMPS Core Checks Index

This file is the compact, always-read guardrail layer for `lammps-reviewer` and
`lammps-input-writer`. It is an index, not the full memory store.

Usage:

1. Read this file before WF-00/WF-01/WF-02/WF-03A review or high-risk input writing.
2. Apply every triggered check below.
3. If a check triggers and more detail is needed, use `lammps-knowledge` MCP search
   against the cited CL ID or read the matching entry in `confirmed-lessons.md`.
4. Do not read the full `confirmed-lessons.md` unless multiple triggered checks require
   detailed evidence that MCP cannot retrieve.

Severity:

- `BLOCKED`: violation must stop the workflow until fixed.
- `HIGH`: violation normally requires REVISE/BLOCKED unless strong evidence proves safe.
- `STANDARD`: required review item; use REVISE when unresolved.

## BLOCKED checks

| ID | Trigger | Required check |
| --- | --- | --- |
| CL-003 | Fixed, frozen, substrate, or boundary-constrained atoms exist | Velocity initialization must exclude fixed/frozen groups. Do not use broad `velocity all` when immobile atoms exist. |
| CL-013 | Any `boundary f` fixed non-periodic face | Mobile atoms must not start directly adjacent to the fixed face; add vacuum buffer or fixed substrate layer. |
| CL-014 | Tensile, compression, shear, indentation, scratch, cutting, shock, or other loading | Full equilibration must happen before loading or boundary constraints: build free structure, minimize, NPT/NVT stabilize, verify T/P/E, then apply loading constraints. |
| CL-015 | Multi-stage handoff uses `read_restart` / `write_restart` | Prefer `write_data` / `read_data` for stage handoff. Restart files carry fix/group/integration state and can silently corrupt later stages. |
| CL-017 | Writing uncertain LAMMPS command syntax | Consult official LAMMPS documentation before writing commands that are not fully certain, especially uncommon commands. |
| CL-018 | WF-01 model must realize a target physical goal | Built model must include every critical physical feature from D2.1 required_features. Missing core research objects is BLOCKED. |

## HIGH checks

| ID | Trigger | Required check |
| --- | --- | --- |
| CL-001 | ReaxFF / reax/c / reaxff input | Atom style must support charge and input must include a valid ReaxFF QEq fix such as `fix qeq/reaxff` or `fix qeq/shielded`. |
| CL-007 | Engineering strain or stress-strain output | Freeze the reference box length at the NPT-to-deform transition; do not use a dynamic equal-style variable tracking `lx`. |
| CL-009 | Deposition case migration or reused deposition geometry | Recalculate deposit region bounds from the new geometry and verify the mobile region covers the true growing surface. |
| CL-010 | ReaxFF `pair_coeff` element list | Element names must match data-file atom types in order and exist in the ffield file. |
| CL-011 | `fix deform` and `fix npt` appear in a deformation workflow | Barostat must not control the deforming direction; for fracture curves prefer NVT + `fix deform`. |
| CL-016 | Trajectory analysis reports atoms at box max with periodic boundary | Check boundary wrapping before diagnosing explosion; use unwrapped coordinates or periodic-aware analysis. |
| CL-019 | WF-04 or production runtime analysis | Add and analyze per-atom structural health diagnostics before macroscopic metrics: pe/atom, coordination, centro/CNA/PTM as appropriate. |

## STANDARD checks

| ID | Trigger | Required check |
| --- | --- | --- |
| CL-002 | Generated LAMMPS script is used | Treat generated input as draft until `lammps-reviewer` passes it. |
| CL-004 | `delete_atoms overlap` appears | Keep threshold narrow and avoid broad `all all` deletion on sensitive structures. |
| CL-005 | Execution success is used as acceptance | Define task-specific acceptance criteria; completed run alone is not sufficient. |
| CL-006 | Continue from restart/data or intermediate model | Verify source, generation time, box dimensions, and intended provenance before continuing. |
| CL-008 | High-risk input file generation | Search validated local examples/templates before writing from memory. |
| CL-012 | NPT equilibration before `fix deform` | Add a short diagnostic checkpoint that outputs dimensions and pressure to verify plateau before deformation. |

## Domain routing hints

- ReaxFF / reactive: CL-001, CL-010, plus `knowledge/rules/potential-selection.md`.
- Tensile / deformation: CL-007, CL-011, CL-012, CL-014.
- Deposition / interface / surface: CL-004, CL-009, CL-013.
- Multi-stage workflows: CL-006, CL-015.
- Goal consistency and runtime health: CL-018, CL-019.
- Command syntax: CL-017 and official LAMMPS docs.

## Retrieval examples

Use MCP first for details:

```text
search_lammps_knowledge query="CL-007 engineering strain freeze reference length" source_tier="memory"
search_lammps_knowledge query="fix deform npt same direction CL-011" source_tier="memory"
search_lammps_knowledge query="boundary f lost atoms CL-013" source_tier="memory"
```

Fallback only if MCP is unavailable: read `confirmed-lessons.md` and locate the
matching CL entry by ID.
