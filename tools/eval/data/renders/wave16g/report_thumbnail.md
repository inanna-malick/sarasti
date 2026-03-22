# Face Thumbnail Evaluation Report (48-64px)

## Executive Summary
At 48-64px, the most effective signals are **mouth state** (open/closed/asymmetric) and **overall silhouette** (sharp vs. puffy). High-frequency details like eye tension (Wired) or subtle brow furrows (Aggressive) are lost. To ensure distinctness in a dashboard grid, expressions must rely on exaggerated geometry and potentially secondary cues like head tilt.

---

## Individual Expression Analysis

| Expression | Distinguishability (1-5) | Surviving Signal | Visibility Improvements |
| :--- | :---: | :--- | :--- |
| **Neutral** | - | Closed, level mouth. | Baseline. |
| **Alarmed** | 3 | Vertical mouth opening. | Exaggerate vertical stretch; tilt head back. |
| **Euphoric** | 5 | Horizontal wide mouth + teeth. | Keep teeth bright; lift cheeks higher. |
| **Wired** | 2 | Slight eye widening. | **Failing.** Needs head tilt or extreme eye-popping. |
| **Exhausted** | 3 | Drooping lids + heavy mouth. | Tilt head down; exaggerate lower lip sag. |
| **Aggressive** | 4 | Wide "angry" mouth. | Tilt head forward; exaggerate mouth-corner tension. |
| **Yielding** | 2 | Softening of features. | **Failing.** Needs head tilt or slight "shrugging" tilt. |
| **Smirk** | 4 | Mouth asymmetry. | Increase asymmetry; slight head cock. |

---

## Combo & Full Setup Evaluation

- **Combo Crisis**: **5/5**. The "black hole" of the wide-open mouth is the strongest signal in the set.
- **Combo Calm**: **1/5**. Too close to Neutral. Needs distinct "relaxation" cues like a tilted head.
- **Full Sharp-Chad-Crisis**: **5/5**. Silhouette difference is massive. The sharp jawline survives well.
- **Full Puffy-Soyboi-Calm**: **4/5**. The roundness of the face is a clear differentiator from "Sharp" variants even if the expression is subtle.

---

## Confusion Matrix (Thumbnail Size)

*Rows are intended expression, columns are perceived expression.*

| | Neutral | Alarmed | Euphoric | Wired | Exhausted | Aggressive | Yielding | Smirk |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Neutral** | - | | | CONFUSE | | | CONFUSE | |
| **Alarmed** | | - | | | | CONFUSE | | |
| **Euphoric** | | | - | | | | | |
| **Wired** | CONFUSE | | | - | | | | |
| **Exhausted** | | | | | - | | | |
| **Aggressive** | | CONFUSE | | | | - | | |
| **Yielding** | CONFUSE | | | | | | - | |
| **Smirk** | | | | | | | | - |

### Key Confusion Risks:
1. **The "Open Mouth" Problem**: Alarmed vs. Aggressive. Both look like "man with open mouth" at 48px.
2. **The "Subtle" Problem**: Wired and Yielding are almost indistinguishable from Neutral.
3. **The "Calm" Problem**: Combo Calm is effectively Neutral.

---

## Design Recommendations for Visibility

1. **Geometry Over Texture**: Don't rely on wrinkles or iris details. Focus on the *shape* of the mouth cavity.
2. **Head Tilt (Proprioception)**: 
   - Aggressive faces should tilt **forward** (brow down).
   - Alarmed/Yielding faces should tilt **back/sideways**.
   - This changes the silhouette, which is visible at 24px, let alone 48px.
3. **Color Coding**: If the system allows, a subtle background tint or skin flush (e.g., slight red for Aggressive/Wired, slight blue/grey for Exhausted) would make them instantly recognizable without looking at the face.
4. **Exaggerate Asymmetry**: For Smirk, the "up" side of the mouth should be significantly higher to ensure the "lopsided" look survives downsampling.
