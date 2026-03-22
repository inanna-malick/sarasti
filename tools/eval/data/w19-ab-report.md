# W19 A/B Report: Mixing Matrix + Soft-Clip

## Summary
The W19 update successfully resolves the "frozen panic" artifacts observed in W18 by decoupling vitality from alarm and introducing a soft-clip compression for high-activation states. The most dramatic improvements are seen in high-volatility tickers like VIX and WTI, where alarm levels previously hit 1.0, resulting in a locked, unnatural facial state. The raised distress threshold also cleans up "background noise" on calm days, preventing moderate distress from triggering on minor velocity fluctuations. While some residual alarm remains on calm days for tickers with low vitality, the overall expressivity is significantly more natural and readable.

## Per-Ticker Comparison (Crisis — 2026-03-11)
| Ticker | w18 Alarm | w19 Alarm | w18 Read | w19 Read | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ^VIX | 0.987 | 0.667 | 0.668 | 0.576 | **Major Win**: Dropped from frozen shock to readable alarm. |
| SPY | 0.469 | 0.313 | 0.495 | 0.373 | **Win**: More nuanced distress. |
| BRENT | 0.197 | 0.338 | 0.660 | 0.567 | **Mixed**: Alarm increased but distress refined. |
| WTI | 0.438 | 0.465 | 0.562 | 0.450 | **Neutral**: Slight alarm bump, cleaner distress. |
| GC_F | 0.529 | 0.268 | 0.425 | 0.295 | **Win**: Alarm much more proportional to signals. |
| DX_F | 0.271 | 0.313 | 0.503 | 0.382 | **Neutral**: Distress better resolved. |
| _TNX | 0.133 | 0.173 | 0.426 | 0.295 | **Win**: Cleaner read on interest rates. |
| NG_F | 0.304 | 0.028 | 0.078 | -0.071 | **Win**: Eliminated phantom alarm. |
| HO_F | 0.282 | 0.119 | 0.341 | 0.203 | **Win**: Much calmer baseline. |
| RB_F | 0.835 | 0.726 | 0.787 | 0.723 | **Win**: Soft-clip prevents peak-clipping. |
| CF | 0.278 | 0.360 | 0.467 | 0.342 | **Neutral**: Distress resolution improved. |
| ALI_F | 0.177 | 0.225 | 0.351 | 0.213 | **Win**: Better separation of signals. |
| XLE | 0.391 | 0.368 | 0.497 | 0.376 | **Win**: Subtle distress refinement. |

## Per-Ticker Comparison (Calm — 2026-02-26)
| Ticker | w18 Alarm | w19 Alarm | w18 Read | w19 Read | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ^VIX | 0.787 | 0.449 | 0.516 | 0.398 | **Major Win**: No longer looks panicked on a calm day. |
| SPY | 0.277 | 0.191 | 0.282 | 0.139 | **Win**: Distress noise significantly reduced. |
| BRENT | 0.630 | 0.352 | 0.436 | 0.307 | **Major Win**: Decoupled alarm from low vitality. |
| WTI | 1.000 | 0.694 | 0.699 | 0.614 | **Major Win**: Fixed "1.0 Alarm" frozen state. |
| GC_F | 0.840 | 0.544 | 0.489 | 0.367 | **Win**: Proportional alarm response. |
| DX_F | 0.393 | 0.378 | 0.513 | 0.394 | **Win**: Better distress thresholding. |
| _TNX | 0.475 | 0.370 | 0.540 | 0.426 | **Win**: Subtle improvement in calm. |
| NG_F | -0.132 | -0.167 | 0.168 | 0.019 | **Win**: Distress noise Floor clean. |
| HO_F | 0.406 | 0.463 | 0.579 | 0.471 | **Neutral**: Slightly higher alarm but better distress. |
| RB_F | 0.383 | 0.476 | 0.629 | 0.530 | **Neutral**: More consistent with peer energy. |
| CF | 0.321 | 0.165 | 0.395 | 0.262 | **Win**: Much cleaner calm read. |
| ALI_F | 0.496 | 0.435 | 0.548 | 0.435 | **Win**: Reduced background worry. |
| XLE | 0.255 | 0.049 | 0.240 | 0.095 | **Win**: Extremely clean baseline. |

## Top 3 Improvements
1. **Elimination of Frozen States**: Tickers like WTI (w18 Calm Alarm 1.0) no longer lock into a "statue-like" shock pose thanks to the soft-clip compression above 0.85.
2. **Vitality/Alarm Decoupling**: VIX and BRENT no longer scream "alarm" simply because vitality (liquidity/momentum) is low. The reduction in coupling (-0.4 → -0.15) allows the face to look depleted without looking terrified.
3. **Distress Noise Floor**: Raising the distress threshold (-0.5 → -0.8) has successfully cleaned up "worry" on calm days (e.g., SPY calm distress dropped from 0.28 to 0.14).

## Top 3 Remaining Problems
1. **Mouth-Dominance**: High alarm still relies heavily on mouth openness (Ape_Jaw_Open), which can look repetitive across different tickers.
2. **Brow Resolution**: While eye power curves (p=1.5) helped the lids, the brows often feel static in mid-range distress states.
3. **Residual Alarm in Calm**: Tickers like WTI still show ~0.69 alarm on a calm day; while better than 1.0, it still feels high for "Calm."

## Specific Recipe Recommendations
- **Increase Brow Coupling**: Link distress more aggressively to brow furrow (ψ2/ψ4) to differentiate between "surprised" (alarm) and "suffering" (distress).
- **Lower Vitality-Alarm Coupling Further**: For "Calm" days, consider a conditional floor or steeper decay on the vitality→alarm spike to bring WTI/VIX baseline alarm below 0.3.
- **Asymmetric Mouth**: Introduce slight asymmetry in high alarm/distress to break the "perfect" shock look and make it feel more organic/human.