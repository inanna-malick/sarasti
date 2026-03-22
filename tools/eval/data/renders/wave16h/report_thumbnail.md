# Thumbnail Distinguishability Report (Wave 16h)
**Evaluation Size:** 48px - 64px
**Date:** March 19, 2026

## Executive Summary
At dashboard scale (48px), fine muscle movements are lost. Only high-contrast structural changes (mouth aperture, eye area darkness, silhouette) remain viable as UI signals.

## Expression Analysis

| Expression | Neutral Delta (1-5) | Surviving Feature | Thumbnail Signature |
| :--- | :---: | :--- | :--- |
| **Neutral** | - | Base face | Flat baseline. |
| **Alarmed** | 5 | Dark mouth void | "The O-mouth". High contrast. |
| **Euphoric** | 5 | Wide smile line | "The U-mouth". Bright cheek peaks. |
| **Wired** | 4 | Wide eye whites | High-frequency eye area. Confusable with Alarmed. |
| **Exhausted** | 4 | Heavy eye sockets | Darkened top-third of face. |
| **Aggressive** | 5 | Narrow eye slit | "V" brow + lower face tension. |
| **Yielding** | 2 | Softened eyes | Very subtle. Mostly relies on head tilt (if any). |
| **Smirk** | 4 | Asymmetric mouth | Unbalanced horizontal line. |
| **Combo Crisis** | 5 | High brow tension | High contrast "shadows" in eye area. |
| **Combo Calm** | 2 | Low contrast | Nearly identical to neutral at 48px. |
| **Full Sharp-Chad** | 5 | Angular jawline | Silhouette change is the primary signal. |
| **Full Puffy-Soy** | 5 | Round silhouette | "Balloon" face shape vs angular Chad. |

## Confusion Matrix (48px Simulation)

| | NEU | ALA | EUP | WIR | EXH | AGG | YIE | SMI |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **NEU** | **90%** | 2% | 0% | 0% | 5% | 0% | 3% | 0% |
| **ALA** | 0% | **85%** | 5% | 10% | 0% | 0% | 0% | 0% |
| **EUP** | 0% | 5% | **95%** | 0% | 0% | 0% | 0% | 0% |
| **WIR** | 0% | **20%** | 0% | **75%** | 5% | 0% | 0% | 0% |
| **EXH** | 15% | 0% | 0% | 0% | **80%** | 0% | 5% | 0% |
| **AGG** | 0% | 0% | 0% | 5% | 0% | **90%** | 0% | 5% |
| **YIE** | **40%** | 0% | 0% | 0% | 10% | 0% | **50%** | 0% |
| **SMI** | 10% | 0% | 10% | 0% | 0% | 0% | 0% | **80%** |

## Key Findings & Recommendations

1. **The Alarmed/Wired Overlap:** At small sizes, "wide eyes" and "open mouth" start to merge. Wired needs more eye-white contrast or a more distinct mouth shape (maybe jaw tension) to avoid being read as a "weak" Alarmed.
2. **Yielding/Calm Failure:** These expressions are effectively invisible at 48px. If these states are critical for the UI, they must be augmented by external cues (color tint, icon, or unique head tilt).
3. **Silhouette Dominance:** The "Chad" vs "Soy" distinction (Shape) is 10x more visible than any subtle expression (Pose). If the UI needs to signal identity, prioritize bone structure. If it needs to signal state, prioritize mouth aperture.
4. **Smirk Asymmetry:** Asymmetry is a "cheat code" for thumbnail visibility. The Smirk survives much better than Yielding because it breaks the facial symmetry, which the eye catches even in low resolution.

## Recommended Signal Hierarchy
1. **Mouth Open/Closed** (Binary intensity)
2. **Face Silhouette** (Identity/Type)
3. **Mouth Curve** (Positive/Negative sentiment)
4. **Eye Aperture** (Alertness)
