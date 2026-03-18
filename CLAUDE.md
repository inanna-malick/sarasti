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
Empirically verified symmetry at the mouth/lip region (from `flame2023_Open.pkl`):

| Component | Effect | Mouth Symmetry | Notes |
|-----------|--------|----------------|-------|
| ψ0 | jaw open + smile | symmetric | Primary smile driver, safe for valence |
| ψ1 | smirk | **ASYMMETRIC** | Left lip down, right lip up — avoid for bilateral expressions |
| ψ2 | mouth wide open | symmetric | Good for aperture/surprise |
| ψ3 | lip part/protrude | symmetric | Subtle lip separation |
| ψ4 | brow raise/lower | symmetric | Minimal mouth effect, good for brow expression |
| ψ5 | lip purse | very symmetric | Most symmetric mouth component (score 0.085) |
| ψ6 | jaw lateral | symmetric | Midline-focused, small effect |
| ψ7 | head shape mod | symmetric | Mostly affects cheeks, not mouth |
| ψ8 | lip/nose subtle | moderate | Small displacement |
| ψ9 | eye/cheek region | **ASYMMETRIC at lips** | Lip corner asymmetry 1.08 — avoid for mouth |

**Key rule:** For any expression axis that should be bilateral (valence, aperture), avoid ψ1 and ψ9. Use ψ0, ψ2, ψ3, ψ5 for symmetric mouth deformation.

Weights should keep raw ψ values within ±3 at slider extremes (beyond ±5 the linear model extrapolates badly).

## Conventions
- Paths use `@/` alias for `src/`
- All rendering through FaceRenderer interface (swap FLAME/SVG)
- Test fixtures in test-utils/fixtures.ts
- Visual checks via tools/visual-check.ts + Playwright screenshots
- Python tools require their own venvs (numpy, yfinance, etc.)
