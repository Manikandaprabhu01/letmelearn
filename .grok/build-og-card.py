#!/usr/bin/env python3
"""Build the Lattice OG share card as a self-contained HTML plate."""

from __future__ import annotations

import math
from pathlib import Path

OUT = Path("/workspace/.grok/og-card.html")
W, H = 1200, 630
CX, CY = W / 2, H / 2

# Hexagonal lattice; skip an elliptical hole so the lockup sits on charcoal.
nodes: list[dict] = []
for row in range(6):
    offset = 78 if row % 2 else 0
    y = 58.0 + row * 103
    for col in range(9):
        x = 52.0 + col * 138 + offset
        if x < 36 or x > W - 36 or y < 36 or y > H - 36:
            continue
        # Title cartouche
        if ((x - CX) / 360) ** 2 + ((y - CY) / 185) ** 2 < 1:
            continue
        idx = len(nodes)
        kind_key = (row * 3 + col) % 5
        if kind_key == 0:
            kind, r = "fill", 7.0
        elif kind_key == 2:
            kind, r = "ring", 6.2
        else:
            kind, r = "small", 3.6
        nodes.append({"id": idx, "x": x, "y": y, "r": r, "kind": kind})

# Nearest-neighbour edges (hex lattice spacing ~ 138).
edges: list[tuple[int, int]] = []
for i, a in enumerate(nodes):
    for j, b in enumerate(nodes):
        if j <= i:
            continue
        d = math.hypot(a["x"] - b["x"], a["y"] - b["y"])
        if 90 < d < 158:
            edges.append((i, j))

edge_paths = []
for i, j in edges:
    a, b = nodes[i], nodes[j]
    edge_paths.append(
        f'<line x1="{a["x"]:.1f}" y1="{a["y"]:.1f}" x2="{b["x"]:.1f}" y2="{b["y"]:.1f}"/>'
    )

node_els = []
for n in nodes:
    x, y, r = n["x"], n["y"], n["r"]
    if n["kind"] == "fill":
        node_els.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r + 5:.1f}" fill="#9eb4c8" fill-opacity="0.12"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#9eb4c8"/>'
        )
    elif n["kind"] == "ring":
        node_els.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="none" stroke="#9eb4c8" stroke-width="1.6"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.1" fill="#9eb4c8"/>'
        )
    else:
        node_els.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#8b8d93"/>'
        )

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Lattice</title>
<style>
  @font-face {{
    font-family: "Fraunces";
    src: url("file:///workspace/.grok/fonts/Fraunces.ttf") format("truetype");
    font-weight: 100 900;
    font-style: normal;
    font-display: block;
  }}
  @font-face {{
    font-family: "IBM Plex Sans";
    src: url("file:///workspace/.grok/fonts/IBMPlexSans.ttf") format("truetype");
    font-weight: 100 700;
    font-style: normal;
    font-display: block;
  }}
  html, body {{
    margin: 0;
    padding: 0;
    width: {W}px;
    height: {H}px;
    background: #0b0c0e;
    overflow: hidden;
  }}
  .card {{
    position: relative;
    width: {W}px;
    height: {H}px;
    background: #0b0c0e;
  }}
  .grid {{
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(232,230,225,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(232,230,225,0.045) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 78% 70% at 50% 48%, black 8%, transparent 72%);
    -webkit-mask-image: radial-gradient(ellipse 78% 70% at 50% 48%, black 8%, transparent 72%);
  }}
  svg.graph {{
    position: absolute;
    inset: 0;
  }}
  .vignette {{
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 72% 68% at 50% 48%, transparent 42%, #0b0c0e 100%);
    pointer-events: none;
  }}
  .lockup {{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #e8e6e1;
    width: 920px;
  }}
  .mark {{
    display: block;
    margin: 0 auto 18px;
  }}
  h1 {{
    margin: 0;
    font-family: "Fraunces", "Liberation Serif", serif;
    font-weight: 520;
    font-size: 176px;
    line-height: 0.9;
    letter-spacing: 0.06em;
    font-optical-sizing: auto;
    font-variation-settings: "SOFT" 12, "WONK" 0, "opsz" 144;
    color: #e8e6e1;
  }}
  .rule {{
    width: 64px;
    height: 1px;
    background: #9eb4c8;
    margin: 26px auto 18px;
    opacity: 0.85;
  }}
  p {{
    margin: 0;
    font-family: "IBM Plex Sans", "Liberation Sans", sans-serif;
    font-weight: 400;
    font-size: 15px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #8b8d93;
  }}
</style>
</head>
<body>
  <div class="card">
    <div class="grid"></div>
    <svg class="graph" viewBox="0 0 {W} {H}" width="{W}" height="{H}" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#9eb4c8" stroke-opacity="0.38" stroke-width="1.25" stroke-linecap="round">
        {"".join(edge_paths)}
      </g>
      <g>
        {"".join(node_els)}
      </g>
    </svg>
    <div class="vignette"></div>
    <div class="lockup">
      <svg class="mark" width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="#9eb4c8" stroke-width="1.4"/>
        <circle cx="10" cy="10" r="2.1" fill="#e8e6e1"/>
        <circle cx="22" cy="10" r="2.1" fill="#e8e6e1"/>
        <circle cx="16" cy="22" r="2.1" fill="#e8e6e1"/>
        <path d="M10 10h12M10 10l6 12M22 10l-6 12" fill="none" stroke="#9eb4c8" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <h1>Lattice</h1>
      <div class="rule"></div>
      <p>System design, taught like the interview.</p>
    </div>
  </div>
</body>
</html>
"""

OUT.write_text(html)
print(f"wrote {OUT} nodes={len(nodes)} edges={len(edges)}")
