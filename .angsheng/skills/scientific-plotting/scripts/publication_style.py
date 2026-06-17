"""Reusable matplotlib style helpers for publication-quality scientific plots."""

from __future__ import annotations

from pathlib import Path

import matplotlib as mpl
from cycler import cycler


OKABE_ITO = [
    "#E69F00",
    "#56B4E9",
    "#009E73",
    "#F0E442",
    "#0072B2",
    "#D55E00",
    "#CC79A7",
    "#000000",
]


def apply_publication_style(font_size: int = 8) -> None:
    mpl.rcParams.update(
        {
            "font.family": "sans-serif",
            "font.sans-serif": ["Arial", "Helvetica", "DejaVu Sans"],
            "font.size": font_size,
            "axes.labelsize": font_size + 1,
            "axes.titlesize": font_size + 1,
            "xtick.labelsize": font_size,
            "ytick.labelsize": font_size,
            "legend.fontsize": font_size,
            "figure.dpi": 150,
            "savefig.dpi": 300,
            "axes.linewidth": 0.8,
            "lines.linewidth": 1.6,
            "lines.markersize": 4,
            "axes.prop_cycle": cycler(color=OKABE_ITO),
            "pdf.fonttype": 42,
            "ps.fonttype": 42,
            "svg.fonttype": "none",
        }
    )


def save_figure(
    fig, output_base: str | Path, formats=("png", "pdf"), dpi: int = 300
) -> list[Path]:
    base = Path(output_base)
    base.parent.mkdir(parents=True, exist_ok=True)
    paths = []
    for fmt in formats:
        path = base.with_suffix(f".{fmt}")
        fig.savefig(path, dpi=dpi, bbox_inches="tight")
        paths.append(path)
    return paths
