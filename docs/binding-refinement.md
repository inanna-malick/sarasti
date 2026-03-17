# Binding Refinement: Perceptual Stratification
## Parallel-to-Wave-2 Steering Doc

Runs on `sarasti/binding-refinement` branch, PRs to main after wave 2 merge.
Does not block wave 2. Does not change interfaces. Enriches data + binding configs.

---

## The Problem

We're using ~25 of 200 FLAME dimensions. 12% utilization. The faces look too same-y.
But the fix is not "pack more dimensions in." The fix is: **stratify dimensions by
perceptual timescale.**

## The Three Reads

A viewer reads a face-field at three speeds. Each speed uses different visual cortex
pathways. Each pathway is sensitive to different FLAME parameter ranges. The binding
must be stratified to match.

### Tier 1 — The Field Read (100ms, pre-attentive)

The viewer sees the ENTIRE field without fixating on any face. Parallel processing.
This is how the playback experience works — press play, watch the crowd shift.

**What the viewer perceives:** "The crowd is distressed." "That cluster changed." "It's getting worse."

**Visual channels that operate here:**
- Gross expression (mouth open, brow furrowed) — ψ₁₋₅, highest-variance expression components
- Gross face shape (head size, proportions) — β₁₋₃, highest-variance PCA components

**NOT a channel here: skin color.** Color is locked to a single neutral Mediterranean
matcap across all faces, all timestamps. Color maps too cleanly to race — and in a
piece about a Middle Eastern conflict, any data-driven skin tone variation would
produce exactly the wrong reading. The expression channel is strong enough to carry
the tier 1 signal alone. Expression IS the face's loudest channel. We don't need
the belt *and* the suspenders — the belt is enough.

**Data that belongs here:** The MOST IMPORTANT crisis signal.
- ψ₁₋₅ ← **deviation from pre-crisis baseline** (the core crisis indicator)
- β₁₋₃ ← **age** (tenor/reactivity — the most structurally important identity axis)

**Design rule:** These dimensions should be OBVIOUS at distance, at small face size,
during playback. If you can't see the crisis signal from the field-read, it's wrong.
Expression alone must carry this — no color assist.

### Tier 2 — The Scan Read (500ms, configural)

The viewer's eye is moving across faces. At each fixation (~200ms), the FFA computes
a holistic gestalt: "this face is unusual" or "this face belongs to that group."
This is how the viewer finds the interesting faces during playback.

**What the viewer perceives:** "That face stands out." "These faces are a family."
"Something changed about this one specifically."

**Visual channels that operate here:**
- Face identity (proportional relationships between features) — β₄₋₂₀
- Expression type (the QUALITY of expression, not just intensity) — ψ₆₋₂₀
- Asymmetry and unusual proportional relationships

**Shape (β₄₋₂₀) data bindings:**

| Dims | Binding | Source | Effect |
|------|---------|--------|--------|
| β₄₋₆ | Asset class | TickerConfig.class | Energy/fear/currency/equity/media have distinct face shapes |
| β₇₋₁₀ | Family | TickerConfig.family | Brent/WTI are cousins; VIX/gold are siblings |
| β₁₁₋₁₃ | Average daily volume (pre-crisis) | Pre-computed baseline | High-volume = heavier, broader face. Low-volume = thinner. |
| β₁₄₋₁₆ | Historical volatility regime | Pre-crisis 30d realized vol | High-vol instruments have more angular, tense-looking structure |
| β₁₇₋₂₀ | Correlation to Brent (pre-crisis) | Pre-computed | Highly correlated instruments look MORE like the Brent family. Uncorrelated look alien. |

**Expression (ψ₆₋₂₀) data bindings:**

| Dims | Binding | Source | Effect |
|------|---------|--------|--------|
| ψ₆₋₁₀ | Velocity (rate of change) | Per-frame Δclose/Δt | Sharp drop = shock register (brow raise, mouth open). Slow grind = dread register (brow furrow, mouth tight). Recovery = relief (brow relax). |
| ψ₁₁₋₁₅ | Volatility (local variance) | Rolling 6hr stddev | High vol = complex expression (multiple registers active — face looks conflicted). Low vol = clean expression (frozen scream or frozen calm). |
| ψ₁₆₋₂₀ | Volume anomaly | Current vol / baseline vol | Surge = widened eyes, flared nostrils (alertness). Collapse = drooping, slack (exhaustion/capitulation). |

**Design rule:** These dimensions should be detectable when you LOOK AT a face, but not
screamingly obvious from the field-read distance. They reward scanning. They're why the
viewer's eye lingers on one face and skips another.

### Tier 3 — The Inspection Read (2-5sec, feature-level)

The viewer is staring at ONE face. Inspecting features. Comparing to neighbors.
This is the pause-and-hover experience. The tooltip decodes what the viewer noticed.

**What the viewer perceives:** "The nose is wider than its siblings." "The eyes look
different from last frame." "Something about this face is off but I can't say what."

**Shape (β₂₁₋₅₀) data bindings:**

| Dims | Binding | Source | Effect |
|------|---------|--------|--------|
| β₂₁₋₂₅ | Correlation to SPY (pre-crisis) | Pre-computed | How equity-like is this instrument |
| β₂₆₋₃₀ | Market cap / notional weight | Static metadata | How "important" is this instrument (bigger face = bigger instrument? or subtler) |
| β₃₁₋₃₅ | Spread to family mean (pre-crisis) | Pre-computed | How different is this ticker from its siblings normally |
| β₃₆₋₄₀ | Skewness of returns (pre-crisis) | Pre-computed | Fat-tailed instruments have subtly asymmetric face structure |
| β₄₁₋₅₀ | Reserved for empirical tuning | TBD | Fill after seeing which components produce the most interesting subtle effects |

**Expression (ψ₂₁₋₄₀) data bindings:**

| Dims | Binding | Source | Effect |
|------|---------|--------|--------|
| ψ₂₁₋₂₅ | Correlation breakdown | Rolling corr to Brent vs baseline | When correlations spike to 1.0, all faces contort similarly — the crowd panics in unison |
| ψ₂₆₋₃₀ | Term structure slope | For futures: contango/backwardation steepness | Young face and old face EXPRESS DIFFERENTLY based on curve shape |
| ψ₃₁₋₃₅ | Cross-asset contagion | Rolling corr to other asset classes | When energy moves like equities, the energy face starts looking like an equity face — subtle and disturbing |
| ψ₃₆₋₄₀ | High-low range / close | Bid-ask spread proxy | Wider spread = more strained micro-expression |

**Design rule:** These dimensions should be INVISIBLE from the field-read. They reward
focused inspection. They're the reason a viewer says "I can't stop looking at this face"
without knowing why.

### The Sarasti Residual (β₅₁₋₁₀₀, ψ₄₁₋₁₀₀)

**110 dimensions.** More than half the total capacity.

These are NOT bound to named quantities. They carry the **unexplained variance** —
the patterns in the data that aren't captured by the explicit tier 1-3 bindings.

**Method:**
1. For each ticker at each frame, compute the FULL feature vector (all the named
   quantities from tiers 1-3)
2. Run PCA on the residuals (actual price action minus what the named bindings predict)
3. Map the first 50 residual PCA components → β₅₁₋₁₀₀ (structural residuals —
   things about this instrument's statistical personality that aren't captured by
   class/family/vol/correlation)
4. Map the next 60 residual PCA components → ψ₄₁₋₁₀₀ (dynamic residuals —
   things about this instrument's crisis behavior that aren't captured by
   deviation/velocity/volatility/volume)

**What the viewer perceives:** "Something about this face is off but I can't say what."
The tooltip shows: `residual magnitude: 2.3σ`. The viewer noticed a pattern that
doesn't have a name yet. The face detected it before the analyst did.

**This is the art statement.** The named bindings are journalism. The Sarasti residual
is the thing that makes this art — the face as anomaly detector, the fusiform gyrus
as unsupervised learning, the viewer as the instrument.

---

## Data Enrichment (pull_market_data.py changes)

The market pull script must pre-compute all tier 2-3 fields. Currently it computes:
deviation, velocity, volatility. It needs:

### New static fields (per ticker, computed once from pre-crisis baseline):
```python
# Pre-crisis window: Feb 25 00:00 → Feb 27 23:00
for ticker in tickers:
    baseline_window = data[ticker]['2026-02-25':'2026-02-27']
    ticker_meta[ticker]['avg_volume'] = baseline_window.volume.mean()
    ticker_meta[ticker]['hist_volatility'] = baseline_window.close.pct_change().std()
    ticker_meta[ticker]['corr_to_brent'] = baseline_window.close.corr(brent_baseline.close)
    ticker_meta[ticker]['corr_to_spy'] = baseline_window.close.corr(spy_baseline.close)
    ticker_meta[ticker]['skewness'] = baseline_window.close.pct_change().skew()
    ticker_meta[ticker]['spread_from_family'] = ... # deviation from family mean price level
```

### New per-frame fields (per ticker per timestamp):
```python
for frame in frames:
    for ticker in tickers:
        window = rolling_6hr(data[ticker], frame.timestamp)
        frame[ticker]['volume_anomaly'] = window.volume.mean() / ticker_meta[ticker]['avg_volume']
        frame[ticker]['rolling_corr_brent'] = window.close.rolling(6).corr(brent.close)
        frame[ticker]['corr_breakdown'] = abs(frame[ticker]['rolling_corr_brent'] - ticker_meta[ticker]['corr_to_brent'])
        frame[ticker]['high_low_ratio'] = (window.high - window.low) / window.close  # spread proxy

        # For futures families only:
        if ticker in futures_family:
            family_prices = [frame[t]['close'] for t in same_family_tickers]
            frame[ticker]['term_slope'] = np.polyfit(tenor_months, family_prices, 1)[0]

        # Cross-asset contagion: rolling correlation to other classes
        other_classes = [t for t in tickers if t.class != ticker.class]
        frame[ticker]['cross_contagion'] = mean([window.close.corr(data[t].close) for t in other_classes])
```

### Sarasti residual computation:
```python
# After all named features are computed:
# 1. Build full feature matrix: (n_tickers * n_frames) × n_named_features
# 2. Run PCA on residuals after removing named-feature variance
# 3. First 50 components → shape_residuals (per ticker, static)
# 4. Next 60 components → expr_residuals (per ticker per frame, dynamic)
# 5. Store in market-history.json alongside named features
```

### Updated JSON schema:
```json
{
  "tickers": {
    "BZ=F": {
      "name": "Brent Crude Spot",
      "class": "energy",
      "family": "brent",
      "age": 20,
      "static": {
        "avg_volume": 142300,
        "hist_volatility": 0.018,
        "corr_to_brent": 1.0,
        "corr_to_spy": 0.32,
        "skewness": -0.41,
        "spread_from_family": 0.0,
        "shape_residuals": [0.12, -0.34, ...]
      },
      "data": [
        {
          "t": "2026-02-25T00:00:00Z",
          "o": 74.2, "h": 74.5, "l": 73.8, "c": 74.3, "v": 12340,
          "deviation": 0.0,
          "velocity": 0.001,
          "volatility": 0.012,
          "volume_anomaly": 0.97,
          "corr_breakdown": 0.02,
          "term_slope": 0.15,
          "cross_contagion": 0.18,
          "high_low_ratio": 0.009,
          "expr_residuals": [0.01, -0.02, ...]
        }
      ]
    }
  }
}
```

---

## Binding Resolver Changes

### shape-resolver update:
```
Current: β₁₋₃ (age) + β₄₋₆ (class) + β₇₋₁₀ (family) = 10 dims

New:
  Tier 1: β₁₋₃   ← age                          (already implemented)
  Tier 2: β₄₋₆   ← class                        (already implemented)
          β₇₋₁₀  ← family                       (already implemented)
          β₁₁₋₁₃ ← avg_volume (normalized)       NEW
          β₁₄₋₁₆ ← hist_volatility (normalized)  NEW
          β₁₇₋₂₀ ← corr_to_brent (normalized)    NEW
  Tier 3: β₂₁₋₂₅ ← corr_to_spy                   NEW
          β₂₆₋₃₀ ← market_cap / notional          NEW
          β₃₁₋₃₅ ← spread_from_family              NEW
          β₃₆₋₄₀ ← skewness                        NEW
          β₄₁₋₅₀ ← reserved (empirical tuning)     STUB
  Sarasti: β₅₁₋₁₀₀ ← shape_residuals               NEW
```

### expression-resolver update:
```
Current: ψ₁₋₅ (crisis) + ψ₆₋₁₀ (velocity) + ψ₁₁₋₁₅ (volatility) = 15 dims

New:
  Tier 1: ψ₁₋₅   ← deviation                     (already implemented)
  Tier 2: ψ₆₋₁₀  ← velocity                      (already implemented)
          ψ₁₁₋₁₅ ← volatility                    (already implemented)
          ψ₁₆₋₂₀ ← volume_anomaly                 NEW
  Tier 3: ψ₂₁₋₂₅ ← corr_breakdown                 NEW
          ψ₂₆₋₃₀ ← term_slope                      NEW
          ψ₃₁₋₃₅ ← cross_contagion                  NEW
          ψ₃₆₋₄₀ ← high_low_ratio                   NEW
  Sarasti: ψ₄₁₋₁₀₀ ← expr_residuals                 NEW
```

---

## Empirical Tuning Protocol

The above assigns data→dimension-ranges. But WHICH specific FLAME PCA component
(e.g. "β₁₄ specifically") maps to WHICH perceptual effect (e.g. "angular jaw")
requires empirical sweeps.

### Phase 1: Component census
For each of the first 50 β components and first 40 ψ components:
1. Render a face at -2σ, 0, +2σ on that single component, all others zero
2. Screenshot the three faces side by side
3. Describe the visual effect: "β₇ controls jaw width" / "ψ₃ controls mouth downturn"
4. Tag: which TIER does this visual effect serve?
   - Large visible change at small face size → tier 1
   - Visible at fixation, changes face identity → tier 2
   - Subtle, requires inspection → tier 3

### Phase 2: Assignment optimization
Given the census, optimize the data→component mapping:
- Most important crisis signal (deviation) → the ψ components with the largest
  tier-1 visual effects
- Age → the β components that most convincingly change perceived age
- Asset class → the β components that produce the most distinct identity clusters

### Phase 3: Sarasti residual validation
1. Render all 25 faces at T=Mar 1 with full tier 1-3 bindings + Sarasti residuals
2. Render same faces WITHOUT Sarasti residuals
3. Screenshot both
4. Ask: does the Sarasti version feel "richer" / "more detailed" / "more unsettling"?
   If yes, the residuals are carrying perceptible signal. Ship it.

---

## Worktree Structure

```
sarasti/binding-refinement (TL: Opus, forked from main after wave 1 merge)
│
├── sarasti/binding-refinement/data-enrichment (Dev: Gemini)
│   Update pull_market_data.py + pull_gdelt.py
│   Add all new static + per-frame fields
│   Compute Sarasti residuals (PCA on residual matrix)
│   Re-pull data, regenerate market-history.json
│   Tests: all new fields present, no NaN, residuals sum to ~0
│
├── sarasti/binding-refinement/component-census (Dev: Gemini)
│   New script: tools/flame-census.ts
│   For β₁₋₅₀ and ψ₁₋₄₀: render -2σ/0/+2σ triplets
│   Output: census-shape.png (50 triplet strips), census-expr.png (40 strips)
│   Output: census.json mapping component → visual description → tier assignment
│   VISUAL CHECK — REQUIRED: inspect every strip, describe effects
│
├── sarasti/binding-refinement/shape-enrichment (Dev: Gemini)
│   Update src/binding/shape/ to use all 100 β dims
│   Implement tier 2 + tier 3 shape bindings from enriched data
│   Implement Sarasti residual shape injection (β₅₁₋₁₀₀)
│   Uses census.json to pick optimal component assignments
│   Tests: 25 faces with enriched shapes are more visually diverse than without
│   VISUAL CHECK — REQUIRED: gallery 25 neutral expression,
│     before/after enrichment comparison
│
└── sarasti/binding-refinement/expression-enrichment (Dev: Gemini)
    Update src/binding/expression/ to use all 100 ψ dims
    Implement tier 2 + tier 3 expression bindings from enriched data
    Implement Sarasti residual expression injection (ψ₄₁₋₁₀₀)
    Uses census.json to pick optimal component assignments
    Tests: expression responses are more varied and nuanced
    VISUAL CHECK — REQUIRED: animate one face through 20 frames,
      before/after enrichment comparison.
      The enriched version should feel "alive" where the old version felt "mechanical."
```

**PRs to main** after wave 2 merges. Does not conflict with wave 2 work —
wave 2 touches timeline/interaction/ui, this touches data/binding only.

---

## Success Criteria

After this refinement:
- [ ] All 200 FLAME dimensions are bound (no zero-initialized waste)
- [ ] Tier 1 is visible during playback at field-read distance
- [ ] Tier 2 makes individual faces pop during scanning
- [ ] Tier 3 rewards close inspection (faces feel detailed, real, uncanny)
- [ ] Sarasti residual adds perceptible richness (A/B screenshot comparison)
- [ ] Component census documented with screenshots
- [ ] Brent term structure shows BOTH age gradient (shape) AND crisis propagation (expression)
- [ ] VIX face is immediately recognizable as "the fear face" from the field-read
- [ ] GDELT faces look alien relative to financial faces (class identity working)
- [ ] The Feb 28 wavefront is MORE dramatic with full bindings than with placeholder bindings
