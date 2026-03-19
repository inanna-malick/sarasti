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
Official FLAME 2023 PCA ordering. Bilateral symmetry verified via vertex mirror map (tools/compute_mirror.py):

| Component | Effect | Self-reflection | Notes |
|-----------|--------|-----------------|-------|
| ψ0 | jaw drop | +0.996 (SYM) | Primary jaw opener, robust to extrapolation |
| ψ1 | smile/frown | **-0.898 (ANTI)** | Nearly pure antisymmetric — lopsided smirk. Use ψ5+ψ4 for bilateral smile |
| ψ2 | brow raise | +0.902 (SYM) | Upper face, good for surprise |
| ψ3 | brow furrow | +0.950 (SYM) | Glabella bunching at high values |
| ψ4 | lip pucker | +0.986 (SYM) | Lips pinch at extreme values. Negative = mouth widens |
| ψ5 | upper lip raiser | +0.975 (SYM) | Exposes gum void at high values. Primary symmetric smile driver |
| ψ6 | lower lip depressor | +0.975 (SYM) | Thins at extreme values. Grief/sadness |
| ψ7 | eyelid close | +0.969 (SYM) | Clips through eyeball at ±4 (clamped) |
| ψ8 | nose wrinkler | +0.946 (SYM) | Vertex bunching at nasion |
| ψ9 | cheek puffer | +0.937 (SYM) | Previously thought asymmetric — actually symmetric per mirror analysis |

**Key rule:** ψ1 is the ONLY antisymmetric component in ψ0–ψ10. To use asymmetric components (ψ11+) bilaterally, apply them as conjugate pairs (see tools/compute_mirror.py for pair analysis). Safe solo-use set: ψ0, ψ2–ψ10.

**Mid-frequency nuance (ψ11+):** Components ψ11–ψ50 add subtle character. Beyond ψ50, components are overfitted to training subjects. Asymmetric pairs: ψ11↔ψ12, ψ14↔ψ15, ψ17↔ψ18, ψ19↔ψ20.

Artifacts begin ~±5σ, mesh inversion by ~±10σ. Total expression magnitude budget ~20–25 for safe rendering; we deliberately exceed this for cartoon-level grotesque.

## Conventions
- Paths use `@/` alias for `src/`
- All rendering through FaceRenderer interface (swap FLAME/SVG)
- Test fixtures in test-utils/fixtures.ts
- Visual checks via tools/visual-check.ts + Playwright screenshots
- Python tools require their own venvs (numpy, yfinance, etc.)
