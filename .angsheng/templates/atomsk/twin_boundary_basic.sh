#!/usr/bin/env bash
atomsk --create fcc 3.524 Ni orient [11-2] [111] [-110] -duplicate 1 10 1 cell.xsf
atomsk cell.xsf -mirror 0 Y -wrap mirror.xsf
atomsk --merge Y 2 cell.xsf mirror.xsf twin_boundary.lmp
