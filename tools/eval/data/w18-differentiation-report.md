# W18 Differentiation Report

## Quick Stats
- Total renders evaluated: 26
- Distinct visual clusters: 5 (~2.32 bits)
- Mean calm↔crisis contrast: MODERATE-to-STRONG

## Cluster Map

### 1. "Frozen Panic"
- **Visuals**: Wide eyes (high alarm), drawn features (high distress), lack of muscle tone/droop (very low vitality).
- **Members**: `^VIX` (Calm & Crisis), `WTI` (Calm), `RB=F` (Crisis), `GC=F` (Calm).
- **Distinctiveness**: Most extreme and recognizable. Faces look "shocked" and paralyzed.

### 2. "Hyper-Alert / Wired"
- **Visuals**: Tense jaw (high fatigue/aggression), bright eyes (high vitality), forward lean.
- **Members**: `ALI=F` (Crisis), `CF` (Crisis), `WTI` (Crisis), `RB=F` (Calm), `HO=F` (Calm), `BRENT` (Crisis).
- **Distinctiveness**: Looks "on edge" or manic. High information density but hard to distinguish from "Aggressive" without side-by-side comparison.

### 3. "Sleepy Composure"
- **Visuals**: Relaxed features, mid-range activations, neutral gaze.
- **Members**: `SPY` (Calm), `XLE` (Calm), `NG=F` (Calm), `DX=F` (Calm).
- **Distinctiveness**: The "baseline" face. Different assets in this cluster look very similar (the "mask" effect).

### 4. "Sunken Gloom"
- **Visuals**: Heavy lids (low vitality), low alarm, slight frown (mid distress).
- **Members**: `GC=F` (Crisis), `BRENT` (Calm), `NG=F` (Crisis).
- **Distinctiveness**: Subtler than Panic. Conveys "exhaustion" or "bear market fatigue."

### 5. "Silver-Haired Authority"
- **Visuals**: Distinct maturity (high skinAge/maturity), composed but sharp.
- **Members**: `^TNX` (Calm & Crisis), `SPY` (Crisis), `GC=F` (Crisis).
- **Distinctiveness**: Maturity signal dominates other expressions, making these faces feel like a separate class of "older" individuals.

## Calm vs Crisis Contrast Grid

| Ticker | Calm Cluster | Crisis Cluster | Contrast Grade | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **ALI=F** | Sleepy Composure | Hyper-Alert | **STRONG** | Massive jump in vitality and fatigue. |
| **BRENT** | Sunken Gloom | Hyper-Alert | **STRONG** | Flip from exhausted to wired. |
| **CF** | Sleepy Composure | Hyper-Alert | **STRONG** | High aggression spike in crisis. |
| **DX=F** | Sleepy Composure | Hyper-Alert | **MODERATE** | Subtle increase in vitality/fatigue. |
| **GC=F** | Frozen Panic | Sunken Gloom | **MODERATE** | Panic subsides into exhaustion. |
| **HO=F** | Hyper-Alert | Sunken Gloom | **MODERATE** | Calm was actually more "wired" than crisis. |
| **NG=F** | Sleepy Composure | Sunken Gloom | **STRONG** | Alarm flip from negative to positive. |
| **RB=F** | Hyper-Alert | Frozen Panic | **STRONG** | Total shift in vitality and alarm. |
| **SPY** | Sleepy Composure | Sunken Gloom | **MODERATE** | Typical equity "slow fade." |
| **WTI** | Frozen Panic | Hyper-Alert | **STRONG** | Sharpest contrast; panic vs wired. |
| **XLE** | Sleepy Composure | Hyper-Alert | **MODERATE** | Energy beta-moving with WTI. |
| **^TNX** | Sleepy Composure | Hyper-Alert | **STRONG** | Vitality surge is very visible on mature face. |
| **^VIX** | Frozen Panic | Frozen Panic | **WEAK** | Both look terrified; hard to distinguish degree. |

## Cross-Asset Differentiation

- **Energy Complex**: Shows the highest volatility in expression. `WTI` and `BRENT` often trade places in "intensity," but `NG=F` remains the outlier with its unique "calm-neg-alarm" state.
- **Safe Havens**: `^TNX` is the most distinctive due to the Maturity axis. `GC=F` (Gold) tends to look more distressed than the others, which matches its "fear hedge" status.
- **Equities**: `SPY` and `XLE` are still too "centered." They rarely hit the extreme "Panic" or "Hyper-Alert" states, making them look like the "boring" part of the grid.
- **Volatility**: `^VIX` is successfully "pegged" to the Frozen Panic cluster, but it lacks dynamic range (it's always panic).

## Intermediate Expression Assessment

The power curves in w18 have successfully introduced "transitional" states. We are no longer seeing a binary snap between "Neutral" and "Scream." 
- `SPY` and `XLE` crisis faces show a "tense-closed" look that isn't full panic.
- `BRENT` calm shows a "droopy-but-alert" state (low vitality but mid alarm).
- **Binary Snapping**: Still persists in `WTI` and `^VIX` where activations hit 1.0. This "maxes out" the mesh, losing detail in the expression.

## Recommendations for w19

1. **Dampen VIX/WTI**: Apply a soft-clipping function to alarm activations > 0.8 to prevent the "frozen" look from losing facial nuance.
2. **Equity Gain**: Increase the "Aggression" and "Distress" gain for `SPY` specifically. Equities should look more "pained" in crisis.
3. **Maturity Decoupling**: The "Senior Authority" look (Maturity) is so strong it masks the underlying emotion. We should slightly reduce the texture-weight of `skinAge` so the muscle activations are more visible.
4. **Color Jitter**: Consider using the `flush` axis more aggressively to differentiate "Aggressive" (Red/Flush) from "Panic" (Pale/Negative Flush).
