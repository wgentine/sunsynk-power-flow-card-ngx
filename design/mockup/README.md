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

Outputs (2× DPR):

- `/opt/cursor/artifacts/mockup-a-dark.png`
- `/opt/cursor/artifacts/mockup-a-light.png`
- `/opt/cursor/artifacts/mockup-b-dark.png`
- `/opt/cursor/artifacts/mockup-b-light.png`
- `/opt/cursor/artifacts/mockup-a-flow-dark.webm`
- `/opt/cursor/artifacts/mockup-a-flow-dark.gif`

Topology: PV (2 strings) top · grid left · inverter centre · battery bottom · 8 essential load circles right · non-essential + grid meter bottom-right.