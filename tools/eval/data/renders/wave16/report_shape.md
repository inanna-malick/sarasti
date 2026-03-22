# Shape Axis Review Report - Wave 16

## Overview
This report evaluates the 3D face shape morphs for the financial visualization project. The review focuses on three primary shape axes: **Dominance**, **Maturity**, and **Sharpness**, along with two combination renders.

---

## Axis 1: Dominance (Chad vs. Soyboi)
**Poles:** Positive (Chad), Negative (Soyboi)

### Analysis
- **Chad (Positive):** Characterized by a significantly squarer jawline, broader face, and more prominent brow ridge. It successfully conveys a "dominant" or "strong" bone structure.
- **Soyboi (Negative):** Characterized by a narrower face, receding chin, and relatively larger-looking eyes. It conveys a "weaker" or "submissive" structure effectively.
- **Readability:** High. The differences are starkly visible from all camera angles, especially the 3/4 view where the jawline changes are most apparent.
- **Artifacts:** Minor softness/smearing in the neck/jaw transition for the Soyboi pole in closeup views.

### Ratings
- **Naturalness:** 4/5 (Chad is slightly stylized at 1.0)
- **Distinctiveness:** 5/5

---

## Axis 2: Maturity (Weathered vs. Young)
**Poles:** Positive (Weathered), Negative (Young)

### Analysis
- **Weathered (Positive):** Features sunken cheeks, deeper nasolabial folds (as bone/tissue structure), and a more "haggard" skull shape. Very effective for representing age or stress without relying on skin textures.
- **Young (Positive):** Characterized by fuller cheeks and softer, rounder features. 
- **Readability:** Good. The transition in cheek volume is visible in both front and 3/4 views.
- **Artifacts:** None observed.

### Ratings
- **Naturalness:** 5/5
- **Distinctiveness:** 4/5 (Young is relatively close to neutral)

---

## Axis 3: Sharpness (Sharp vs. Puffy)
**Poles:** Positive (Sharp), Negative (Puffy)

### Analysis
- **Sharp (Positive):** Emphasizes angular cheekbones and a thinner, more defined facial structure.
- **Puffy (Negative):** Leads to a rounder face with less bone definition and softer jawlines.
- **Readability:** Good. The "Sharp" pole is particularly readable in the 3/4 view.
- **Artifacts:** None observed.

### Ratings
- **Naturalness:** 5/5
- **Distinctiveness:** 4/5

---

## Combination Analysis

### Combo: Sharp-Chad-Crisis
- **Description:** Combines Sharpness, Dominance (Chad), and a Crisis expression.
- **Coherence:** Extremely high. The lean bone structure of "Sharp" and "Chad" reinforces the intensity of the "Crisis" expression.
- **Observation:** There is some minor black artifacting/voiding inside the mouth in the open-mouth expression.

### Combo: Puffy-Soyboi-Calm
- **Description:** Combines Puffiness, Submissiveness (Soyboi), and a Calm expression.
- **Coherence:** High. The soft, round features work well together to create a "softer" character profile.
- **Observation:** The neck appears slightly thin relative to the rounder face, though it remains within natural bounds.

---

## Recommendations & Fixes

1. **[Priority: Medium] Mouth Interior:** Investigate the black artifacting/voiding inside the mouth for the "Crisis" expression (visible in `combo_sharp-chad-crisis_front.png`). Ensure the inner mouth mesh or lighting is properly handled for open-mouth poses.
2. **[Priority: Low] Soyboi Neck/Jaw:** Smooth the transition between the lower jaw and the neck for the Soyboi pole to avoid the slightly "pinched" look in closeups.
3. **[Priority: Low] Render Quality:** For future reviews, consider including iris/pupil textures in the renders. The current "black void" eyes are somewhat distracting when evaluating facial naturalness.
4. **Conclusion:** The axes are overall very high quality and fulfill the requirement of modifying bone/tissue structure without intruding into expression space.
