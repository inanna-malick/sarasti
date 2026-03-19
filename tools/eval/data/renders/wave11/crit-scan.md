# Wave 11 Dashboard Utility Critique: Facial Expression Scan

**Evaluator:** UX Research Specialist (Pre-attentive Processing & Dashboard Design)
**Date:** March 19, 2026
**Subject:** 44 Rendered 3D Facial Expressions for Financial Monitoring

---

## 1. THUMBNAIL TEST (64x64 icon size)
*Rating the "pop" or pre-attentive visibility of each state.*

### 5 - Unmistakable (Instant Read)
- `full_alarmed-wired-aggressive.png`: The "system failure" face. High contrast, wide eyes, open mouth.
- `wired_2.0.png`: Extremely distinct due to extreme eye widening.
- `alarmed_1.2.png`: Clear "panic" signature even at tiny sizes.
- `aggressive_1.2.png`: Strong brow furrow creates a dark "V" shape at the top of the face.
- `full_puffy-soyboi-euphoric.png`: Facial distortion (puffy cheeks) breaks the silhouette of the head enough to be very obvious.
- `full_sharp-chad-euphoric.png`: Sharp jawline and high-contrast facial planes.

### 4 - Clear (Brief Focus)
- `alarmed_1.0.png`
- `euphoric_1.5.png`: The broad smile is visible as a bright line/shape.
- `wired_1.5.png`
- `exhausted_1.5.png`: Heavy eyelid droop creates a "tired" look visible through changes in eye-region shading.
- `cross_alarmed-wired.png`
- `full_euphoric-wired-smirk.png`

### 3 - Ambiguous (Requires Saccade)
- `aggressive_1.0.png`
- `euphoric_1.0.png`
- `smirk_1.0.png`
- `yielding_1.2.png`
- `exhausted_1.0.png`
- `cross_euphoric-smirk.png`
- `cross_smirk-alarmed.png`
- `full_sharp-smirk-alarmed-aggro.png`

### 2 - Subtle (Nearly Neutral)
- `aggressive_0.8.png`
- `alarmed_0.8.png`
- `euphoric_0.8.png`
- `wired_0.8.png`
- `yielding_1.0.png`
- `exhausted_0.5.png`
- `cross_euphoric-aggressive.png`

### 1 - Indistinguishable (Noise)
- `alarmed_0.5.png`: Indistinguishable from neutral as a 64px icon.
- `euphoric_0.5.png`: Smile is too subtle to register.
- `wired_0.5.png`: Eye widening is negligible at low resolution.
- `smirk_0.5.png`: Asymmetry is lost in pixel interpolation.
- `yielding_0.8.png`: Minimal facial movement.

---

## 2. CONFUSION MATRIX
*Pairs likely to be mistaken for each other at thumbnail size.*

| Expression A | Expression B | Reason for Confusion |
| :--- | :--- | :--- |
| `neutral` | `alarmed_0.5` | Threshold of detection not met. |
| `neutral` | `euphoric_0.5` | Threshold of detection not met. |
| `neutral` | `wired_0.5` | Threshold of detection not met. |
| `neutral` | `smirk_0.5` | Threshold of detection not met. |
| `alarmed_0.8` | `wired_0.8` | Both rely on moderate eye widening; mouth state is not yet distinct enough. |
| `aggressive_1.0` | `smirk_1.0` | Both involve mouth tightening/narrowing; brow furrow vs. smirk is hard to see. |
| `exhausted_1.0` | `yielding_1.0` | Both present as "softer" or "slumped" facial features. |
| `full_sharp-chad-euphoric` | `full_euphoric-wired-smirk` | Both share "confident/intense positive" signatures. |
| `cross_euphoric-exhausted` | `full_euphoric-exhausted-yielding` | Overlapping semantic space and similar eye/mouth blend. |

---

## 3. GRADIENT TEST
*First intensity where the face becomes pre-attentively distinguishable from neutral.*

- **Aggressive:** `1.0` (Brow furrow creates the necessary shadow contrast).
- **Alarmed:** `0.8` (Mouth begins to open enough to break the straight-line neutral mouth shape).
- **Euphoric:** `1.0` (Cheek lifting and mouth widening become visible).
- **Exhausted:** `1.0` (Upper eyelid droop creates a recognizable "half-closed" eye shape).
- **Wired:** `0.8` (Sclera exposure above the iris becomes a "pop" feature).
- **Smirk:** `1.0` (One side of the mouth must clearly break symmetry).
- **Yielding:** `1.2` (Requires significant "softening" of the features to be visible).

---

## 4. ATTENTION MAGNETS
*Ranking expressions by how quickly they grab attention as the "odd-one-out" in a field of neutral faces.*

1. **`full_alarmed-wired-aggressive`**: The "Screamer." High spatial frequency changes and high contrast.
2. **`wired_2.0`**: The "Stare." Human brains are hard-wired to detect wide-eyed stares immediately (threat detection).
3. **`alarmed_1.2`**: Strong mouth-open signal (black void in lower face).
4. **`full_puffy-soyboi-euphoric`**: Morphological anomaly. The change in face shape is a strong pre-attentive signal.
5. **`aggressive_1.2`**: Intense downward "V" in the brow region.
6. **`full_sharp-chad-euphoric`**: Sharp geometric planes catch the light differently.
7. **`euphoric_1.5`**: Wide, bright smile.
8. **`exhausted_1.5`**: Significant change in eye-region luminosity.
9. **`cross_alarmed-wired`**: High intensity eye widening.
10. **`cross_smirk-alarmed`**: Jarring asymmetry.

---

## 5. ALL-SAME TEST
*If the entire dashboard is `alarmed_1.0`, which intruders would be most obvious?*

- **`neutral`**: Highly obvious as the "calm in the storm."
- **`exhausted_1.5`**: The "Droop" vs. the "Open." The closed/heavy eyes are the polar opposite of the wide eyes of the group.
- **`aggressive_1.2`**: The "Frown" vs. the "Open Mouth." The downward pressure of the brow conflicts with the upward/outward energy of the alarmed faces.
- **`yielding_1.2`**: The "Soft" vs. the "Tense."

---

## FINAL RECOMMENDATION
For a financial dashboard where speed is life:
1. **Avoid intensities below 0.8.** They are essentially "dead pixels" from a UX perspective.
2. **Prioritize `wired`, `alarmed`, and `aggressive`** for critical alerts.
3. **Use `full_puffy` or `full_sharp`** as "state modifiers" (e.g., high volatility vs. high trend) because they change the silhouette of the face, which is detectable at even lower resolutions than expression changes.
