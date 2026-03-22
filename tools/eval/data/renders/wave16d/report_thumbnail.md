# Thumbnail Distinguishability Report (Wave 16d)
**Target Size:** 48-64px (Financial Crisis Monitor)

## Executive Summary
At thumbnail sizes, facial expressions are primarily read through three channels:
1. **Mouth Silhouette:** Open vs. closed is the strongest signal.
2. **Brow Geometry:** "V" shape (aggressive) vs. "^" shape (alarmed) vs. flat (neutral).
3. **Symmetry:** Asymmetry (smirk) provides a clear delta from the "robotic" neutral.

Subtle expressions like "Wired" or "Combo Calm" are currently indistinguishable from "Neutral" and should be exaggerated or removed for thumbnail-only use cases.

---

## Expression Analysis

### 1. Alarmed (`alarmed_1.0_front.png`)
*   **Thumbnail Signal:** Clear dark "O" mouth. Raised brow line creates more forehead "empty space."
*   **Distinguishability (1-5):** **5** (Unmistakable)
*   **Confusion Risk:** `Combo Crisis` (also open mouth).
*   **Improvement:** Exaggerate the "white of the eyes" (sclera) visibility to increase high-frequency contrast in the eye area.

### 2. Euphoric (`euphoric_1.0_front.png`)
*   **Thumbnail Signal:** Very slight widening of the mouth. Slightly "brighter" eye area.
*   **Distinguishability (1-5):** **2** (Poor)
*   **Confusion Risk:** `Neutral`, `Combo Calm`.
*   **Improvement:** Show teeth or pull the mouth corners higher to break the straight-line silhouette of the mouth.

### 3. Wired (`wired_1.0_front.png`)
*   **Thumbnail Signal:** Minimal. Eyes are slightly more "fixed."
*   **Distinguishability (1-5):** **1** (Identical to Neutral)
*   **Confusion Risk:** `Neutral`.
*   **Improvement:** Add a slight forward head lean or significantly widen the eyelids.

### 4. Exhausted (`exhausted_1.0_front.png`)
*   **Thumbnail Signal:** Heavy eyelids (darker eye sockets). Slack, slightly open mouth.
*   **Distinguishability (1-5):** **3** (Moderate)
*   **Confusion Risk:** `Yielding`, `Neutral`.
*   **Improvement:** Deepen the nasolabial folds and add a slight downward head tilt to change the silhouette.

### 5. Aggressive (`aggressive_1.0_front.png`)
*   **Thumbnail Signal:** Strong "V" brow shape. Mouth looks like a thin, tense line.
*   **Distinguishability (1-5):** **4** (Strong)
*   **Confusion Risk:** `Combo Crisis`.
*   **Improvement:** Slightly flare the nostrils or show a "snarl" (uneven upper lip).

### 6. Yielding (`yielding_1.0_front.png`)
*   **Thumbnail Signal:** "Soft" eyes, slight downward frown.
*   **Distinguishability (1-5):** **2** (Poor)
*   **Confusion Risk:** `Exhausted`, `Neutral`.
*   **Improvement:** Increase the downward curvature of the mouth corners.

### 7. Smirk (`smirk_1.0_front.png`)
*   **Thumbnail Signal:** Asymmetrical mouth line. One side is noticeably higher.
*   **Distinguishability (1-5):** **3** (Moderate)
*   **Confusion Risk:** `Euphoric`.
*   **Improvement:** Increase the asymmetry; raise one cheek significantly to create a highlight/shadow delta.

### 8. Combo Crisis (`combo_crisis_front.png`)
*   **Thumbnail Signal:** High-intensity "emergency" look. Open mouth + aggressive brow.
*   **Distinguishability (1-5):** **5** (Unmistakable)
*   **Confusion Risk:** `Alarmed` (at a glance, the mouth dominates).
*   **Improvement:** Increase skin saturation/redness to simulate "flush" or stress.

### 9. Combo Calm (`combo_calm_front.png`)
*   **Thumbnail Signal:** Near zero.
*   **Distinguishability (1-5):** **1** (Identical to Neutral)
*   **Confusion Risk:** `Neutral`.
*   **Improvement:** Give it a distinct "contented" smile (closed eyes or very soft brow).

---

## Confusion Matrix
*High probability of mistake at 48px*

| If user sees... | They might think it is... | Reason |
| :--- | :--- | :--- |
| **Neutral** | Wired, Combo Calm, Euphoric | No "break" in the neutral silhouette. |
| **Alarmed** | Combo Crisis | The dark mouth hole is the dominant feature. |
| **Exhausted** | Yielding | Both involve "heavy" features and low tension. |
| **Aggressive** | Combo Crisis | Brow tension is similar; mouth state is the only delta. |
| **Smirk** | Euphoric | Asymmetry is hard to see without high contrast. |

## Recommendation
For a financial monitor where "State" must be identified instantly:
1. **Color Coding:** Consider a subtle background tint or border for expressions (Red for Crisis, Green for Calm).
2. **Silhouette breaking:** Use head tilts (left/right) to encode different "families" of emotion (e.g., Stress = Forward lean, Calm = Neutral, Defeat = Tilt).
3. **Contrast:** Darken the inner mouth for "Open" expressions to ensure the "hole" is visible even with aggressive downsampling.
