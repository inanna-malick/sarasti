# Wave 15 Sculptor's Critique: 3/4 View & Deformation Analysis

**Evaluator:** Senior Character Sculptor (12y AAA experience)  
**Target:** Expression/Shape consistency across angles.

---

## 1. Expression/Shape Evaluations

### Aggressive
- **Readability:** Low-Medium. 
- **Front:** Reads more as "panting" or "confused straining" than true aggression. The lack of brow furrow (corrugator supercilii) kills the intent.
- **3/4 View:** The mouth takes on a "duck face" quality. The philtrum is overly stretched, and the lower lip protrudes without enough supporting tension in the chin (mentalis). 
- **Mesh Issues:** Significant vertical stretching between the nose and upper lip.

### Euphoric
- **Readability:** Low.
- **Front:** Extremely subtle. It looks like a "resting neutral" with a tiny smirk. No eye involvement (orbicularis oculi) makes it feel dead.
- **3/4 View:** The smile is completely flat. There is no volume increase in the cheeks (zygomaticus major/minor), which should push up into the lower eyelids. It looks like a simple 2D texture pull rather than a 3D muscle contraction.
- **Mesh Issues:** Flat cheek planes; lack of nasolabial fold depth change.

### Puffy (Sharpness = -1)
- **Readability:** High (as a "distorted" state), Low (as a natural face).
- **Front:** Soft and bloated.
- **3/4 View:** **UNSETTLING.** The jawline is swallowed by the neck, and the eyes look like they are being squeezed by internal pressure. The nose appears to be sinking into the mid-face.
- **Mesh Issues:** Serious artifacting in the orbital area. The mesh volume seems to expand "into" the eyeball rather than around it. Jaw/neck transition is a soup of polygons.

### Weathered vs. Young (Maturity)
- **Readability:** Medium-High.
- **Weathered:** The vertical stretch reads well from the front, but in 3/4 view, the chin becomes an "anchor" that pulls the whole face down. It looks slightly "melty".
- **Young:** Compresses well. The 3/4 view shows a soft jawline that is characteristic of youth, though the forehead volume feels slightly oversized relative to the compressed features.
- **Mesh Issues:** Neck deformation on "Weathered" looks like the skin is being pulled too tight over the throat (platysma strain).

### Alarmed & Crisis
- **Readability:** High (Extreme).
- **Crisis (3/4 View):** This is the "optimization victim." The mouth is a black hole. The corners are pulled back so far they create a sharp "V" shape that breaks the organic flow of the cheek.
- **Mesh Issues:** Massive stretching on the inner mouth bag. The "shelf" created by the upper lip in 3/4 view is a major uncanny valley trigger.

---

## 2. Expression Ranking

1.  **Neutral / Calm:** Reads perfectly from all angles. Solid foundation.
2.  **Young:** Good volume management in 3/4 view.
3.  **Soyboi:** Successful "weak jaw" profile, though some mesh folding under the chin.
4.  **Chad:** Strong profile, but the jaw transition to the ear is too sharp (mechanical).
5.  **Weathered:** Okay, but starts to look "stretched" rather than "aged."
6.  **Aggressive:** Loses its meaning in profile.
7.  **Euphoric:** Too subtle; looks like a broken pose from the side.
8.  **Puffy:** Extreme uncanny valley; mesh-level distortions.
9.  **Crisis:** Total front-only optimization. Breaks the rig/mesh in 3/4 view.

---

## 3. TOP 3 Most Broken (3/4 View)

1.  **Crisis:** The mouth deformation is non-anatomical and creates a "black hole" effect that ruins the profile.
2.  **Puffy:** The way the cheek volume interacts with the eyes and jaw is catastrophic for a 3D character. It looks like a technical error (aliasing/interpenetration) rather than a shape.
3.  **Aggressive:** The profile view turns "anger" into "pouting," failing the primary goal of the expression.

---

## 4. Specific Fixes

### For "Crisis/Alarmed":
- **Fix:** Implement "anchor" points for the mouth corners. Don't just pull them back; they need to wrap around the dental arch. Add volume to the cheeks when the mouth opens this wide—flesh has to go somewhere.
- **Mesh:** Smooth the transition between the orbicularis oris and the cheeks to avoid the sharp "V" fold.

### For "Euphoric":
- **Fix:** **SQUINT.** Euphoria is in the eyes. Raise the lower eyelids and the cheeks simultaneously. The zygomatic muscles must add volume to the mid-face in 3/4 view.
- **Sculpt:** Add a subtle "shelf" under the eye where the cheek is pushing up.

### For "Puffy":
- **Fix:** Redefine the "Sharpness" blendshape. It should expand the subcutaneous fat layers (cheeks, jowls) while *preserving* the underlying bone structure (eye sockets, bridge of the nose).
- **Sculpt:** Protect the orbital rim from volume expansion to prevent the "eye-sinking" look.

### For "Aggressive":
- **Fix:** Focus on the brow. Lower the inner brow and raise the nostrils (nasalis muscle). For the mouth, pull the lips *up and away* from the teeth rather than just "back."
- **Sculpt:** Add tension to the chin (mentalis) to prevent the "pout" look in profile.
