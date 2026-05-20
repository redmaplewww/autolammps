# LAMMPS Modeling Workflow

This file defines the first-pass WF-01 modeling control layer.

## Goal

- choose a stable structure source before entering potential setup
- avoid rebuilding structures from scratch when a local case already fits
- use Atomsk only when the structure task actually matches Atomsk strengths

## Entry Point

- CLI wrapper: `bun run lammps model ...`
- underlying script: `scripts/lammps-model-route.ts`
- task packet rendering: `bun run lammps model-render [--packet <wf01.packet.json>]`
- modeling execution: `bun run lammps model-run --script <atomsk.sh> ...`
- structure validation: `bun run lammps model-check --file <structure.lmp>`

## Route Types

- `case-reuse-structure`
- `atomsk-crystal-build`
- `atomsk-cif-conversion`
- `atomsk-polycrystal`
- `atomsk-structure-edit`
- `case-first-manual-fallback`

## Route Policy

Prefer this order:

1. explicit case reuse if a matching raw case structure already exists
2. Atomsk for crystal creation, CIF conversion, polycrystal, orientation, and basic defect editing
3. manual structure preparation only when neither local cases nor Atomsk are suitable

## WF-01 Packet Contract

The modeling route planner writes `.lammps-project/wf01.packet.json` with:

- `primary_route`
- `alternatives`
- `confidence`
- `candidate_case_paths`
- `structure_provenance`
- `required_validation`
- `atomsk_plan` when Atomsk is selected
- `handoff_to_wf02`

## Generated Artifact Layout

- `.lammps-project/wf01.packet.json`
- `.lammps-project/modeling/<run-id>/render.manifest.json`
- `.lammps-project/modeling/<run-id>/run-atomsk.sh`
- `.lammps-project/structure-validation.json`

## Recommended Reuse Index

- `knowledge/cases/structure-index.md`

## WF-01 Validation Checklist

- structure provenance is explicit
- element/type mapping is explicit
- box and boundary assumptions are explicit
- generated structure is compatible with `read_data` or the intended build path
- no silent dependence on guessed element order
- if Atomsk is used, note whether `-alignx -unskew` was needed

## Non-Goals For This First Pass

- no automatic Atomsk command synthesis yet
- no deep structure-physics validation yet
- no full defect-construction engine yet
