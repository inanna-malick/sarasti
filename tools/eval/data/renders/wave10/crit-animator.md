# Animator's Critique: Wave 10 Renders
**Evaluator:** Senior Character Animator (Pixar, 15 years experience)
**Objective:** Evaluation of 60 financial instrument data-viz faces for expressiveness, naturalness, and thumbnail readability.

## 1. Sorting into Tiers

### HERO (Ship these)
*   `neutral.png` - Solid baseline, clean mesh.
*   `aggression_1.0.png` - Perfect intensity. Eyebrows and mouth tension are spot-on.
*   `alarm_1.0.png` - Reads clearly as shock without hitting the uncanny valley.
*   `smirk_1.0.png` - The asymmetry is intentional and expressive.
*   `sweetspot_aggression_1.2.png` - The "pushed" version that still holds together.
*   `sweetspot_alarm_1.2.png` - Strong silhouette, great for thumbnails.
*   `full_sharp-chad-smirk-aggro.png` - This is your "villain" face. Extremely high character quality.
*   `cross_alarmed-aggressive.png` - Excellent blend; the panic/anger mix is palpable.

### USABLE (Good enough)
*   `aggression_0.5.png`, `alarm_0.5.png` - Subtle but readable.
*   `smirk_0.5.png`, `smirk_0.8.png` - Safe, conservative smirks.
*   `fatigue_1.0.png`, `sweetspot_fatigue_1.2.png` - The eyelid droop is effective but subtle.
*   `cross_smirk-aggressive.png` - Works well as "arrogant aggression."
*   `shape_sharp-alarmed.png` - The sharp features help the expression pop.

### NEEDS WORK (Fixable)
*   `aggression_1.5.png` - The mouth interior "dark void" is too large and distracting.
*   `alarm_1.5.png` - Eyes are pushing into "terrified" in a way that feels a bit too "broken mesh."
*   `smirk_1.5.png` - The asymmetry is starting to look like a rendering error/stretch.
*   `fatigue_1.5.png` - Eyelids are clipping or looking too thin.
*   `smirk_2.0.png` - Geometry is straining.

### BROKEN (Start over)
*   `smirk_2.5.png` - Impossible geometry. The cheek is collapsing.
*   `fatigue_2.0.png` - Uncanny valley. Looks more "dead" than "tired."
*   `aggression_-1.5.png`, `alarm_-1.5.png` - The "negative" intensities result in weird, pinched expressions that don't map to human emotion.
*   `full_puffy-soyboi-euphoric-exhausted.png` - Too many conflicting signals; the face looks like it's melting.

## 2. Silhouette Read
The best silhouette reads are `aggression_1.0`, `alarm_1.2`, and `full_sharp-chad-smirk-aggro`. These have clear changes in the external outline of the face (jaw drop, eyebrow peaks) that will translate perfectly to a 64x64 pixel thumbnail. If a user is scanning a wall of 50 faces, these are the ones they will spot in <200ms.

## 3. Mouth Interior (The Dark Void)
The mouth interior becomes a problem once you cross the `1.2` intensity threshold. In `aggression_1.5` and `alarm_1.5`, the "dark void" is a flat, unlit cavern. It lacks any secondary anatomy (tongue, teeth) which makes it feel like a black sticker slapped on the face. To fix this, you either need to model a simple interior or keep the mouth opening narrower.

## 4. Smirk Evaluation
The asymmetry reads clearly starting at `smirk_0.5`. 
- **0.5 - 1.0**: Intentional, looking like a confident smirk.
- **1.2**: The sweet spot for "high intensity smirk."
- **1.5+**: Crosses the line into looking like a rendering glitch or a stroke. The nasolabial fold on the smirked side is stretched too thin, and the opposite side of the mouth looks unnaturally paralyzed.

## 5. The "Sweetspot" Quality Cliff
There is a massive quality cliff between `1.2` and `1.5`. 
- **Intensity 1.2** feels like a "pushed" animation pose—the kind we use in Pixar to emphasize a beat. 
- **Intensity 1.5** feels like a "broken" pose where the linear interpolation has outrun the mesh's ability to represent skin. The eyes in particular lose their "fleshiness" and start looking like paper cutouts at 1.5. Stick to the 0.8 - 1.2 range for your "high" states.

## Rating Summary
*   **Expressiveness**: 8/10 (The range is excellent).
*   **Naturalness**: 6/10 (The high intensities pull the average down).
