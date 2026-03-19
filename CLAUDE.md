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

## Binding Architecture — 2-Axis Expression Circumplex

Expression uses the Russell circumplex: **Tension** (tense↔placid) × **Mood** (euphoric↔grief).
Shape uses two additive axes: **Dominance** (soyboi↔chad) × **Stature** (heavy↔gaunt).
No softmax — the two expression axes are orthogonal. Component overlap produces natural blending.

### Tension (tense ↔ placid)
- **Input:** `0.6 × sigmoid(vol_z × |vel_z| - 0.5) + 0.4 × sigmoid(-(dd_z + exchFatigue))`
- **Tense (+):** ψ2×2.5, ψ0×1.0, ψ8×1.5, ψ7×-1.5, ψ5×0.8, ψ4×-0.5 + jaw + gaze up
- **Placid (−):** ψ2×-2.0, ψ7×2.0, ψ3×0.8, ψ4×0.5 + gaze down
- **Texture ownership:** fatigue (tense = wired −0.3, placid = exhausted +0.5)

### Mood (euphoric ↔ grief)
- **Input:** `sigmoid(deviation_z)`
- **Euphoric (+):** ψ5×2.0 (bilateral smile), ψ4×-1.0 (mouth widens), ψ9×3.0, ψ0×1.0, ψ7×1.5, ψ8×0.5 + chin up + gaze right
- **Grief (−):** ψ3×2.0, ψ6×2.5, ψ7×1.0, ψ4×0.8 + head tilt + gaze down
- **Texture ownership:** flush (euphoric = warm +0.3, grief = pallid −0.2)

### Circumplex Quadrants
- Tense + Euphoric = **MANIC** (wide eyes + smile + flushed)
- Tense + Grief = **PANICKED** (wide eyes + furrowed + pallid)
- Placid + Euphoric = **CONTENT** (soft eyes + smile + warm)
- Placid + Grief = **DEPRESSED** (droopy + frown + pale)

### Shape Axes
- **Dominance** (β0,β2,β3,β4,β7,β13,β18,β23,β48) ← momentum. Pose: chin forward (+dom) / chin tucked (-dom)
- **Stature** (β1,β5,β6,β8,β15,β32,β49) ← |1-beta| with sign from deviation
- Zero component overlap between axes ✓

### Component Inventory
- **Expression (10 of 100 ψ used):** ψ0–ψ9 (ψ1 banned — asymmetric)
- **Shape (16 of 100 β used):** 9 dominance + 7 stature, zero overlap

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
