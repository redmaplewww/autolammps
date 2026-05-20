#!/usr/bin/env bash
atomsk --create fcc 3.615 Cu orient [-110] [111] [11-2] -duplicate 1 10 1 cu_sf_cell.xsf
atomsk cu_sf_cell.xsf -shift above 0.5*box Y 0.0 0.0 1.476 -wrap cu_isf.lmp
