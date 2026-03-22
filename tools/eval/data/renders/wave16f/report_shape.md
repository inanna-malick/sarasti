# Shape Morph Evaluation: Wave16f

## Overview
This report evaluates the structural identity axes implemented in the `wave16f` iteration. These shapes are intended to represent natural variations in human facial structure (identity) rather than temporal expressions.

## Baseline
- **Neutral:** A balanced, generic male face used as the reference point for all morphs.

## Solo Axis Evaluation

| Axis | Pole | Plausibility | Front vs 3/4 Reading | Distinctiveness (1-5) | Naturalness (1-5) | Artifacts/Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Dominance** | Chad (+1.0) | High. Strong masculine archetype. | Jawline and chin prominence are much clearer in 3/4 view. | 4 | 5 | Strong, stable deformation. |
| **Dominance** | Soyboi (-1.0) | High. Plausible softer/narrower face. | Narrower jaw and slightly recessed chin read well in profile. | 4 | 5 | No "collapsing" mesh artifacts. |
| **Sharpness** | Sharp (+1.0) | High. Angular, gaunt, high-fashion look. | Cheekbone definition and nasal bridge sharpness pop in 3/4. | 3 | 4 | Can look slightly gaunt when combined with 'Old'. |
| **Sharpness** | Puffy (-1.0) | High. Rounded, softer features. | Softened jawline and fuller cheeks are consistent across views. | 3 | 5 | Very natural look. |
| **Maturity** | Old (+1.0) | High. Captures aging proportions well. | Ear/nose enlargement and lip thinning are very evident in 3/4. | 4 | 4 | Proportions are good; sag looks natural. |
| **Maturity** | Young (-1.0) | High. Neotenous features without looking like a child. | Rounded profile and larger eye-to-face ratio are clear. | 4 | 5 | Excellent "young adult" transition. |

## Combos & Full Characters

### Sharp-Chad-Old
- **Visual Description:** A rugged, elderly man with very defined, angular features.
- **Plausibility:** High. Looks like a specific, distinct individual (e.g., a "weathered veteran" type).
- **Evaluation:** The combination of Sharp and Old creates a gauntness that feels lived-in. Distinctiveness: **5**, Naturalness: **4**.

### Puffy-Soyboi-Young
- **Visual Description:** A soft-featured, youthful male.
- **Plausibility:** High. Looks like a younger, less dominant persona.
- **Evaluation:** The "Puffy" axis helps round out the "Young" morph, making it look very natural and approachable. Distinctiveness: **4**, Naturalness: **5**.

### Full: Sharp-Chad-Crisis
- **Visual Description:** An intense, elderly man in a state of high stress/alarm.
- **Evaluation:** The "Sharp" structural axis significantly amplifies the "Crisis" expression. The tight skin over the angular bone structure makes the expression look much more intense than it would on a neutral base.

### Full: Puffy-Soyboi-Calm
- **Visual Description:** A serene, peaceful young man.
- **Evaluation:** The "Puffy" and "Young" axes complement the "Calm" expression. The lack of sharp angles reduces perceived tension, making the character look genuinely relaxed.

## Summary Findings
1. **Identity vs. Expression:** The shapes successfully read as different people rather than the neutral person making a face.
2. **Axis Interaction:** The axes stack well without causing mesh blowouts or extreme uncanny-valley deformations.
3. **Profile Importance:** The `left34` (three-quarter) renders are critical for evaluation, particularly for the Dominance and Sharpness axes which rely heavily on jaw and cheekbone structure.
4. **Naturalness:** All poles remain within the realm of "human," with even the extreme poles (1.0) feeling plausible.

**Recommendation:** The current wave of shape morphs is production-ready for character diversity. The "Sharp" and "Old" combo should be monitored in animation to ensure gauntness doesn't lead to clipping during extreme expressions.
