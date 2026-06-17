# Project-Scale Post-Processing Workflow

Use this workflow when a folder contains many stress/strain files, trajectories, prior figures, and a
markdown checklist of required post-processing.

## Directory contract

Create a new output root instead of overwriting previous results:

```text
06_后处理补充_训练版/
├── scripts/
├── outputs/
├── renders/
├── logs/
├── postprocess_manifest.json
└── POSTPROCESS_REPORT.md
```

Every script written during the task must remain in `scripts/`. Do not rely on notebook cells,
interactive commands, or untracked temporary files.

## Workflow

1. Read the requirement markdown and any audit/checklist files.
2. Inventory input data: stress-strain files, trajectories, initial structures, previous CSVs, previous figures.
3. Build an expected case matrix, for example aging x orientation.
4. Audit existing outputs before recomputing:
   - figure exists, dimensions, byte size
   - CSV row count and required columns
   - unique case coverage
   - redundant/superseded input files
5. Split work into two passes:
   - Lightweight pass: regenerate plots from existing verified CSV/dat files.
   - Heavyweight pass: OVITO trajectory recomputation/renders.
6. Run representative OVITO cases first when full trajectory processing is expensive.
7. Preserve manifests for both passes.
8. Write a final report with coverage decisions and deferred work.

## Manifest fields

Project-level `postprocess_manifest.json` should include:

- `root` and `out_root`
- `scripts`
- audited figures and CSVs
- input stress file mapping
- trajectory inventory and selected effective trajectories
- generated outputs with type, dimensions, rows, and byte sizes
- skipped/deferred items with reasons

## Heavy trajectory rule

For large trajectories, do not block all progress waiting for a full recompute. Provide:

- verified regenerated plots from existing CSVs when trustworthy
- reusable full-analysis script with case selection, stride, frame limit, and resume-safe logs
- representative OVITO renders for user inspection
- clear statement of what remains to run for all cases

## Aging/fracture trajectory workflow learned from Fe-Cu case

For aging/fracture projects with many large LAMMPS trajectories:

1. Build a fixed effective-case map before processing, excluding superseded short runs.
2. Use stress-strain `.dat` files only for frame-to-strain alignment; record that this is approximate
   when trajectories are sparsely dumped.
3. For OVITO defect metrics, save per-case CSVs and then combine them into full-project CSVs.
4. Use a stride and sample limit for tractability, but expose `--stride`, `--sample-limit`, and
   `--force` CLI options for reproducible reruns.
5. For fracture location, combine at least two deterministic signals: Z-density profile and high
   shear-strain atom location. Record both components and the final normalized `Z/Lz` value.
6. For Cu/precipitate interaction, compute nearest-Cu distance bins and average scalar strain in each
   bin; save the binned CSV, not just the figure.
7. Always create representative fracture evidence renders: front/top/side strain maps plus a sliced
   front view for internal localization.

## Output organization for large render campaigns

For multi-case render campaigns, create type-specific directories:

```text
renders_ovito_structured/
├── fracture_global/
├── fracture_local/
├── cna_cu_highlight/
├── cu_dislocation_interaction/
└── manifests/
```

Global comparison views must keep identical size, projection, camera margin, and view direction across
cases. Local crops can have different zoom because their purpose is morphology detail, but they must
not replace the global comparison view.

## Cu-dislocation interaction render rule

For `interaction_*.png` style outputs:

- Hide ordinary Fe atoms.
- Show Cu atoms/clusters with a documented highlight color.
- Show real dislocation lines, not stacking-fault Fe atoms. Prefer OVITO DXA line output for
  crystalline systems. Only use high-shear/non-FCC atom proxies if DXA fails and the fallback is
  explicitly documented.
- Select the correct DXA lattice for the material before rendering. For Fe-Cu BCC matrix systems,
  use `DislocationAnalysisModifier.Lattice.BCC`, not FCC.
- Recompute the camera from the visible Cu atoms plus dislocation-line geometry for every render type.
- For same-type comparison images, pre-scan all visible bboxes and use a fixed fov per view so the
  model size is identical across cases and frames.
- Render multiple time points, e.g. first/middle/last or a fixed interval such as every 20 frames plus
  the final frame.
- Use consistent global scale for comparison and optional local crops near the fracture zone.

## Color and rendering policy

- Preserve default OVITO type colors for simple snapshots.
- Use scalar color maps only for field evidence such as shear strain, CSP, displacement, velocity, or stress.
- Record scalar property and reason in manifests/reports.
- Always render front/side/top for representative evidence images; add extra views when practical.
