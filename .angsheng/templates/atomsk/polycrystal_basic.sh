#!/usr/bin/env bash
cat > poly.txt <<'EOF'
box 100 100 100
random 8
EOF

atomsk --create fcc 3.615 Cu seed.xsf
atomsk --polycrystal seed.xsf poly.txt polycrystal.cfg lmp -wrap
