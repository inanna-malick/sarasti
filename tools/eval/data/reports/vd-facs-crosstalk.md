# FACS Analysis: Variant D Axis Independence and Crosstalk

**Subject:** Variant D Expression Axis Analysis  
**Date:** March 20, 2026  
**Analyst:** FACS Expert (Gemini CLI)

## Executive Summary
Variant D was designed with a specific architectural shift in jaw ownership: AU26 (Jaw Drop) was moved from the Valence axis to the Tension axis (ψ2). This analysis evaluates the effectiveness of this move and measures the resulting axis independence (crosstalk). 

Findings indicate that the jaw-to-tension mapping is highly successful and provides a powerful, unambiguous signal for high-tension states (e.g., manic excitement, panicked screaming). Unwanted crosstalk remains minimal, with some natural, physiologically expected sharing in the mid-face region.

---

## 1. Tension Gradient AU Analysis (valence=0, tension sweep [-1, +1])

The tension axis (ψ2) primarily drives the upper face and, in Variant D, the jaw.

| Step | t-value | Observed AUs | FACS Description |
|:---|:---|:---|:---|
| 00 | -1.00 | AU4B, AU7A | Brows slightly lowered (B-intensity), lids slightly tightened. Calm, focused, or mildly skeptical. |
| 01 | -0.75 | AU4A | Minor brow lowering. Neutralizing. |
| 02 | -0.50 | - | Near neutral upper face. |
| 03 | -0.25 | - | Neutral. |
| 04 | +0.00 | - | **Neutral Point.** |
| 05 | +0.25 | AU5A, AU26A | Trace upper lid raise and trace jaw drop. Teeth remain covered. |
| 06 | +0.50 | AU5B, AU26B, AU25A | Upper lids raised (B-intensity). Jaw drop (B-intensity) causing lips to part (AU25). |
| 07 | +0.75 | AU1+2C, AU5C, AU26C | Inner and outer brow raise (C-intensity). Wide eyes. Significant jaw drop. |
| 08 | +1.00 | AU1+2D, AU5D, AU26D, AU27C | Intense brow raise and eye widening. Maximum jaw drop (D-intensity). Mouth stretch (AU27) becoming visible. |

**Tension-Driven Jaw Tracking:** The jaw tracks tension linearly from t=0.25 to t=1.00. This is "controlled crosstalk" by design. At t=+1.00, the jaw is wide open, typical of high-arousal states.

---

## 2. Valence Gradient AU Analysis (tension=0, valence sweep [-1, +1])

The valence axis (ψ1) primarily drives the lower face (mouth corners).

| Step | v-value | Observed AUs | FACS Description |
|:---|:---|:---|:---|
| 00 | -1.00 | AU4B, AU15D, AU17C | Brows lowered (AU4). Intense lip corner depression (AU15) and chin raise (AU17). Sadness/Anger archetype. |
| 02 | -0.50 | AU15B | Moderate lip corner depression. |
| 04 | +0.00 | - | **Neutral Point.** |
| 06 | +0.50 | AU6A, AU12B | Trace cheek raise and moderate lip corner pull. Gentle smile. |
| 08 | +1.00 | AU6C, AU12D, AU25B | Intense cheek raise (AU6C) and lip corner pull (AU12D). Duchenne smile. Lips part (AU25) but JAW REMAINS CLOSED. |

**Independence Check:** In the valence sweep, AU26 (Jaw Drop) remains at zero intensity. Even at maximum positive valence (v=+1.00), the smile is "closed-jaw," confirming that valence no longer owns the jaw. Similarly, brow movement on the valence axis is minimal, limited to a naturalistic AU4 activation at v=-1.00.

---

## 3. Crosstalk Matrix

| Region | Tension Axis (ψ2) | Valence Axis (ψ1) | Evaluation |
|:---|:---|:---|:---|
| **Upper Face** (AU1, 2, 4, 5) | **Primary Owner.** Intense activation. | Trace AU4 at v=-1.00. | Clean separation. |
| **Mid Face** (AU6, 9, 10) | None. | **Primary Owner.** AU6 tracks valence. | Clean separation. |
| **Lower Face** (AU12, 15, 17, 20) | None. | **Primary Owner.** | Clean separation. |
| **Jaw** (AU26, 27) | **Primary Owner.** Linear tracking. | **NONE.** | Success (Variant D Goal). |
| **Pose** | Pitch (t=+1 is tilt up). | Roll (v=+1 is roll right). | Well separated. |
| **Texture** | Fatigue (under-eye darkness). | Flush (cheek/nose redness). | Well separated. |

---

## 4. Jaw Ownership Assessment

The relocation of ψ2 (jaw drop) from valence to tension is the defining feature of Variant D. 

**Does it work?**
Yes. In all test images, jaw position is a purely tension-dependent variable. 
- A high-valence, low-tension face (`vd_corner_content`) has a wide smile but a closed jaw.
- A neutral-valence, high-tension face (`vd_tension_08`) has a wide-open jaw but neutral mouth corners.
- A low-valence, high-tension face (`vd_corner_panicked`) has a wide-open jaw and depressed mouth corners (screaming).

This separation allows for a much broader range of expressive archetypes than previous variants where the jaw was tied to the "intensity" of the smile.

---

## 5. Diagnostic Pair Analysis

We compared calm (t=-0.6) vs. tense (t=+0.6) states at three negative valence levels (-0.3, -0.6, -0.9).

### Pair 1: v = -0.3 (Mild Negativity)
- **vd_diag_calm_v-0.3**: Neutral brows, slightly tightened lids, closed jaw. Looks "grumpy" or "bored."
- **vd_diag_tense_v-0.3**: Raised brows (AU1+2), wide eyes (AU5), moderately open jaw (AU26). Looks "surprised and slightly annoyed."
- **Discriminability: 10/10**. The difference in jaw and eye aperture is unmistakable.

### Pair 2: v = -0.6 (Moderate Negativity)
- **vd_diag_calm_v-0.6**: Visible AU15 (lip corner depression), neutral jaw. Looks "sad."
- **vd_diag_tense_v-0.6**: AU15 PLUS raised brows and open jaw. Looks "distressed" or "protesting."
- **Discriminability: 10/10**.

### Pair 3: v = -0.9 (Intense Negativity)
- **vd_diag_calm_v-0.9**: Intense AU15/AU17, closed jaw. Looks "deeply depressed" or "pouting."
- **vd_diag_tense_v-0.9**: Intense AU15 PLUS wide-open jaw and raised brows. Looks "aghast" or "screaming."
- **Discriminability: 10/10**.

---

## 6. Recommendations

### Problematic Crosstalk
- **AU4 on Valence**: The minor brow lowering at v=-1.00 is slightly redundant with the tension axis's own brow lowering (t=-1.00). However, it is physiologically natural for negative valence. No change recommended.
- **AU6 on Valence**: Cheek raising naturally narrows the eye aperture. This could be mistaken for tension-driven lid tightening (AU7), but since they are distinct AUs, this is acceptable "ecological" crosstalk.

### Beneficial Crosstalk
- **Jaw on Tension**: This is the "killer feature" of Variant D. It enables the "panicked scream" and "manic laugh" archetypes which were previously impossible. It should be retained.

### Suggested Changes
1. **Pose Pitch**: The pitch tilt-up at high tension is effective for "arrogance" or "surprise," but at v=-1, t=+1 (Panicked), a tilt-down might look more "aggressive/fearful." Consider if pitch should be a joint function of ψ1 and ψ2.
2. **Asymmetry**: Currently, all movements are perfectly symmetrical. Adding a trace of asymmetry to valence (ψ1) ownership of mouth corners would significantly increase realism.

---
**Final Verdict:** Variant D achieved its goal of axis independence for the jaw. The tension axis is now a high-signal "arousal" driver, while the valence axis is a pure "hedonic tone" driver.
