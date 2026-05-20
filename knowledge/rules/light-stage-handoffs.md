# Lightweight Stage Handoffs (V2)

This file defines the lightweight mainline handoff layer.

Goal:

- standardize what each key stage hands to the next stage
- preserve easy rollback and rework
- avoid heavy workflow locking or rigid state-machine behavior

## Principles

- packets are memory aids and handoff contracts, not hard gates by themselves
- rollback is normal and should be recorded, not treated as an error
- coordinator keeps discretion to loop back when evidence changes
- reviewer remains a quality gate for `WF-00`, `WF-01`, `WF-02`, and `WF-03A`, but packets reduce ambiguity rather than enforce rigid blocking

## Active Packets

- `WF-00`: `work/cases/<slug>/SIMULATION_SCHEME.md`
- `WF-R`: `work/cases/<slug>/reasoner-assessment.md`
- `WF-01`: `.lammps-project/wf01.packet.json`
- `WF-02`: `.lammps-project/wf02.packet.json`
- `WF-03A`: `.lammps-project/wf03a.packet.json`

## New file schemas (V2)

### run-result.json

Written by `lammps-execute.ts` under `.lammps-project/runs/`.

```json
{
  "run_id": "string",
  "launched_at": "ISO timestamp",
  "completed_at": "ISO timestamp",
  "workdir": "string",
  "input": "string",
  "mode": "local | hpc | dry_run",
  "log_path": "string | null",
  "stdout_path": "string | null",
  "stderr_path": "string | null",
  "exit_code": "number | null",
  "status": "completed | failed | dry_run",
  "notes": "string | null"
}
```

### analysis-report.json

Written by `lammps-data-analyst` under `.lammps-project/runs/`.

```json
{
  "run_id": "string",
  "input": "string",
  "files_inspected": ["string"],
  "sections_used": ["string"],
  "key_metrics": {},
  "d7_validation": [
    {
      "criterion": "string",
      "computed_value": "number | null",
      "unit": "string",
      "status": "met | not_met | cannot_compute",
      "deviation": "number | null"
    }
  ],
  "literature_comparison": [
    {
      "metric": "string",
      "literature_source": "string",
      "literature_value": "number | string",
      "computed_value": "number",
      "discrepancy": "string"
    }
  ],
  "anomalies": ["string"],
  "failure_modes": ["string"],
  "confidence": "high | medium | low",
  "next_actions": ["string"],
  "potential_design_issue": false,
  "rollback_target": "WF-03A | WF-02 | WF-01 | null"
}
```

## WF-00 -> WF-R

- Approved `SIMULATION_SCHEME.md` path
- Reviewer decision (PASS)
- D1-D7 decisions summary

## WF-R -> WF-01

- `reasoner-assessment.md` path
- Reasoner status (`physically-sound` / `concerns-identified` / `significant-risks`)
- Any concerns noted for downstream stages

## WF-01 -> WF-02

Minimum handoff content:

- structure provenance
- primary structure file
- structure validation result
- candidate case paths used
- locked assumptions from modeling

WF-02 should not re-infer structure provenance if a WF-01 packet exists.

## WF-02 -> WF-03A

Minimum handoff content:

- selected potential family
- pair style
- pair coeff pattern
- explicit element mapping
- supporting evidence refs
- known risks and fallback options

WF-03A should not silently change potential family or mapping without recording a revision.

## WF-03A -> Execute

Minimum handoff content:

- exact input file paths
- source examples used
- manual refs used
- unresolved assumptions
- current review status

Execution should capture which exact input file was used so repair/loop can trace back correctly.

## WF-04 -> WF-05 (Post-Processor)

When visualization is triggered:

- `WF-04 -> Post-Processor` when `wf05_trigger.generate_plots` is true
- Post-Processor reads: `SIMULATION_SCHEME.md`, `analysis-report.json`, `log.lammps`, `dump.lammpstrj`
- Post-Processor outputs: figures under `work/cases/<slug>/figures/` + `post-processing-manifest.json`
- Post-Processor must read `knowledge/rules/post-processing-standards.md` first

## WF-04 -> Earlier Stages / Reasoner

When analysis discovers a root-cause problem:

- `WF-04 -> WF-03A` when output anomalies are caused by script parameters
- `WF-04 -> WF-02` when analysis indicates force field or potential assumptions
- `WF-04 -> WF-01` when geometry, composition, or boundary assumptions
- `WF-04 -> WF-R (Reasoner)` when `potential_design_issue: true` and root cause may be in D1-D7 design
- `WF-R -> Architect` when Reasoner confirms `design_root_cause: true`

## Rollback Rules

Allowed and normal rollbacks:

- `WF-03A -> WF-02` when potential syntax, mapping, or force-field semantics are wrong
- `WF-02 -> WF-01` when structure source, element ordering, or composition are wrong
- `Execute/Repair -> WF-03A` for bounded script fixes
- `Execute/Repair -> WF-02` when force-field or mapping choice is the root cause
- `Execute/Repair -> WF-01` when geometry or structure provenance is the root cause
- `WF-04 -> WF-03A` when analysis shows the script layer is the main problem
- `WF-04 -> WF-02` when analysis shows the potential layer is the main problem
- `WF-04 -> WF-01` when analysis shows the structure layer is the main problem
- `WF-04 -> WF-R (Reasoner)` when design-level issues are suspected
- `WF-R -> WF-00 (Architect)` when design root cause is confirmed

When rolling back:

- keep the older packet file instead of deleting it
- update the next packet or stage summary with a short `decision revision`
- prefer bounded revisions over full restarts unless the artifact is fundamentally invalid

## Coordinator Rule

The coordinator should use packets to reduce ambiguity, not to force a rigid single-pass workflow.
