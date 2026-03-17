# The Tidal Scream
## exomonad execution plan

**repo:** `sarasti`
**stack:** TypeScript, Three.js, React, Vite, Playwright
**deploy:** Cloudflare Workers (serves static site + KV-backed data refresh)
**data:** Baked historical market data + optional CF cron refresh
**model:** FLAME 2023 Open (CC-BY-4.0)
**orchestration:** exomonad — TLs spawned with `--fork-session` (inherits parent context)

*"What do they represent?" "Software customizes output for user."*

---

## The Piece

A face-field of ~25 financial instruments. Each face = one data feed.
All faces show state at shared timestamp T. Timeline scrubs Feb 25 → present.
Press play: 1 second per hour. Seventeen days of crisis in ~68 seconds.

Futures term structure maps to FLAME age axis: 1M future = 20yo face,
12M = 60yo. Backwardation is visible as the young screaming while the elder stays calm.

The binding doctrine: shape = structural identity (class, family, tenor-as-age).
Expression = crisis dynamics (deviation, velocity, volatility).
The artist's hand is in the mapping. The expressions are statistics.

---

## Prerequisites (human, before launch)

1. Register at https://flame.is.tue.mpg.de/, download FLAME 2023 Open
2. `npx create vite@latest sarasti -- --template react-ts`
3. `npm install three @types/three && npx playwright install chromium`
4. Run extract + market-pull scripts after their worktrees merge

---

## Core Types

```typescript
// ─── Data ───────────────────────────────────────────

export type AssetClass = 'energy' | 'fear' | 'currency' | 'equity' | 'media';

export interface TickerConfig {
  id: string;            // "BZ=F"
  name: string;          // "Brent Crude Spot"
  class: AssetClass;
  family: string;        // "brent" | "wti" | "vix" | "gdelt" | ...
  age: number;           // 20-60, maps to FLAME age axis
  tenor_months?: number;
}

export interface TickerFrame {
  close: number;
  volume: number;
  deviation: number;     // (close - baseline) / baseline, pre-computed
  velocity: number;      // Δclose/Δt normalized, pre-computed
  volatility: number;    // rolling 6hr stddev normalized, pre-computed
}

export interface Frame {
  timestamp: string;
  values: Record<string, TickerFrame>;
}

export interface TimelineDataset {
  tickers: TickerConfig[];
  frames: Frame[];
  timestamps: string[];
  baseline_timestamp: string;
}

// ─── Face ───────────────────────────────────────────

export interface FaceParams {
  shape: Float32Array;       // N_SHAPE
  expression: Float32Array;  // N_EXPR
}

export interface FaceInstance {
  id: string;
  params: FaceParams;
  position: [number, number, number];
  ticker: TickerConfig;
  frame: TickerFrame;
}

// ─── Renderer ───────────────────────────────────────

export interface FaceRenderer {
  init(container: HTMLElement): Promise<void>;
  setInstances(instances: FaceInstance[]): void;
  highlightInstance(id: string | null): void;
  getInstanceAtScreenPos(x: number, y: number): string | null;
  setCameraTarget(pos: [number, number, number]): void;
  dispose(): void;
}

// ─── Layout ─────────────────────────────────────────

export type LayoutStrategy =
  | { kind: 'family-rows' }
  | { kind: 'class-clusters' }
  | { kind: 'reactivity-sweep' }

export interface LayoutResult {
  positions: Map<string, [number, number, number]>;
}

// ─── Binding ────────────────────────────────────────

export interface ExpressionMap {
  indices: number[];
  weights: number[];
  curve: 'linear' | 'exponential' | 'sigmoid';
}

export interface TidalBinding {
  age_shape_components: number[];
  class_shape_components: number[];
  family_shape_components: number[];
  deviation_expr_map: ExpressionMap;
  velocity_expr_map: ExpressionMap;
  volatility_expr_map: ExpressionMap;
  expression_intensity: number;
}

// ─── Timeline ───────────────────────────────────────

export interface PlaybackState {
  current_index: number;
  playing: boolean;
  speed: number;           // seconds per frame (1 = 1sec/hr)
  loop: boolean;
}
```

---

## Face Inventory (25 faces)

### Brent family (narrow jaw, high brow)
| Ticker | Age | Tenor |
|--------|-----|-------|
| BZ=F | 20 | spot |
| BZK26.NYM | 28 | 2M |
| BZN26.NYM | 35 | 4M |
| BZV26.NYM | 48 | 8M |
| BZZ26.NYM | 60 | 12M |

### WTI family (broader jaw — Brent's cousin)
| Ticker | Age | Tenor |
|--------|-----|-------|
| CL=F | 20 | spot |
| CLN26.NYM | 32 | 3M |
| CLU26.NYM | 42 | 6M |
| CLZ26.NYM | 60 | 12M |

### Other energy (distinct species)
| Ticker | Age | Rationale |
|--------|-----|-----------|
| NG=F | 25 | Fast reactor |
| HO=F | 30 | Downstream |
| RB=F | 35 | Further downstream |
| FRED:GASREGW | 55 | Last to react |

### Fear instruments (sharp features)
| Ticker | Age | Rationale |
|--------|-----|-----------|
| ^VIX | 20 | Instantaneous fear |
| GC=F | 40 | Steady worrier |
| DX=F | 35 | Structural |
| ^TNX | 55 | Slow, heavy |

### Equities (rounder, softer)
| Ticker | Age | Rationale |
|--------|-----|-----------|
| XLE | 30 | Direct exposure |
| ITA | 25 | War beneficiary |
| SPY | 40 | Broad market |

### Media/conflict (angular, alien)
| Ticker | Age | Rationale |
|--------|-----|-----------|
| GDELT:iran | 20 | Instant |
| GDELT:gulf | 22 | Near-instant |
| GDELT:tone:iran | 28 | Slight lag |

---

## Worktree Tree

Doctrine: every TL writes a scaffolding commit (types, interfaces, stubs, test
harness), spawns parallel children, merges their PRs, writes an integration
commit, then PRs to its parent. Leaves are Devs. Recursion at every level.

```
sarasti/root (TL: Opus)
│
│   ROOT SCAFFOLDING: project skeleton, all shared types above,
│   CLAUDE.md, vite config, package.json, empty directory stubs
│   for every module, synthetic test fixture
│
│   ROOT WAVE 1 — four sub-TLs, no deps between them
│
├─── sarasti/renderer (TL: Opus) ────────────────────────────────
│    │
│    │   SCAFFOLDING: FaceRenderer interface, renderer/constants.ts,
│    │   renderer/types.ts (FlameModel, FlameBuffers),
│    │   test-utils/ (screenshot, param-sweep, SSIM, headless),
│    │   tools/visual-check.ts, playwright.config.ts
│    │
│    │   WAVE 1 — two sub-TLs
│    │
│    ├─── sarasti/renderer/flame (TL: Opus) ─────────────────────
│    │    │
│    │    │   SCAFFOLDING: flame/ dir stubs, FlameModel interface,
│    │    │   deform() signature, loader contract, test: load model
│    │    │   + deform with zero params = template
│    │    │
│    │    │   WAVE 1 — three Devs, no deps
│    │    │
│    │    ├── sarasti/renderer/flame/extract (Dev: Gemini)
│    │    │   tools/extract_flame.py
│    │    │   pickle → binary arrays (template, faces, shapedirs, exprdirs)
│    │    │   Truncate to 100 shape + 50 expr
│    │    │   Output flame_meta.json with dims
│    │    │   Tests: reload arrays, verify shapes/ranges
│    │    │   VISUAL: N/A
│    │    │
│    │    ├── sarasti/renderer/flame/loader (Dev: Gemini)
│    │    │   src/renderer/flame/loader.ts
│    │    │   Fetch .bin files → typed arrays
│    │    │   Progressive load (template+faces first, basis after)
│    │    │   Tests: zero-param deform = template, unit vectors produce change
│    │    │   VISUAL: N/A
│    │    │
│    │    └── sarasti/renderer/flame/deformer (Dev: Gemini)
│    │        src/renderer/flame/deform.ts
│    │        deform(beta, psi) → Float32Array of vertex positions
│    │        Pure math: template + shapedirs @ beta + exprdirs @ psi
│    │        SIMD-friendly loop structure (future optimization path)
│    │        Compute normals after deformation
│    │        Tests: linearity (deform(2*beta) = template + 2*(deform(beta)-template)),
│    │          orthogonality (shape and expr are independent)
│    │        VISUAL: N/A
│    │    
│    │    FLAME TL INTEGRATION: wire loader → deformer, verify
│    │    end-to-end: fetch model files → deform → get vertices
│    │    
│    │    FLAME TL WAVE 2 — depends on merged loader+deformer
│    │    
│    │    └── sarasti/renderer/flame/mesh (Dev: Gemini)
│    │        src/renderer/flame/mesh.ts, material.ts
│    │        Three.js BufferGeometry from vertices + face indices
│    │        Matcap material (neutral stylized, not photorealistic)
│    │        updateFromParams(FaceParams) → updates geometry in-place
│    │        Warm/cool tint uniform: crisis intensity → color temperature
│    │        VISUAL CHECK — REQUIRED:
│    │          sweep-shape → smooth deformation, no spikes/NaN
│    │          sweep-expr → visible expression changes
│    │          gallery 9 → all distinct, matcap looks good
│    │          Save baselines
│    │
│    ├─── sarasti/renderer/svg (Dev: Gemini) ────────────────────
│    │    src/renderer/svg/generator.ts, renderer.ts
│    │    30+ controllable SVG face dims
│    │    Same FaceRenderer interface
│    │    CSS hover highlighting
│    │    VISUAL CHECK — REQUIRED:
│    │      20 random faces, param sweep strip
│    │
│    │   RENDERER TL INTEGRATION: both flame and svg implement
│    │   FaceRenderer. Integration test: render same FaceInstance[]
│    │   with both, screenshot both, verify both produce distinct faces
│    │
│    │   RENDERER TL WAVE 2 — depends on merged flame+svg
│    │
│    └─── sarasti/renderer/scene (TL: Opus) ─────────────────────
│         │
│         │   SCAFFOLDING: scene types, Three.js app shell
│         │   (scene, camera, renderer, animation loop), hooks
│         │   for setInstances/highlight/raycast
│         │
│         │   WAVE 1 — three Devs
│         │
│         ├── sarasti/renderer/scene/compositor (Dev: Gemini)
│         │   src/renderer/scene/compositor.ts
│         │   Manages N face meshes in scene graph
│         │   Creates/updates/removes meshes as instances change
│         │   Applies position from FaceInstance.position
│         │   Per-face warm/cool tint based on deviation magnitude
│         │   VISUAL CHECK: gallery 25, verify all placed correctly
│         │
│         ├── sarasti/renderer/scene/camera (Dev: Gemini)
│         │   src/renderer/scene/camera.ts
│         │   OrbitControls with smooth transitions
│         │   frameAll(), flyTo(position), frameFamily(familyId)
│         │   Mouse wheel zoom, double-click fly-to
│         │   Tests: frameAll contains all positions in frustum
│         │   VISUAL: N/A (math)
│         │
│         └── sarasti/renderer/scene/picking (Dev: Gemini)
│             src/renderer/scene/picking.ts
│             Raycasting: screen coords → face id
│             Highlight effect: emissive boost on hover
│             Dim effect: reduce opacity on non-selected when selection active
│             Tests: synthetic click at known screen pos → correct face id
│             VISUAL CHECK: render 25, highlight one, screenshot
│               verify: one bright, rest dimmed
│         
│         SCENE TL INTEGRATION: wire compositor + camera + picking
│         into unified scene manager that implements FaceRenderer
│         VISUAL CHECK: full 25-face gallery with hover + camera
│
├─── sarasti/data (TL: Opus) ────────────────────────────────────
│    │
│    │   SCAFFOLDING: TimelineDataset types, loader interface,
│    │   Frame access API contract, test fixture (small synthetic
│    │   dataset: 3 tickers, 10 frames, known values)
│    │
│    │   WAVE 1 — three Devs
│    │
│    ├── sarasti/data/market-pull (Dev: Gemini)
│    │   tools/pull_market_data.py
│    │   yfinance, all 25 tickers, Feb 25 → present, 1hr candles
│    │   Pre-compute per frame: deviation, velocity, volatility
│    │   Output: public/data/market-history.json
│    │   Tests: all tickers present, no NaN gaps >2hr, date range OK
│    │   VISUAL: N/A
│    │
│    ├── sarasti/data/gdelt-pull (Dev: Gemini)
│    │   tools/pull_gdelt.py
│    │   GDELT API: iran events, gulf events, iran tone
│    │   Same time range, aggregate to 1hr buckets
│    │   Same pre-computed fields (deviation from pre-crisis baseline)
│    │   Merge into same JSON format as market data
│    │   Tests: 3 GDELT tickers present, values plausible
│    │   VISUAL: N/A
│    │
│    └── sarasti/data/loader (Dev: Gemini)
│        src/data/loader.ts, interpolator.ts
│        Fetch market-history.json → parse into TimelineDataset
│        getFrame(index) → Frame (direct access)
│        getFrameAtTime(isoString) → Frame (nearest snap or interpolation)
│        interpolateFrame(t0, t1, alpha) → blended Frame
│        getTickerTimeseries(tickerId) → TickerFrame[] (for sparklines)
│        Tests: load fixture, verify frame count, interpolation midpoint
│        VISUAL: N/A
│    
│    DATA TL INTEGRATION: merge market-pull + gdelt-pull JSONs into
│    single unified market-history.json. Loader reads unified file.
│    Integration test: load real data, access every ticker at every
│    timestamp, verify no undefined values.
│
├─── sarasti/binding (TL: Opus) ─────────────────────────────────
│    │
│    │   SCAFFOLDING: TidalBinding type, ExpressionMap,
│    │   default binding config JSON, resolver interfaces,
│    │   test: resolve with zero deviation → zero expression
│    │
│    │   WAVE 1 — two sub-TLs
│    │
│    ├─── sarasti/binding/shape (TL: Opus) ──────────────────────
│    │    │
│    │    │   SCAFFOLDING: ShapeResolver interface,
│    │    │   shape param allocation table (which β indices
│    │    │   are reserved for age vs class vs family),
│    │    │   test fixture: TickerConfig[] → FaceParams.shape[]
│    │    │
│    │    │   WAVE 1 — two Devs
│    │    │
│    │    ├── sarasti/binding/shape/age-mapper (Dev: Gemini)
│    │    │   src/binding/shape/age.ts
│    │    │   Maps TickerConfig.age (20-60) → β₁₋₃
│    │    │   MUST empirically explore which FLAME shape components
│    │    │   most affect perceived age. Method:
│    │    │     render faces varying β₁ alone, β₂ alone, etc.
│    │    │     identify which components change jaw weight, skin
│    │    │     tightness, brow prominence (age indicators)
│    │    │     document the mapping with screenshots
│    │    │   Linear interpolation: age 20 → -2σ, age 60 → +2σ
│    │    │   Tests: age 20 ≠ age 60 (L2 distance > threshold)
│    │    │   VISUAL CHECK — REQUIRED:
│    │    │     render 5 faces at ages 20,30,40,50,60 side by side
│    │    │     verify: visible aging progression, no grotesque faces
│    │    │
│    │    └── sarasti/binding/shape/identity-mapper (Dev: Gemini)
│    │        src/binding/shape/identity.ts
│    │        Maps AssetClass → β₄₋₆ (gross morphology)
│    │        Maps family → β₇₋₁₀ (family resemblance)
│    │        Each AssetClass gets a fixed shape profile:
│    │          energy: wider face, heavier jaw
│    │          fear: narrower, sharper features
│    │          currency: medium proportions
│    │          equity: rounder, softer
│    │          media: most angular, alien
│    │        Each family: small perturbation from class profile
│    │          brent vs wti: similar but distinguishable
│    │          within brent: all identical (age is the only difference)
│    │        Tests: intra-class distance < inter-class distance
│    │        VISUAL CHECK — REQUIRED:
│    │          render all 25 faces at neutral expression
│    │          verify: energy faces cluster, fear faces cluster,
│    │          families recognizable, Brent and WTI are cousins
│    │    
│    │    SHAPE TL INTEGRATION: wire age-mapper + identity-mapper
│    │    into unified ShapeResolver: TickerConfig → FaceParams.shape
│    │    VISUAL CHECK: all 25 faces, neutral expression, family-rows layout
│    │    verify: age gradient visible within each family,
│    │    class differences visible between families
│    │
│    └─── sarasti/binding/expression (TL: Opus) ─────────────────
│         │
│         │   SCAFFOLDING: ExpressionResolver interface,
│         │   expression param allocation (which ψ indices for
│         │   distress vs shock vs relief), response curve utilities,
│         │   test: zero frame → zero expression
│         │
│         │   WAVE 1 — two Devs
│         │
│         ├── sarasti/binding/expression/crisis-mapper (Dev: Gemini)
│         │   src/binding/expression/crisis.ts
│         │   Maps deviation → expression intensity (how bad)
│         │   MUST empirically explore FLAME expression components.
│         │   Method:
│         │     render faces varying ψ₁ alone, ψ₂ alone, etc.
│         │     identify which components produce:
│         │       distress (brow furrow + mouth downturn)
│         │       shock (brow raise + mouth open)
│         │       relief (slight smile + brow relax)
│         │     document with screenshots
│         │   Large negative deviation → distress register
│         │   Large positive deviation → shock or manic register
│         │   Near-zero → neutral
│         │   Configurable response curves (linear/exp/sigmoid)
│         │   Tests: deviation 0 → ψ ≈ 0, deviation ±3σ → max expression
│         │   VISUAL CHECK — REQUIRED:
│         │     render one face at 10 deviation levels (-3σ to +3σ)
│         │     verify: smooth transition calm → distress
│         │
│         └── sarasti/binding/expression/dynamics-mapper (Dev: Gemini)
│             src/binding/expression/dynamics.ts
│             Maps velocity → expression type modifier
│               sharp negative velocity → amplify shock components
│               sustained negative → amplify dread components
│               positive velocity → shift toward relief
│             Maps volatility → expression complexity
│               high vol → multiple expression components active
│               (face looks conflicted, twitching)
│               low vol → clean single-register expression
│               (face looks fixed — frozen scream or frozen calm)
│             Tests: high velocity + high deviation → shock > dread
│             VISUAL CHECK — REQUIRED:
│               render 3 faces: same deviation, different velocity
│               verify: visually distinguishable expression types
│         
│         EXPRESSION TL INTEGRATION: wire crisis-mapper + dynamics-mapper
│         into unified ExpressionResolver: TickerFrame → FaceParams.expression
│         VISUAL CHECK: animate one face through 20 frames of real data
│           from Feb 25 → Mar 1. Verify: starts calm, transitions to
│           screaming, expression type shifts match velocity changes.
│    
│    BINDING TL INTEGRATION: wire ShapeResolver + ExpressionResolver
│    into unified resolve(TickerConfig, TickerFrame) → FaceParams
│    VISUAL CHECK: all 25 faces at T=Feb 28 00:00 (strike moment)
│      verify: GDELT faces screaming first, oil faces starting to react,
│      equities still relatively calm. Age gradient visible.
│
└─── sarasti/spatial (Dev: Gemini) ──────────────────────────────
     src/spatial/layout.ts
     Three layout strategies for 25 faces:
       family-rows: one row per family, age left→right (default)
       class-clusters: group by AssetClass, age within
       reactivity-sweep: single row, young(fast) left → old(slow) right
     Spacing: 2× face bounding sphere radius
     Tests: no overlaps, families contiguous in family-rows
     VISUAL: N/A (positions, verified at integration)


ROOT WAVE 1 INTEGRATION:
  Wire: data.loader → binding.resolve → spatial.layout → renderer.setInstances
  At a single timestamp. Static frame. 25 faces visible.
  VISUAL CHECK — CRITICAL:
    screenshot at T=Feb 25 (pre-crisis): all 25 calm
    screenshot at T=Mar 1 (peak crisis): most distressed
    screenshot at T=Mar 10 (sustained): chronic stress visible
    family-rows layout: Brent row shows age gradient + expression gradient


ROOT WAVE 2 — three sub-TLs, depend on merged wave 1
│
├─── sarasti/timeline (TL: Opus) ────────────────────────────────
│    │
│    │   SCAFFOLDING: PlaybackState type, TimelineEngine interface,
│    │   playback event system (onFrameChange, onPlayStateChange),
│    │   test: advance frame index, verify bounds
│    │
│    │   WAVE 1 — two Devs
│    │
│    ├── sarasti/timeline/engine (Dev: Gemini)
│    │   src/timeline/engine.ts
│    │   Manages PlaybackState
│    │   play() → requestAnimationFrame loop, advances frame at speed
│    │   pause(), seek(index), seekToTime(isoString)
│    │   Speed control: 0.25x, 0.5x, 1x, 2x, 4x
│    │   Loop toggle: when reaching end, optionally restart
│    │   Fires onFrameChange(index) on each frame advance
│    │   Tests: play for 100ms at 4x, verify frames advanced correctly
│    │   VISUAL: N/A (pure state machine)
│    │
│    └── sarasti/timeline/frame-driver (Dev: Gemini)
│        src/timeline/driver.ts
│        Bridges timeline engine → data loader → binding → renderer
│        On each frame change:
│          1. data.getFrame(index) → Frame
│          2. For each ticker: binding.resolve(ticker, frame.values[ticker.id])
│          3. renderer.setInstances(resolved instances)
│        Batches updates: if frame changes faster than render, skip frames
│        Tests: mock all deps, verify correct call sequence
│        VISUAL CHECK — REQUIRED:
│          tools/visual-check.ts playback → 10-frame filmstrip
│          verify: faces change expression across frames,
│          crisis onset visible as a transition
│    
│    TIMELINE TL INTEGRATION: engine + driver wired together
│    Play from frame 0 → N, verify smooth playback in browser
│
├─── sarasti/interaction (TL: Opus) ─────────────────────────────
│    │
│    │   SCAFFOLDING: event types (HoverEvent, SelectEvent),
│    │   integration with renderer.getInstanceAtScreenPos()
│    │
│    │   WAVE 1 — two Devs
│    │
│    ├── sarasti/interaction/hover (Dev: Gemini)
│    │   src/interaction/hover.ts, tooltip.tsx
│    │   onMouseMove → renderer picking → highlight + tooltip
│    │   Tooltip: ticker name, current values (close, deviation,
│    │     velocity, volatility), asset class, age, tenor
│    │   "Why is this face screaming?" section:
│    │     deviation from baseline: +47%
│    │     velocity: -2.3σ/hr (sharp drop)
│    │     volatility: 4.1× normal
│    │   Debounce 16ms, avoid viewport overflow
│    │   VISUAL CHECK: screenshot with tooltip visible over a face
│    │
│    └── sarasti/interaction/detail (Dev: Gemini)
│        src/interaction/detail.tsx
│        Click face → side panel with full decode
│        Sparkline: ticker's full timeseries (tiny line chart)
│        Current frame highlight on sparkline
│        All binding parameters listed
│        "What do the expressions represent" decode
│        Family context: show all family members' current states
│        VISUAL CHECK: screenshot with detail panel open
│    
│    INTERACTION TL INTEGRATION: hover + detail wired to renderer events
│
└─── sarasti/ui (TL: Opus) ──────────────────────────────────────
     │
     │   SCAFFOLDING: React app shell (viewport + bottom bar + side panel),
     │   state management (zustand or context), responsive layout
     │
     │   WAVE 1 — three Devs
     │
     ├── sarasti/ui/timeline-bar (Dev: Gemini)
     │   src/ui/TimelineBar.tsx
     │   Bottom of viewport. Full-width.
     │   Scrubber: drag to seek. Click to jump.
     │   Play/pause button. Speed selector (0.25x-4x).
     │   Current timestamp display (human readable + "Day N of conflict")
     │   Tick marks at key events: Feb 28 (strikes begin), Mar 1
     │     (Khamenei killed), Mar 8 (new supreme leader), etc.
     │   Mini aggregate indicator: average expression intensity
     │     across all 25 faces, shown as a thin intensity bar
     │     (calm=cool color, crisis=warm) along scrubber track
     │   VISUAL CHECK: screenshot of timeline bar at various timestamps
     │
     ├── sarasti/ui/controls (Dev: Gemini)
     │   src/ui/Controls.tsx
     │   Small floating panel, top-right
     │   Layout selector: family-rows / class-clusters / reactivity-sweep
     │   Renderer toggle: FLAME / SVG
     │   Expression intensity slider (0-1)
     │   Face size slider
     │   "About this piece" info button
     │   VISUAL CHECK: screenshot of controls panel
     │
     └── sarasti/ui/landing (Dev: Gemini)
         src/ui/Landing.tsx
         Initial state before play is pressed
         Dark background. The 25 faces at T=Feb 25, calm.
         Title: "The Tidal Scream"
         Subtitle: a brief sentence about the piece
         "Press play" or "Click anywhere to begin"
         Fades out when playback starts
         The Watts quote in small type at bottom:
           "What do they represent?"
           "Software customizes output for user."
         VISUAL CHECK: screenshot of landing page
     
     UI TL INTEGRATION: shell + timeline-bar + controls + landing wired
     VISUAL CHECK: full app screenshot at landing, at mid-crisis, at end


ROOT WAVE 2 INTEGRATION:
  Wire timeline + interaction + ui into the app
  End-to-end: land → press play → faces animate → hover → tooltip → click → detail
  VISUAL CHECK — FINAL:
    Landing page screenshot
    T=Feb 25 screenshot (calm)
    T=Feb 28 screenshot (strike onset — wavefront visible)
    T=Mar 5 screenshot (sustained crisis)
    T=present screenshot (current state)
    Filmstrip: 10 frames evenly spaced across full timeline
    Family filmstrip: Brent family, all frames


ROOT WAVE 3 — deploy

└─── sarasti/deploy (TL: Opus) ──────────────────────────────────
     │
     │   SCAFFOLDING: wrangler.toml, CF project config,
     │   KV namespace for data cache, build script
     │
     │   WAVE 1 — two Devs
     │
     ├── sarasti/deploy/worker (Dev: Gemini)
     │   worker/index.ts
     │   CF Worker that:
     │     - Serves static Vite build from __STATIC_CONTENT
     │     - GET /api/data → serve market-history.json from KV
     │       (falls back to static file if KV empty)
     │     - Cron trigger (daily): runs fetch against Yahoo Finance
     │       API to get latest day of data, appends to KV dataset
     │       (extends the timeline into the future as conflict continues)
     │   wrangler.toml with KV binding, cron trigger config
     │   Tests: miniflare local test, verify static serve + API route
     │
     └── sarasti/deploy/build (Dev: Gemini)
         Build pipeline:
           vite build → dist/
           wrangler deploy
         GitHub Actions workflow: on push to main → build + deploy
         Environment: CF API token as GitHub secret
         package.json scripts: build, deploy, pull-data (reruns market script)
         README with deploy instructions
```

---

## The Recursive Pattern

Every TL at every level follows the same protocol:

```
1. TL writes scaffolding commit
   - Types/interfaces that children implement against
   - Test harness / fixtures children will use
   - Stub files showing where children put their code
   - CLAUDE.md additions scoping this TL's domain

2. TL spawns wave 1 children (TL or Dev)
   - Children fork from scaffolding commit
   - Zero deps between siblings in same wave
   - Each child PRs back to parent TL branch

3. TL merges wave 1 PRs, writes integration commit
   - Wires children's outputs together
   - Runs integration tests
   - VISUAL CHECK if applicable
   - Fixes integration bugs

4. TL spawns wave 2 children (if any)
   - These depend on merged wave 1
   - Same fork → implement → PR pattern

5. TL merges wave 2, writes final integration commit
   - PRs to its own parent TL
```

### Context inheritance via `--fork-session`

When a TL spawns a child TL (Claude), it uses `--fork-session`, which means:

- **Child TL inherits the parent's full conversation context.** This includes
  the parent's understanding of the project, the binding doctrine, the face
  inventory, the visual verification strategy — everything discussed in the
  parent's session up to the point of spawning.

- **TL scaffolding commits do NOT need to re-explain project context.** The
  CLAUDE.md and type definitions carry the machine-readable contract. The
  fork-session carries the intent, taste, and design rationale.

- **What scaffolding DOES need:** types, interfaces, test fixtures, directory
  stubs, and the specific acceptance criteria for this subtree. The "what to
  build" not the "why we're building it."

- **Dev worktrees (Gemini) do NOT get fork-session.** They get: the code in
  the worktree (including CLAUDE.md), their task document, and nothing else.
  Task docs for Devs must be self-contained. All context a Gemini agent needs
  must be in the scaffolding commit + task doc.

This asymmetry is load-bearing: Claude TLs share understanding implicitly
(fork-session). Gemini Devs work from explicit specification (typed contracts
in the scaffolding commit). The specification is the interface between
expensive-implicit and cheap-explicit. The type system enforces it.

**Depth in this plan:**
- `root → renderer → flame → extract` = 4 levels
- `root → renderer → scene → compositor` = 4 levels
- `root → binding → shape → age-mapper` = 4 levels
- `root → binding → expression → crisis-mapper` = 4 levels
- `root → ui → timeline-bar` = 3 levels
- `root → deploy → worker` = 3 levels

**Wave structure:**
- Root wave 1: renderer, data, binding, spatial (4 parallel)
- Root wave 2: timeline, interaction, ui (3 parallel)
- Root wave 3: deploy (1)
- renderer wave 1: flame (TL), svg (Dev)
- renderer wave 2: scene (TL)
- flame wave 1: extract, loader, deformer (3 parallel)
- flame wave 2: mesh
- scene wave 1: compositor, camera, picking (3 parallel)
- binding wave 1: shape (TL), expression (TL)
- shape wave 1: age-mapper, identity-mapper (2 parallel)
- expression wave 1: crisis-mapper, dynamics-mapper (2 parallel)
- data wave 1: market-pull, gdelt-pull, loader (3 parallel)
- timeline wave 1: engine, frame-driver (2 parallel)
- interaction wave 1: hover, detail (2 parallel)
- ui wave 1: timeline-bar, controls, landing (3 parallel)
- deploy wave 1: worker, build (2 parallel)

**Total: 9 TLs, 27 Devs, 4 levels deep, ~40 PRs.**

---

## Acceptance Criteria

### MVP
- [ ] 25 faces render with FLAME meshes
- [ ] Age gradient visible in futures term structure
- [ ] Expression changes with timeline playback
- [ ] Play/pause/scrub works, 1sec/hr default speed
- [ ] Hover → tooltip with raw data + expression decode
- [ ] Click → detail panel with sparkline
- [ ] Family-rows layout shows the family portrait clearly
- [ ] SVG fallback works as drop-in swap
- [ ] Landing page with title + Watts quote
- [ ] Deployed on CF Workers, publicly accessible
- [ ] All visual checks pass
- [ ] The Feb 25 → Feb 28 transition is viscerally legible

### Stretch
- [ ] CF cron extends timeline daily with new market data
- [ ] Sound layer (drone that intensifies with aggregate expression)
- [ ] Class-clusters and reactivity-sweep layouts
- [ ] Mobile responsive (face-field fills viewport)
- [ ] Share link with timestamp (url param → seek to that moment)
- [ ] Side-by-side: same moment, Brent term structure vs WTI term structure

---

## Token Budget

~20-25K lines of code, ~40 PRs, ~9 TL scaffolding commits.
Estimate ~4-5 days of active waves.
Gemini handles all 27 Dev worktrees. Opus handles all 9 TL scaffolding + integration.
