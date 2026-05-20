#!/usr/bin/env bash
atomsk --create fcc 3.615 Cu orient [1-12] [-111] [110] \
  -duplicate 30 20 20 \
  -disloc 0.251*box 0.501*box screw Z Y 2.55674 \
  -select in sphere 0.75*box 0.5*box 0.5*box 15 \
  -remove-atoms select \
  cu_matrix.xsf

atomsk --create fcc 4.085 Ag -duplicate 8 8 8 \
  -shift -0.5*box -0.5*box -0.5*box \
  -select out sphere 0 0 0 15 \
  -remove-atoms select \
  -select none \
  -shift 0.75*box 0.5*box 0.5*box \
  ag_sphere.xsf

atomsk --merge 2 cu_matrix.xsf ag_sphere.xsf cu_ag_dislocation_inclusion.lmp
