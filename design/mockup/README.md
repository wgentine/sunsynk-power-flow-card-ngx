# Power-flow design mockups (stage 1)

Standalone high-fidelity static mock — **not** wired to the Lovelace card.

## View in browser

```bash
# Direction A, dark (default)
open design/mockup/index.html

# Direction B, light
open "design/mockup/index.html?dir=b&theme=light"
```

## Capture PNG / animation

```bash
node scripts/mockup-capture.mjs
```

Exits non-zero if **direction A** fails geometry QA: path↔text, path↔path, **node circle↔text**, **node↔node**, plus **connectivity** (every `flowEdges` path end snaps to its declared node/bus within 2px; no floating path ends) and **horizontal paths** must not reverse X (no doubling back). Debug overlays: `mockup-a-*-qa-overlay.png`.

Outputs (2× DPR):

- `/opt/cursor/artifacts/mockup-a-dark.png`
- `/opt/cursor/artifacts/mockup-a-light.png`
- `/opt/cursor/artifacts/mockup-b-dark.png`
- `/opt/cursor/artifacts/mockup-b-light.png`
- `/opt/cursor/artifacts/mockup-a-flow-dark.webm`
- `/opt/cursor/artifacts/mockup-a-flow-dark.gif`
- `/opt/cursor/artifacts/mockup-a-dark-junction-*.png` (ring-crop QA)

Flows are trimmed to each node’s outer ring (`ringIn` / `ringOut`) and masked so strokes and animated dots never paint inside circles. Node fills are opaque in direction A.

Topology: PV (2 strings) top · grid left · inverter centre · battery bottom · 8 essential load circles right · non-essential + grid meter bottom-right.