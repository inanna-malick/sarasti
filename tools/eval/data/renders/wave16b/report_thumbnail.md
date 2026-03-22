# UX Research Report: Thumbnail Distinguishability (Wave 16b)

## Objective
Evaluate the distinguishability of 3D face expressions when scaled to thumbnail size (approx. 64x64 pixels).

## 1. Group Sort (Visual Clusters at 64x64)

At 64x64 pixels, subtle geometry (brow furrows, slight lip curls) vanishes. Faces cluster into the following groups:

| Cluster | Expressions | Primary Signal |
| :--- | :--- | :--- |
| **The "Neutral" Void** | `neutral`, `yielding_1.0`, `wired_1.0`, `combo_calm` | Lack of high-contrast features; "flat" appearance. |
| **The Dark Void (Open Mouth)** | `alarmed_1.0`, `combo_crisis` | Large dark oval in the center of the face. |
| **The "Feverish" (Flush)** | `aggressive_1.0`, `combo_crisis` | Noticeable red/warm tint to the skin. |
| **The "Ghostly" (Pallor)** | `exhausted_1.0` | Noticeable desaturation and gray/blue tint. |
| **The "Glint" (Smile)** | `euphoric_1.0` | Bright white pixels (teeth) and warm cheek tones. |
| **The "Lopsided"** | `smirk_1.0` | Asymmetric horizontal line for the mouth. |

## 2. Silhouette Test (Internal & External)

Assuming a "black shape on white" silhouette (including internal cavities like mouth/nostrils as holes):

*   **Identical Silhouettes**: `neutral`, `yielding_1.0`, `wired_1.0`, `combo_calm`. The outer head shape is constant (bald, front view), and mouth lines are too thin to register as "holes."
*   **High Information Silhouettes**: `alarmed_1.0` and `combo_crisis` stand out immediately due to the massive open mouth cavity.
*   **Low Information Silhouettes**: `euphoric_1.0` and `smirk_1.0` might show a slightly wider or slanted mouth line, but it's easily lost.

## 3. Color Test (Global Skin Tone)

Ignoring all geometry, the following color shifts are visible even at extremely low resolutions:

*   **Noticeable Flush (Red)**: `combo_crisis` (Extreme), `aggressive_1.0` (High).
*   **Noticeable Pallor (Gray)**: `exhausted_1.0` (Strong), `combo_calm` (Slight).
*   **Warmth (Pink/Orange)**: `euphoric_1.0`.
*   **Baseline**: `neutral`, `wired_1.0`, `yielding_1.0`.

## 4. Distinguishability Ranking (Most to Least)

1.  **combo_crisis_front.png**: Dual-signal (Huge mouth + Intense red flush).
2.  **alarmed_1.0_front.png**: Single strong signal (Huge mouth contrast).
3.  **exhausted_1.0_front.png**: Global signal (Strong pallor/graying).
4.  **aggressive_1.0_front.png**: Global signal (Strong red flush).
5.  **euphoric_1.0_front.png**: Local signal (Teeth brightness + warm cheeks).
6.  **smirk_1.0_front.png**: Structural signal (Asymmetry).
7.  **wired_1.0_front.png**: Subtle signal (Eye white area increase).
8.  **combo_calm_front.png**: Extremely subtle (Slight desaturation).
9.  **yielding_1.0_front.png**: Virtually identical to neutral.
10. **neutral_front.png**: Baseline.

## 5. Recommendations for Small-Scale UI

To make the "Neutral/Subtle" cluster pop more at thumbnail sizes:

1.  **Exaggerate Color over Geometry**: Use "vividness" (saturation) for `wired` and "deadness" (grayness) for `yielding`.
2.  **Mouth Contrast**: Even for subtle expressions, slightly opening the mouth to show a dark line or teeth glint significantly increases low-res visibility.
3.  **Eye-Area Shadows**: Add "bags" or "dark circles" under eyes for `exhausted` and `yielding` to differentiate them from the "clean" `neutral` and `wired` faces.
4.  **Micro-Tilts**: Even a 2-3 degree head tilt or "chin up/down" would change the silhouette and lighting shadows enough to make them distinguishable without changing the "front view" requirement.
