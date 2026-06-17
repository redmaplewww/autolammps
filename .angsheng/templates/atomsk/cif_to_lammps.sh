#!/usr/bin/env bash
atomsk input.cif -orthogonal-cell tmp.xsf
atomsk tmp.xsf -alignx -unskew output.lmp
