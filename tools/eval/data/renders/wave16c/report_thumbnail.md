# UX Research Report: 3D Face Render Distinguishability (Thumbnail Scale)

**Date:** March 19, 2026
**Target Resolution:** 64x64 pixels (Thumbnail/Favicon size)
**Dataset:** `tools/eval/data/renders/wave16c/` (Front-view renders)

## 1. Group Sort (Clustering)

At 64x64 resolution, fine details (wrinkles, subtle eye narrowing) are lost. Images cluster based on major geometric changes:

*   **Group A: High Intensity / Open Mouth (The "Vocal" Cluster)**
    *   `combo_crisis_front.png`: Large dark mouth void, elongated jaw.
    *   `alarmed_1.0_front.png`: Distinct dark "O" shape in lower face.
    *   `exhausted_1.0_front.png`: Slack jaw, dark slit for mouth, heavy eye shadows.
*   **Group B: Low Intensity / Neutral (The "Identical" Cluster)**
    *   `neutral_front.png`: Baseline.
    *   `combo_calm_front.png`: Indistinguishable from neutral.
    *   `yielding_1.0_front.png`: Indistinguishable from neutral.
    *   `euphoric_1.0_front.png`: Subtle smile disappears; looks like neutral.
*   **Group C: Contrast Standouts**
    *   `wired_1.0_front.png`: "Bright eye dots" due to wide-open sclera contrast.
    *   `smirk_1.0_front.png`: Noticeable mouth asymmetry (wonky horizontal line).
    *   `aggressive_1.0_front.png`: Noticeable "weight" or shadow at the top of the eye sockets (brow furrow).

## 2. Silhouette Test

*   **Mouth Open (`alarmed`, `combo_crisis`, `exhausted`):** **PASS**. The jaw-drop visibly elongates the face and alters the chin contour. `combo_crisis` is the most elongated.
*   **Brow/Upper Face Changes (`aggressive`, `wired`):** **FAIL**. Brow furrowing or eye widening does not change the outer silhouette of the head.
*   **Overall Head Shape:** Constant across all (ears and bald head provide a static frame).

## 3. Color Test

*   **Hue/Saturation Shifts:** None observed. All faces share the same base skin tone.
*   **Perceptual Color Shift:** 
    *   `exhausted` and `combo_crisis` appear "muddier" or "grayer" around the eyes and mouth due to increased shadowing, which could be misinterpreted as a color change (skin fatigue/flushing) at low resolutions.

## 4. Ranking (Most to Least Distinguishable)

| Rank | Expression | Primary Visual Cue at 64x64 |
| :--- | :--- | :--- |
| 1 | `combo_crisis_front` | Large dark void (mouth) + elongated jaw. |
| 2 | `alarmed_1.0_front` | Distinct dark "O" mouth. |
| 3 | `wired_1.0_front` | High-contrast "white dots" (wide eyes). |
| 4 | `smirk_1.0_front` | Asymmetric mouth line. |
| 5 | `exhausted_1.0_front` | Heavy shadowing around eyes/mouth slit. |
| 6 | `aggressive_1.0_front` | Heavy dark bar across brow area. |
| 7 | `euphoric_1.0_front` | Minor mouth widening (barely visible). |
| 8 | `yielding_1.0_front` | Near-neutral. |
| 9 | `combo_calm_front` | Near-neutral. |
| 10 | `neutral_front` | Baseline. |

## Conclusion
For dashboard thumbnails, **Extreme Mouth States** (Open/Asymmetric) and **High Contrast Eye States** are the only reliable ways to communicate expression. Subtle valence changes (euphoric, yielding) are effectively lost at 64px.
