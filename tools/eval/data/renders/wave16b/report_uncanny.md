# VFX Review: Wave 16b Uncanny Report

## Top 5 Most Severe Issues
1. **Oral Cavity "Black Hole"**: Every expression with an open mouth (`alarmed`, `combo_crisis`, `yielding`, etc.) lacks teeth, tongue, or any internal geometry, resulting in a disturbing dark void.
2. **Lifeless Glass Eyes**: Eyes frequently lack specular depth and highlights, appearing like painted glass spheres rather than organic tissue.
3. **Nostril Pinched Geometry**: The nostrils show sharp, unnatural transitions and pinched mesh artifacts, especially visible in closeups.
4. **Mouth Corner Mesh Strain**: Expressions like `smirk` and `euphoric` show unnatural pulling and texture stretching at the lip corners (commissures).
5. **Dead-Eye Stare**: Wide-eyed expressions (`wired`, `combo_crisis`) suffer from a "beady" pupil effect and lack of upper eyelid interaction with the iris.

## Per-Image Table
| Filename | Severity | Issues |
| :--- | :---: | :--- |
| aggressive_1.0_closeup.png | 2 | Pinched nostrils, dark eyes |
| aggressive_1.0_front.png | 2 | Sharp nostril shadows |
| aggressive_1.0_left34.png | 2 | Mesh strain at lip corners |
| alarmed_1.0_closeup.png | 4 | Severe "black hole" mouth, no oral geometry |
| alarmed_1.0_front.png | 4 | Mouth void, beady eyes |
| alarmed_1.0_left34.png | 4 | Oral void, jaw looks slightly elongated |
| combo_calm_closeup.png | 1 | Pupils look slightly too small |
| combo_calm_front.png | 1 | Minimal issues, overall decent |
| combo_crisis_closeup.png | 4 | Dead eyes, severe mouth void |
| combo_crisis_front.png | 4 | Lifeless stare, "black hole" mouth |
| euphoric_1.0_closeup.png | 2 | Lip corners look strained/thin |
| euphoric_1.0_front.png | 2 | Corner of mouth texture stretching |
| euphoric_1.0_left34.png | 2 | Slight lip clipping at corners |
| exhausted_1.0_closeup.png | 3 | Sunken eyes (fitting), but mouth void is present |
| exhausted_1.0_front.png | 3 | Eyes look very flat, mouth void |
| exhausted_1.0_left34.png | 3 | Oral cavity missing, eyes lack life |
| neutral_closeup.png | 1 | Baseline - okay, but eyes are a bit "flat" |
| neutral_front.png | 1 | Acceptable baseline |
| neutral_left34.png | 1 | Profile looks reasonable |
| smirk_1.0_closeup.png | 2 | Asymmetric strain at right commissure |
| smirk_1.0_front.png | 2 | Texture pulling on right cheek |
| smirk_1.0_left34.png | 2 | Shadow artifact on nose bridge |
| wired_1.0_closeup.png | 3 | "Glass eyes", beady pupils, mouth void |
| wired_1.0_front.png | 3 | Staring "maniac" look due to lack of eye highlights |
| wired_1.0_left34.png | 3 | Mouth closure looks too tight/linear |
| yielding_1.0_closeup.png | 2 | Mouth void starting to appear |
| yielding_1.0_front.png | 2 | Slight "beady" eye effect |
| yielding_1.0_left34.png | 2 | Drooping eyelid looks okay, but oral void is distracting |

## What should be fixed first?
The **Oral Cavity (Black Hole)** must be addressed immediately. Adding basic teeth and tongue geometry (even as placeholders) would significantly reduce the uncanny factor in 50% of the expressions. Following that, **Eye Specularity/Highlights** should be improved to give the character "life."
