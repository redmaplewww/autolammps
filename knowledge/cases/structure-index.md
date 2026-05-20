# Structure Index

This is the first-pass reusable structure index for WF-01.

## High-Value Reusable Structures

- `knowledge/cases/raw/Ni基合金拉伸/Ni_45.lmp`
  - family: `tensile-deformation`
  - material: Ni-based alloy
  - reuse note: tensile workflow baseline with existing deformation inputs

- `knowledge/cases/raw/剪切模量/TiAlNb/Ti_poly.lmp`
  - family: `shear-and-elastic`
  - material: Ti-Al-Nb
  - reuse note: good starting structure for TiAlNb shear studies

- `knowledge/cases/raw/TiAl/Ti_48Al_final.data.lmp`
  - family: `shear-and-elastic`
  - material: Ti-Al
  - reuse note: validated LAMMPS data structure with explicit masses and atom types

- `knowledge/cases/raw/磨削/model/texture_218_equil.lmp`
  - family: `grinding-machining-interface`
  - material: machining/grinding substrate
  - reuse note: pre-equilibrated structure useful for interface/machining setup

- `knowledge/cases/raw/NiC/球形沉积/model0.data`
  - family: `reactive-and-deposition`
  - material: Ni-C substrate/deposition base
  - reuse note: reuse before rebuilding reactive deposition geometry from scratch

## Usage Rule

- if one of these structures matches the task closely, prefer case reuse before Atomsk or manual rebuilding
- if no indexed structure fits, use `bun run lammps model ...` to decide the safer route
