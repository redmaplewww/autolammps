#!/usr/bin/env bash
# vacancy -> interstitial -> substitution ordering
atomsk input.xsf \
  -select random 1% Fe -rmatom select \
  -add-atom C random 5 \
  -select random 2% Fe -substitute Fe Cr \
  output.lmp
