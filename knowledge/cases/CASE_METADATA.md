# Case Metadata Convention

The SQLite knowledge index can read an optional `case.metadata.json` file from a
case directory and apply it to all files under that directory.

Supported fields:

```json
{
  "caseName": "Short human-readable case name",
  "family": "reactive-and-deposition",
  "materialSystem": "Ni-C",
  "potentialFamily": "reaxff",
  "stage": "WF-03A",
  "weight": 1.3,
  "reliability": "reviewed",
  "usage": "preferred",
  "aliases": ["NiC", "nickel carbon deposition"],
  "tags": ["deposition", "reactive", "input-script"],
  "summary": "One-sentence description used to improve retrieval."
}
```

Recommended values:

- `family`: use the normalized families from `knowledge/cases/case-family-index.md`
- `materialSystem`: prefer `Element-Element` form, for example `Ga-N-O`
- `potentialFamily`: prefer `eam`, `meam`, `reaxff`, `tersoff`, `hybrid`
- `stage`: use `WF-01` to `WF-05` when a case is stage-specific
- `weight`: retrieval boost, usually `0.5` to `2.0`, where `1.0` is neutral
- `reliability`: prefer `raw`, `usable`, `reviewed`, or `trusted`
- `usage`: prefer `reference`, `template`, or `preferred`

Guidelines:

- Place the file at the highest directory that should share the same metadata.
- Keep `aliases` short and retrieval-oriented.
- Use `summary` for the exact scenario that makes the case reusable.
- Use `weight` only when you have a real reason to bias retrieval.
- Use `preferred` only for cases you want the system to surface early.
- `weight`, `reliability`, and `usage` are used directly by the local knowledge
  ranking logic.
- If a subdirectory needs a different interpretation, add another
  `case.metadata.json` there and it will override the parent directory metadata.

Duplicate-handling guidance:

- If sibling subdirectories contain highly similar or nearly duplicated `in.*`
  files, prefer one shared parent `case.metadata.json` instead of copying the
  same metadata into every child directory.
- Only add child-level metadata when that child represents a meaningful
  retrieval variant, such as a different composition band, loading mode,
  entropy regime, or analysis target.
