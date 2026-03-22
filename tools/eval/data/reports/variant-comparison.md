# Facial Expression System: Tension Axis Variant Comparison

This report evaluates three experimental variants (A, B, C) designed to improve the visibility of the "tension" signal (Calm vs. Tense) under conditions of strong negative mood (low valence).

## Baseline Comparison
At $v = -0.3$, the tension signal is subtle but present, primarily through eye narrowing and brow furrowing. However, as valence drops to $v = -0.6$, the signal begins to wash out as the frown and mouth opening dominate the geometry. At maximum negative mood ($v = -0.9$), the "calm" and "tense" faces are nearly indistinguishable, both overwhelmed by the jaw drop and heavy brow compression.

---

## Variant A: Pose-heavy (Head Tilt)
**Mechanism:** Tense faces use a "chin up" alert posture; Calm faces use a "chin tucked" drooped posture.

### valence $v = -0.3$
- **Distinguishability:** Very High.
- **Visual Cues:** The head angle provides a clear structural difference that is immediately visible. Calm looks "pouty" and withdrawn, while Tense looks "confrontational" and alert.
- **Naturalness:** Good. The pose feels like a natural extension of the emotional state.

### valence $v = -0.6$
- **Distinguishability:** High.
- **Visual Cues:** The chin-up vs. chin-down cue remains the primary discriminator. It effectively separates the "defeated" negative mood (Calm) from the "agitated" negative mood (Tense).

### valence $v = -0.9$ (Maximum Negative Mood)
- **Survival:** Excellent. Because the head tilt is a transformation applied to the entire head mesh, it is completely immune to the local geometric "noise" of the jaw drop and brow furrow. The tension signal survives perfectly.

---

## Variant B: Texture-heavy (Skin Color)
**Mechanism:** Tense faces use cold/blue/pale skin tones; Calm faces use warm/flushed/red skin tones.

### valence $v = -0.3$
- **Distinguishability:** Medium.
- **Visual Cues:** The color shift is noticeable but feels "painted on." It doesn't change the *form* of the expression, only its surface.
- **Naturalness:** Low. The blueish tint in the Tense variant can look slightly sickly or like a rendering error.

### valence $v = -0.6$
- **Distinguishability:** Medium-High.
- **Visual Cues:** The contrast between the warm "exhausted" look and the cold "wired" look becomes more useful as the geometry starts to blur.

### valence $v = -0.9$ (Maximum Negative Mood)
- **Survival:** Good. The color contrast persists even when the face is extremely distorted. It provides a reliable "ambient" signal of tension even when all geometric features have collapsed into the $v = -0.9$ state.

---

## Variant C: Combined (Pose + Texture + Boosted Geometry)
**Mechanism:** Integrates head tilt (A), skin color (B), and aggressive eye-shape narrowing.

### valence $v = -0.3$
- **Distinguishability:** Outstanding.
- **Visual Cues:** Unmistakable. The combination of the alert posture, the "cold" skin tone, and the sharp squint makes the Tense variant look dangerous, while the Calm variant looks genuinely tired and sad.

### valence $v = -0.6$
- **Distinguishability:** Very High.
- **Visual Cues:** Multiple redundant channels (pose, color, eyes) ensure that even if one cue is obscured by a specific camera angle, others carry the signal.

### valence $v = -0.9$ (Maximum Negative Mood)
- **Survival:** Perfect. This is the most robust variant. The "tension" signal is not just surviving; it is actively shaping the character of the negative mood. The difference between "Calm-Upset" and "Tense-Upset" is dramatic and easy to read from a distance.

---

## Overall Findings and Recommendations

### Ranking
1. **Variant C (Combined)** - Most robust and readable.
2. **Variant A (Pose-heavy)** - Best structural survival.
3. **Variant B (Texture-heavy)** - Good for ambient signal but lacks "soul" on its own.

### Channel Contribution
- **Pose (Head Angle):** This is the most effective channel for ensuring distinguishability at extreme valence. It provides a macroscopic change that is easy to perceive regardless of facial detail.
- **Texture (Skin Color):** Excellent as a secondary "mood lighting" cue, but feels unnatural if used as the sole carrier of the signal.
- **Geometry (Eye Squint):** Crucial for the "close-up" read, but often gets lost in the brow-furrow of $v = -0.9$.

### Final Recommendation
I recommend adopting **Variant C (Combined)**. By spreading the tension signal across three different channels (pose, texture, and geometry), we create a "holistic" expression that is far more resilient than the baseline. 

A single channel (like Variant A) solves the distinguishability problem but can feel "stiff." Variant C masks the mechanical nature of the pose change by layering it with subtle color and shape shifts, resulting in a more believable and readable character.

**Warning:** The texture shift in Tense variants should be carefully tuned to avoid looking "bruised" or "undead." The current Variant B/C implementation is slightly too blue; I suggest shifting the "cold" end toward a more desaturated, pale grey-yellow rather than a saturated blue.
