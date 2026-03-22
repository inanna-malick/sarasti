# W18 A/B Report: Onset Power Curves

## Summary
The introduction of onset power curves in w18 has successfully addressed the "premature gape" issue observed in w17. By delaying jaw-related features (ψ2) with late-onset curves (p=2.0–2.5) and front-loading mouth tension and eye alertness with early-onset curves (p=0.5–0.7), the system now produces distinct intermediate expressions. Moderate distress (distress ≈ 0.4–0.6) now correctly manifests as "tense vigilance" or "worry" (closed but tight mouth) rather than the "low-level shock" (slack jaw) of w17.

## Per-Ticker Comparison (Crisis — 2026-03-11)
| Ticker | w17 Read | w18 Read | Signal Context | Verdict |
|--------|----------|----------|----------------|---------|
| **ALI=F** | Slight jaw gape, eyes partially alert. | Tight-lipped (ψ0), wide eyes (ψ9). Mouth is firmly closed. | Low Alarm (0.18), High Fatigue (0.72). | **Major Improvement**: Looks "vigilant" instead of "dazed." |
| **CF** | Mouth starting to hang open. Eyes alert. | Intense lip compression (ψ16), wide-eyed focus. No jaw drop. | Low Alarm (0.28), High Fatigue (0.80). | **Improved**: Captures "intense focus" under pressure. |
| **GC=F** | Visible jaw drop (ψ2 ≈ 0.8), reads as sudden shock. | Mouth closed, tight pursing (ψ0). Eyes very wide. | Moderate Alarm (0.53). | **Improved**: "Concerned" look is more professional than "shocked." |
| **NG=F** | Subtle jaw opening. | Tense, closed mouth. | Low Alarm (0.30). | **Minor Improvement**: Cleaner silhouette. |
| **SPY** | Visible jaw drop (ψ2 ≈ 0.7). | Firmly closed mouth, wide eyes. | Moderate Alarm (0.47). | **Improved**: Correctly signals "tension" without "panic." |
| **^VIX** | Extreme jaw drop, full shock. | Extreme jaw drop, full shock. | Extreme Alarm (0.99). | **Neutral**: Both correctly show maximum distress. |
| **XLE** | Slack-jawed wiredness. | Alert eyes, tight mouth. Grimace (ψ6) is suppressed. | Moderate Alarm (0.39), Moderate Wired (0.41). | **Improved**: "Alert but composed." |
| **BRENT**| Dazed, mouth slightly open. | Very wide eyes, closed mouth. | Wired (0.64), Yielding (-0.83). | **Improved**: Yielding eye closure is more poignant with tense mouth. |
| **DX=F** | Slight jaw gape. | Focused, alert eyes. | Moderate Wired (0.56). | **Improved**: Better "caffeinated" look. |
| **HO=F** | Premature jaw drop. | Tense vigilance. | Low Alarm (0.28). | **Improved**: No more "accidental shock." |
| **RB=F** | Large jaw drop (ψ2 ≈ 1.25). | Moderate jaw drop (ψ2 ≈ 0.9), intense brow raise. | Strong Alarm (0.84). | **Improved**: Transition to full shock feels smoother. |
| **^TNX** | Slight gape. | Alert, closed mouth. | Moderate Wired (0.54). | **Improved**: Senior maturity looks more "serious" with closed mouth. |
| **WTI** | Mixed signals, mouth messy. | Sharp eye alert, compressed mouth. | Moderate Alarm (0.44), Wired (0.56). | **Improved**: Deconflicted mouth stacking. |

## Per-Ticker Comparison (Calm — 2026-02-26)
| Ticker | w18 Read | Signal Context | Verdict |
|--------|----------|----------------|---------|
| **ALI=F** | Wide eyes, tight lips. Focused but not panicked. | Moderate Alarm (0.50). | **Solid**: Good "working" expression. |
| **CF** | Calm, slightly yielding. | Low Alarm (0.32), Yielding (-0.77). | **Good**: Subdued but readable. |
| **GC=F** | Strong jaw drop, high alertness. | Strong Alarm (0.84). | **Correct**: High vol response is clear. |
| **NG=F** | Soft, pleasant glow. | Euphoric (-0.13), Yielding (-0.67). | **Good**: Natural "calm" state. |
| **SPY** | Tense but alert. | Low Alarm (0.28), Wired (0.32). | **Solid**: Clean intermediate state. |
| **^VIX** | Strong shock, jaw open. | Strong Alarm (0.79). | **Correct**: Volatility visible. |
| **XLE** | Subdued, slightly pained. | Low Alarm (0.25), Yielding (-0.50). | **Good**: "Bruised" but not "broken." |
| **BRENT**| Starting to show surprise. | Moderate Alarm (0.63). | **Solid**: Jaw just starting to sag (p=2.5). |
| **DX=F** | Alert, slightly wired. | Moderate Alarm (0.39), Wired (0.42). | **Good**: Clear "busy" signal. |
| **HO=F** | Wired, intense focus. | Moderate Alarm (0.41), Wired (0.63). | **Good**: Eyes wide, mouth tight. |
| **RB=F** | Alert, focused. | Moderate Alarm (0.38), Wired (0.67). | **Good**: Consistent with HO=F. |
| **^TNX** | Concerned vigilance. | Moderate Alarm (0.48), Yielding (-0.52). | **Solid**: Dignified under pressure. |
| **WTI** | Full shock, jaw dropped. | Maximum Alarm (1.00). | **Correct**: High-stakes signal. |

## Top 3 Improvements
1. **Intermediate Expression Density**: The range of distress between 0.3 and 0.7 is now visually distinct from both "Neutral" and "Crisis," solving the most common w17 complaint.
2. **Deconfliction of Stacking**: By segregating mouth features into early (tension) and late (opening) phases, stacked activations (e.g., Alarmed + Wired) no longer create grotesque "double-mouth" distortions.
3. **Biological Realism**: The sequence of "alertness → tension → gaping" mirrors human stress responses more accurately than linear scaling.

## Top 3 Remaining Problems
1. **Yielding vs. Alarm Eyes**: Yielding's eye closure (ψ9=-3.5) still overpowers Alarm's wide eyes (ψ9=3.0) at equal magnitudes. A power curve on Yielding might help.
2. **Extreme Jaw Clipping**: At activation > 0.95, stacked recipes can still push ψ2 beyond aesthetic limits.
3. **Euphoric Linearity**: The ALARM_EUPHORIC recipe still uses linear scaling, making it feel less "alive" than the new distress curves.

## Specific Recipe Recommendations
- **Yielding**: Apply p=1.5 (late onset) to ψ9 eye closure so that low-level yielding looks more like a "wince" (partial closure) than a "sleep" (full closure).
- **Alarmed**: Consider a slight boost to ψ4 (brow raise) early onset (p=0.7) to further signal "worry" before mouth tension kicks in.
- **Wired**: Increase p for ψ6 (grimace) from 1.5 to 2.0 to further isolate the mouth stretch to the very top end of volatility.
