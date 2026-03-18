# Hormuz Crisis Monitor — sarasti

## What This Is
A face-field of ~25 financial instruments rendered as FLAME 3D faces.
Each face = one data feed. Expression = crisis dynamics (deviation, velocity, volatility).
Shape = structural identity (asset class, family, tenor-as-age via FLAME age axis).

## Stack
- TypeScript, React 19, Three.js, Vite 6, Vitest, Playwright
- FLAME 2023 Open model (CC-BY-4.0) for 3D face meshes
- Zustand for state management
- Deploy: Cloudflare Workers

## Project Structure
```
src/
  types.ts          — all shared types (TickerConfig, FaceParams, FaceRenderer, etc.)
  tickers.ts        — the 25 ticker configs with class/family/age
  constants.ts      — N_SHAPE, N_EXPR, timeline bounds, defaults
  renderer/
    flame/          — FLAME model: loader, deformer, mesh
    svg/            — SVG fallback renderer
    scene/          — Three.js scene: compositor, camera, picking
  data/             — market data loader, interpolation
  binding/
    shape/          — age-mapper, identity-mapper
    expression/     — crisis-mapper, dynamics-mapper
    resolve.ts      — unified binding: TickerConfig + TickerFrame → FaceParams
  spatial/          — layout strategies (family-rows, class-clusters, reactivity-sweep)
  timeline/         — playback engine, frame driver
  interaction/      — hover/tooltip, click/detail panel
  ui/               — React components (timeline bar, controls, landing)
tools/              — Python scripts (extract FLAME, pull market data, pull GDELT)
test-utils/         — test fixtures, screenshot utilities
public/data/        — baked data files (.bin, .json)
```

## Key Types (see src/types.ts)
- `TickerConfig` — asset identity (id, class, family, age, tenor)
- `TickerFrame` — per-frame data (close, deviation, velocity, volatility)
- `FaceParams` — shape (Float32Array[100]) + expression (Float32Array[50])
- `FaceInstance` — face identity + params + position + data
- `FaceRenderer` — interface both FLAME and SVG renderers implement
- `TimelineDataset` — all frames + ticker configs
- `PlaybackState` — current_index, playing, speed, loop

## Binding Principles
- Shape = structural identity. Determined by TickerConfig (age, class, family). Fixed per face.
- Expression = crisis dynamics. Determined by TickerFrame (deviation, velocity, volatility). Changes each frame.
- The visual mapping is a deliberate analytical choice. The expressions represent statistical deviations.

## FLAME Expression Components (ψ0–ψ9)
Official FLAME 2023 PCA ordering, with empirically verified mouth symmetry:

| Component | Effect | Symmetry | Notes |
|-----------|--------|----------|-------|
| ψ0 | jaw drop | symmetric | Primary jaw opener, robust to extrapolation |
| ψ1 | smile/frown | **ASYMMETRIC** | Avoid for bilateral expressions |
| ψ2 | brow raise | symmetric | Upper face, good for surprise |
| ψ3 | brow furrow | symmetric | Glabella bunching at high values |
| ψ4 | lip pucker | symmetric | Lips pinch at extreme values |
| ψ5 | upper lip raiser | symmetric | Exposes gum void at high values |
| ψ6 | lower lip depressor | symmetric | Thins at extreme values |
| ψ7 | eyelid close | symmetric | Clips through eyeball at ±7 |
| ψ8 | nose wrinkler | symmetric | Vertex bunching at nasion |
| ψ9 | cheek puffer | **ASYMMETRIC** | Lip corner asymmetry — avoid for mouth |

**Key rule:** For bilateral expression axes, avoid ψ1 and ψ9. Safe symmetric set: ψ0, ψ2, ψ3, ψ4, ψ5, ψ6, ψ7, ψ8.

Artifacts begin ~±5σ, mesh inversion by ~±10σ. Total expression magnitude budget ~20–25 for safe rendering; we deliberately exceed this for cartoon-level grotesque.

## Conventions
- Paths use `@/` alias for `src/`
- All rendering through FaceRenderer interface (swap FLAME/SVG)
- Test fixtures in test-utils/fixtures.ts
- Visual checks via tools/visual-check.ts + Playwright screenshots
- Python tools require their own venvs (numpy, yfinance, etc.)
