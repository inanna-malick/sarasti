# FACS-Style Expression System Analysis (Axes-v2)

**Evaluator:** Gemini FACS Expert  
**Date:** Friday, March 20, 2026  
**Subject:** 3D Facial Expression System Orthogonality Audit (Tension vs. Valence)

## 1. Tension Gradient AU Inventory
The Tension axis maps to the upper face, primarily affecting the brow and periorbital regions.

| Step | Activation | Observed Action Units (AUs) | Perceptual Quality |
| :--- | :--- | :--- | :--- |
| 00 | t=-1.00 | **AU1+2** (Inner/Outer Brow Raise), **AU5** (Upper Lid Raise) | High Alert / Surprise |
| 02 | t=-0.50 | **AU1+2** (Moderate), **AU5** (Mild) | Attentive / Skeptical |
| 04 | t=+0.00 | None (Baseline) | Neutral / Relaxed |
| 06 | t=+0.50 | **AU4** (Brow Lowerer), **AU7** (Lid Tightener) | Focused / Concerned |
| 08 | t=+1.00 | **AU4** (Strong Knit), **AU7** (Maximum Squint) | Intense / Angry |

**Key Findings:** The tension axis correctly utilizes the upper-face $\psi$ components. The transition from brow-raising (negative tension) to brow-knitting (positive tension) is smooth and follows expected FACS morphology for "arousal" or "effort."

## 2. Valence Gradient AU Inventory
The Valence axis maps to the lower face, primarily affecting the mouth, lips, and chin.

| Step | Activation | Observed Action Units (AUs) | Perceptual Quality |
| :--- | :--- | :--- | :--- |
| 00 | v=-1.00 | **AU15** (Lip Corner Depressor), **AU17** (Chin Raiser), **AU10** (Upper Lip Raiser) | Sad / Displeased / Disgusted |
| 02 | v=-0.50 | **AU15** (Mild), **AU17** (Subtle) | Pouting / Mild Displeasure |
| 04 | v=+0.00 | None (Baseline) | Neutral |
| 06 | v=+0.50 | **AU12** (Lip Corner Puller), **AU25** (Lips Part) | Pleasant / Content |
| 08 | v=+1.00 | **AU12** (Broad Smile), **AU25** (Mouth Open), **AU6** (Cheek Raiser - Coupling?) | Happy / Joyful |

**Key Findings:** The valence axis effectively spans the hedonic range. The negative end (-1.0) is a complex blend of sadness (15) and displeasure (17), while the positive end (+1.0) is a clear zygomaticus major (12) activation.

## 3. Crosstalk Audit
**Goal:** Zero Crosstalk (Tension $\perp$ Valence).

### Tension $ightarrow$ Mouth
*   **Result:** **NEAR ZERO CROSSTALK.**
*   **Observation:** The mouth remains remarkably stable across the tension gradient. At $t=-1.0$, there is a very subtle passive parting of the lips (passive **AU25**), likely due to the skin being pulled upward by the strong brow raise, but no active lower-face muscle activation is detected.

### Valence $ightarrow$ Eyes/Brows
*   **Result:** **SUBTLE COUPLING DETECTED.**
*   **Observation 1 (Negative Valence):** At $v=-1.0$, there is a visible lowering of the inner brow. This looks like a subtle **AU4** (Brow Lowerer) activation. This is a common biological coupling (sadness/disgust often involve the brow), but for a strictly orthogonal system, this should be minimized.
*   **Observation 2 (Positive Valence):** At $v=+1.0$, there is a clear narrowing of the eye aperture. This is **AU6** (Cheek Raiser) activation. While AU6 is part of a genuine "Duchenne" smile, in this system, it represents crosstalk if the eyes are supposed to be controlled ONLY by the tension axis.

## 4. Signal Strength Comparison
*   **Visual Displacement:** The **Valence** axis produces significantly more "total facial displacement" than the Tension axis. The mouth and chin movement at $v=\pm1.0$ covers a larger surface area and has more geometric depth change than the brow/eye movements at $t=\pm1.0$.
*   **Estimated Ratio:** **1.4 : 1** (Valence : Tension). Perceptually, the face feels "moved" more by the smile/frown than by the brow raise/knit.

## 5. Composition Analysis (Diagnostic Pairs)
Using the `diag_calm` vs `diag_tense` pairs at various valence levels:
*   **Additivity:** The effects are strictly additive. The tension signal (brow knit) is just as strong at $v=-0.9$ as it is at $v=0$. There is no "axis suppression."
*   **Perceptual Emergence:** 
    *   `diag_tense_v-0.9` (High Tension + Low Valence) $ightarrow$ **Anger / Frustration.**
    *   `diag_calm_v-0.9` (Low Tension + Low Valence) $ightarrow$ **Melancholy / Pure Sadness.**
*   The system successfully allows for "Intense Sadness" vs "Quiet Sadness" through the tension axis.

## 6. Alternative Decompositions
If the goal is perceptual balance rather than anatomical (Upper/Lower) split:

1.  **Arousal/Activation Axis:** 
    *   Include **AU5** (Eyes wide), **AU26/27** (Jaw drop), and **AU1+2** (Brow raise).
    *   This would represent "Shock/Energy."
2.  **Hedonic/Signaling Axis:** 
    *   Include **AU12** (Smile) vs **AU15/17/4** (Frown/Knit).
    *   This would represent "Approach/Avoidance."

However, the current Upper/Lower split is technically sound and easier to debug for $\psi$ component weightings. The primary recommendation is to **de-couple AU6 (Cheek Raiser) from the Valence axis** and ensure the brow-lower (AU4) components are not inadvertently weighted into the Valence components (0, 2, 3, 6, 7, 16, 26).
