# W2 Facial Expression Gradient Evaluation Report

## 1. TENSION GRADIENT (deep_calm → neutral → deep_tense)
- **Smoothness:** The transition from **deep_calm** to **neutral** is smooth and professionally handled. However, the transition from **neutral** to **deep_tense** is marred by a sudden "pop" in eye widening and the emergence of severe mesh artifacts.
- **Distinctness:** Calm becomes visually distinct from neutral at approximately `t = -0.5` (mid_calm), primarily characterized by the heavy eyelid position. Tense becomes distinct almost immediately, but the "deep_tense" state (`t = +0.85`) is structurally compromised.
- **Issues:** High tension causes the lower jaw and neck mesh to collapse or clip, creating jagged black and white shapes under the chin.

## 2. VALENCE GRADIENT (deep_bad → neutral → deep_good)
- **Smoothness:** Generally smooth across the entire range. No significant "pops" detected.
- **Distinctness:** **mild_bad** (`v = -0.30`) is very subtle and potentially indistinguishable from neutral in a moving scene. **mild_good** (`v = +0.30`) has a slightly clearer read due to the upward curve of the mouth corners.
- **Readability:** The "deep_bad" state provides a strong, readable frown without excessive distortion. "Deep_good" is clear but begins to show some minor white-line artifacts in the mouth interior.

## 3. CORNERS (Quadrants)
- **Visual Distinction:** All 4 quadrants are highly distinct. A viewer could easily identify the emotional state without labels:
    - **Depressed (Low T, Low V):** Heavy eyes + Frown + Pitch Down. Very strong read.
    - **Content (Low T, High V):** Heavy eyes + Smile + Pitch Up. Looks serene but the head tilt might be slightly excessive.
    - **Panicked (High T, Low V):** Wide eyes + Open Mouth + Pitch Down. Structurally broken due to jaw artifacts.
    - **Manic (High T, High V):** Wide eyes + Wide Smile + Pitch Up. Structurally broken due to jaw artifacts.
- **Readability:** Without the mesh artifacts, these would be excellent. The combination of pose and expression is effective for "acting."

## 4. POSE CONTRIBUTION
- **Naturalism:** Pitch and Roll are used aggressively to reinforce the emotional state. 
- **Pitch Down:** Effectively communicates submissiveness (depression) or terror (panic).
- **Pitch Up:** Communicates confidence (content) or loss of control (manic). 
- **Excessiveness:** The pitch-up in "manic" and "content" is slightly too high, causing the camera to look "up the nose," which might not be desirable for all character types.

## 5. ARTIFACTS & MESH DISTORTION
- **CRITICAL:** **Jaw/Neck Collapse.** Any expression with tension `t > 0.5` (mid_tense, deep_tense, panicked, manic) shows catastrophic mesh failure at the base of the jaw. This is a "showstopper" for production-quality animation.
- **Mouth Interior:** A flat white artifact appears in wide-mouth smiles (`deep_good`, `manic`), suggesting either missing teeth geometry or a UV mapping error on the inner mouth mesh.
- **Stray Pixels:** Minor "fireflies" or white pixels are visible on the chin/jawline in several renders, likely a renderer/shader clipping issue.

## Summary Recommendations
1. **Fix Jaw Weights:** Immediately investigate the vertex weighting or blendshape targets for the jaw/neck area in high-tension configurations.
2. **Smooth Eye Pop:** Attenuate the eye-widening ramp between `t=0.0` and `t=0.5`.
3. **Mouth Interior:** Review the teeth placeholder/texture for high-valence expressions.
4. **Tone Down Pitch-Up:** Reduce the maximum head pitch-up limit by ~15% to keep the face more readable to the camera.
