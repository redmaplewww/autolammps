# Potential Selection Notes

This summary is derived from the handover docs and the migrated case library.

## Common mappings

- `EAM / eam/alloy`
  - best for metals and many alloys
  - common in: melt/solidify, tensile, segregation, high-entropy alloy cases
- `MEAM`
  - used for directional alloy systems and multi-component metallic systems
  - common files: `library.meam`, material-specific `*.meam`
- `Tersoff`
  - used for SiC and related covalent systems
  - common in machining/interface cases
- `ReaxFF`
  - used for reactive deposition, oxidation, corrosion, NiC/GaN chemistry cases

## Review checklist

- Does `atom_style` match the force field?
- Does `pair_style` match the supplied potential files?
- Are `pair_coeff` element orders aligned with the structure types?
- Is the chosen potential already represented in the local case family?
- Is there a closer example in `knowledge/cases/raw/`?

## MVP policy

- Agents must not invent a force field from memory when a local example exists.
- Agents should cite at least one local case or local knowledge file when making
  a force-field recommendation.
