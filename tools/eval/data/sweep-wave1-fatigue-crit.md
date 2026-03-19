# Fatigue Axis Sweep Critique: Wave 1

This evaluation covers the FATIGUE axis sweep, ranging from **WIRED (-1.0)** to **EXHAUSTED (+1.0)**.

## Image-by-Image Evaluation

### Front Sweep

#### fatigue_-1.0_front.png (WIRED pole)
- **Emotion/State:** Conveys high alertness and hypervigilance. The wide-open eyes (ψ8 and ψ7 inverted) successfully capture the "startle" and "on edge" look.
- **Readability:** Distinct from neutral, but the mouth feels too passive. The bestiary mentions ψ4 (engagement) should lead to slightly parted lips, but here the mouth remains firmly closed and neutral.
- **Artifacts/Unnatural Elements:** None observed.
- **Improvements:** Increase ψ4 weight to actually part the lips slightly. Increase ψ3 (negative) to add more tension to the mid-face/nasal area to move away from "surprised neutral" towards "stressed/on edge."

#### fatigue_-0.7_front.png & fatigue_-0.4_front.png
- **Readability:** These intermediate levels are very similar to -1.0. The "wired" effect is essentially a binary state (eyes wide or not) with the current weights. The transition needs more granularity in the mid-face tension.

#### fatigue_0.0_front.png (NEUTRAL)
- **Emotion/State:** Successfully neutral. Serves as a clear baseline.

#### fatigue_0.4_front.png & fatigue_0.7_front.png
- **Readability:** The progression of lid droop (ψ7) is clearly visible and provides a smooth transition into exhaustion. These are more distinguishable than the negative side intermediates.

#### fatigue_1.0_front.png (EXHAUSTED pole)
- **Emotion/State:** Effectively conveys depletion and "giving up." The heavy lids (ψ7×2.5) are the strongest component. The subtle downward gaze adds to the effect.
- **Readability:** Highly distinct from neutral.
- **Artifacts/Unnatural Elements:** None observed.
- **Improvements:** The mouth (ψ0×-0.5) could be slightly more slack. Perhaps a slightly more negative ψ0 would emphasize the lack of energy.

### 3/4 Views

#### fatigue_-1.0_left34.png
- The "wired" state is even more readable here. The combination of the leftward gaze and wide eyes creates a strong "scanning" effect.

#### fatigue_0.0_left34.png
- Clean neutral baseline.

#### fatigue_1.0_left34.png
- The heavy-lidded droop is very clear in profile. The downward gaze works well with the head droop to sell the "exhausted" state.

## Summary Judgment

The Fatigue axis is functional but **unbalanced**. The **EXHAUSTED** pole is successful and highly readable due to the strong ψ7 lid-droop component. The **WIRED** pole, however, feels slightly "empty" in the lower and mid-face. It relies too heavily on eye-widening, making it look more like mild surprise than sustained hypervigilance.

Intermediate levels on the negative side (-0.7, -0.4) are too similar to the pole, whereas the positive side shows a good linear progression of energy loss.

## Recommendations

- **WIRED (-1.0) Pole:**
    - **Increase ψ4 (engagement) from 1.5 to 2.0 or 2.5.** We need the lips to actually part to show the "active scanning" tension.
    - **Increase ψ3 (disgust/tension) from -1.5 to -2.0.** Adding more nasal crinkle and brow pinch will make the "wired" state look more stressed/on edge.
    - **Check gaze intensity.** The leftward gaze is good, but ensure it's not over-rotating the eyes to the point of showing too much sclera on one side.

- **EXHAUSTED (+1.0) Pole:**
    - **Increase ψ0 (mouth aperture) from -0.5 to -0.8.** This will further close/slacken the mouth, reinforcing the "done" state.
    - **Maintain ψ7 at 2.5.** This is the star of the show for this axis.

- **General:**
    - The axis currently feels a bit "flat" on the negative side. Increasing the mid-face tension (ψ3) should help differentiate -1.0 from -0.7.
