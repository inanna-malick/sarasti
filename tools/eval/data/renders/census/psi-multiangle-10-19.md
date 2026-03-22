# FLAME Expression Components Analysis: $\psi_{10}$ through $\psi_{19}$

Researcher: Gemini CLI
Date: Thursday, March 19, 2026

## Overview
This report analyzes the expression components $\psi_{10}$ through $\psi_{19}$ of the FLAME 3D face model, based on renders at five values (-3.0, -1.5, 0.0, +1.5, +3.0) and three camera angles (front, left34, closeup).

---

## $\psi_{10}$: Lip Corner Puller (Subtle Smile/Frown)
*   **Negative Pole (-3.0):** The mouth corners are pulled slightly downwards and the lips are tightened. The face takes on a subtle expression of dissatisfaction or a mild frown.
*   **Positive Pole (+3.0):** The mouth corners are pulled slightly upwards and the upper lip arches more. This results in a subtle, pleasant "smirk" or micro-smile.
*   **Angle Differences:** The **closeup** angle is essential for seeing the slight vertical movement of the mouth corners. The **left34** angle shows the subtle change in lip protrusion.
*   **Gradient Smoothness:** 5/5
*   **Label:** Subtle Smile-Frown / Lip Corner Depressor-Levator.
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible.

## $\psi_{11}$: Mouth Stretch vs. Pucker (Lip Funnel)
*   **Negative Pole (-3.0):** The mouth is stretched horizontally, becoming wider and thinner. Nasolabial folds are slightly more pronounced.
*   **Positive Pole (+3.0):** The mouth is narrowed and the lips are pursed/puckered forward. The lips appear much thicker.
*   **Angle Differences:** The **left34** angle clearly shows the forward protrusion of the lips in the positive pole, which is less obvious from the front.
*   **Gradient Smoothness:** 5/5
*   **Label:** Mouth Stretch vs. Pucker (Lip Funnel/Pucker).
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible, though extreme pucker (+3.0) shows high mesh density in the lip area.

## $\psi_{12}$: Upper Lip Elevator / Depressor
*   **Negative Pole (-3.0):** The upper lip is pulled downwards, covering more of the mouth area and shortening the philtrum.
*   **Positive Pole (+3.0):** The upper lip is pulled upwards, exposing the area above the lip and lengthening the philtrum (similar to preparing to show upper teeth).
*   **Angle Differences:** The **left34** angle best captures the vertical translation of the upper lip relative to the nose.
*   **Gradient Smoothness:** 5/5
*   **Label:** Upper Lip Elevator / Depressor.
*   **Symmetry:** Symmetric.
*   **Artifacts:** Slight "pinching" visible near the base of the nose wings at -3.0.

## $\psi_{13}$: Lower Lip Elevator / Depressor
*   **Negative Pole (-3.0):** The lower lip is pulled upwards and slightly forward, bunching the chin area.
*   **Positive Pole (+3.0):** The lower lip is pulled downwards, smoothing the chin area and exposing the lower gum/teeth region (though teeth are not rendered).
*   **Angle Differences:** The **left34** and **closeup** angles show the lower lip protrusion and chin bunching much more clearly than the front view.
*   **Gradient Smoothness:** 5/5
*   **Label:** Lower Lip Elevator / Depressor.
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible.

## $\psi_{14}$: Mouth Lateral Shift (Asymmetric)
*   **Negative Pole (-3.0):** The entire mouth is shifted towards the character's **right** side.
*   **Positive Pole (+3.0):** The entire mouth is shifted towards the character's **left** side.
*   **Angle Differences:** The **front** view most clearly shows the lateral shift. The **left34** angle creates an interesting effect where the mouth either moves towards or away from the camera.
*   **Gradient Smoothness:** 5/5
*   **Label:** Mouth Lateral Shift (Sideways).
*   **Symmetry:** **Asymmetric**.
*   **Artifacts:** None visible.

## $\psi_{15}$: Asymmetric Mouth Corner Puller
*   **Negative Pole (-3.0):** The mouth is pulled slightly downwards and towards the character's **right**.
*   **Positive Pole (+3.0):** The mouth is pulled slightly upwards and towards the character's **left**.
*   **Angle Differences:** **Closeup** shows the complex diagonal movement of the corners.
*   **Gradient Smoothness:** 5/5
*   **Label:** Asymmetric Mouth Corner Shift.
*   **Symmetry:** **Asymmetric**.
*   **Artifacts:** None visible.

## $\psi_{16}$: Mouth Corner Wide / Narrow
*   **Negative Pole (-3.0):** Mouth corners move outwards (horizontally) and slightly downwards, creating a wide, flat mouth shape.
*   **Positive Pole (+3.0):** Mouth corners move inwards and slightly upwards, narrowing the mouth and creating a more "pointed" center.
*   **Angle Differences:** The **closeup** angle highlights the change in the width of the mouth opening.
*   **Gradient Smoothness:** 5/5
*   **Label:** Mouth Corner Wide-Narrow (Risorius-like).
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible.

## $\psi_{17}$: Asymmetric Mouth Tilt
*   **Negative Pole (-3.0):** The mouth is tilted/pulled upwards on the character's **right** side and downwards on the **left**.
*   **Positive Pole (+3.0):** The mouth is tilted/pulled downwards on the character's **right** side and upwards on the **left**.
*   **Angle Differences:** **Front** view is the most reliable for assessing the tilt.
*   **Gradient Smoothness:** 5/5
*   **Label:** Asymmetric Mouth Tilt / Sneer-like.
*   **Symmetry:** **Asymmetric**.
*   **Artifacts:** None visible.

## $\psi_{18}$: Upper Lip Shape / Elevation
*   **Negative Pole (-3.0):** The upper lip is narrowed and pulled down slightly at the center.
*   **Positive Pole (+3.0):** The upper lip is widened and pulled up slightly, creating a more pronounced "bow" shape.
*   **Angle Differences:** **Closeup** reveals the subtle change in the vermilion border shape.
*   **Gradient Smoothness:** 5/5
*   **Label:** Upper Lip Bowing / Elevation.
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible.

## $\psi_{19}$: Lower Lip Shape / Elevation
*   **Negative Pole (-3.0):** The lower lip is narrowed and pulled down slightly at the center.
*   **Positive Pole (+3.0):** The lower lip is widened and pulled up slightly, flattening the lower lip curve.
*   **Angle Differences:** **Closeup** shows the lower lip's interaction with the chin fold better.
*   **Gradient Smoothness:** 5/5
*   **Label:** Lower Lip Flattening / Elevation.
*   **Symmetry:** Symmetric.
*   **Artifacts:** None visible.

---

## Summary Findings
1.  **Symmetry:** Components $\psi_{14}$, $\psi_{15}$, and $\psi_{17}$ are distinctly **asymmetric**.
2.  **Invisibility:** None of these components appear invisible; they all produce noticeable changes in mouth/lip shape at $\pm3.0$.
3.  **Key Angle:** The **left34** angle is particularly useful for seeing protrusion/depth (especially $\psi_{11}$ and $\psi_{13}$), while the **closeup** is vital for subtle lip shape changes ($\psi_{18}$, $\psi_{19}$).
4.  **Artifacts:** The FLAME model handles these expression components very well up to $\pm3.0$ with only minor pinching in the nasolabial area for $\psi_{12}$.
