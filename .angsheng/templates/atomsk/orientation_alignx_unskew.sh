#!/usr/bin/env bash
atomsk input.xsf -rotate x 20 -rotate y 30 rotated.xsf
atomsk rotated.xsf -alignx -unskew aligned.lmp
