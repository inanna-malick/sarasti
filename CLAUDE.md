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

Expression uses the Russell circumplex: **Tension** (tense↔placid) × **Valence** (good↔bad).
Shape uses a single axis: **Stature** (sprite↔titan).
No softmax — the two expression axes are orthogonal. Zero ψ component overlap.

### Tension (tense ↔ calm) — upper face + JAW
- **Input:** `symmetricSigmoid(vol_z × |vel_z| + |dd_z| - 0.8, 1.0)`
- **Tense (+):** ψ2×3.5@1.5(jaw opens late), ψ9×5.0@0.4(eyes wide), ψ21×5.0@0.4(alert), ψ4×-3.5@0.6(brow raised), ψ24×-3.0@0.5, ψ25×-2.5, ψ5×2.0@0.7(nostril flare), ψ20×-2.0(sneer), ψ28×1.5@0.5(Duchenne squint) + pitch -0.20, yaw 0.05 + gaze up 0.20
- **Calm (−):** ψ2×-1.0@0.5(jaw clench early), ψ9×-4.5@0.5(eyes closing), ψ21×-5.0(droopy), ψ4×2.5(brow heavy), ψ24×2.5, ψ25×3.0, ψ28×-1.5(blank eyes) + pitch +0.25, roll 0.08 + gaze down -0.45
- **Texture ownership:** fatigue (tense = wired −0.5, calm = exhausted +1.0)
- **KEY: Jaw is URGENCY signal.** Open mouth = active/fighting, closed mouth = frozen/resigned.

### Valence (good ↔ bad) — lower face (NO jaw)
- **Input:** `symmetricSigmoid(dev_z + 0.5 × mom_z, 1.5)`
- **Good (+):** ψ0×3.0@0.7(smile early onset), ψ7×4.0@0.5(corners up early), ψ3×-1.5(mouth widens), ψ6×-1.0(horizontal stretch), ψ26×1.0(chin forward) + flush +0.30
- **Bad (−):** ψ7×-4.0@0.5(corners down early), ψ0×1.0@1.5(slack late), ψ3×1.5(pucker), ψ6×1.5(rounded), ψ16×1.0(narrow), ψ26×-2.5(chin retracted), ψ45×2.0@0.5(mentalis grief) + flush -0.55
- **Texture ownership:** flush (good = warm, bad = pallid)

### Circumplex Quadrants
- Tense + Good = **MANIC** (wide eyes + jaw open + smile + flushed)
- Tense + Bad = **PANICKED** (wide eyes + jaw open + frown + pallid)
- Calm + Good = **CONTENT** (soft eyes + jaw closed + smile + warm)
- Calm + Bad = **DEPRESSED** (droopy eyes + jaw closed + frown + pale)

### Shape Axis
- **Stature** (β0,β2,β3,β4,β7,β9,β10,β13,β18,β22,β23,β27,β28) ← momentum + vol regime
- Titan(+): wide jaw, sharp cheeks, bony. Sprite(−): narrow jaw, soft cheeks, rounded.

### Identity Noise (per-ticker visual diversity)
- **Primary (±1.5):** β1(face width), β11(nose/midface), β20(cheekbone), β14(jaw profile), β5(jaw squareness)
- **Secondary (±0.8):** β15(eye depth), β17(eye spacing), β25(jawline), β30(nose bridge)
- **Tertiary (±0.5):** β33–β41 (micro-perturbation)
- Zero overlap with stature axis. Deterministic per ticker-id via hash.

### Per-Class Expression EMA (wave propagation)
- fear(VIX,gold): α=0.30 — instant reactor (sentinel)
- equity(SPY,QQQ): α=0.20 — fast follower
- currency(forex): α=0.15 — moderate
- energy(oil,natgas): α=0.12 — deliberate
- commodity(metals,ags): α=0.10 — laggard
- Shape EMA: α=0.03 (glacial identity morph)

### Component Inventory
- **Expression (17 of 100 ψ used):** ψ0,ψ2–ψ7,ψ9,ψ16,ψ20,ψ21,ψ24,ψ25,ψ26,ψ28,ψ45 (ψ1 banned — asymmetric)
- **TENSION owns:** ψ2,ψ4,ψ5,ψ9,ψ20,ψ21,ψ24,ψ25,ψ28 (eyes/brow/jaw)
- **VALENCE owns:** ψ0,ψ3,ψ6,ψ7,ψ16,ψ26,ψ45 (mouth shape/chin)
- **Shape (13+9 of 100 β used):** 13 stature axis + 9 identity noise, zero overlap

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
