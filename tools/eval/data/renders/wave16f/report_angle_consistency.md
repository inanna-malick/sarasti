# VFX Supervisor Report: Angle Consistency Analysis (Wave16f)

## Overview
This report evaluates the consistency of 3D facial expressions across three primary camera angles: Front, Left 3/4 (three-quarter), and Closeup. The goal is to identify overfitting to a single viewpoint and ensure structural integrity in 3D space.

## Individual Expressions

### 1. Neutral
- **Read:** Consistent across all angles.
- **Artifacts:** None.
- **2D Tricks:** None.
- **Rating:** 5/5
- **Notes:** Excellent baseline. Geometry is clean and lighting responds naturally.

### 2. Alarmed (1.0)
- **Read:** Clearly reads as "alarmed" from all angles.
- **Artifacts:** "Black Hole Mouth." The interior of the mouth lacks any detail (teeth/tongue), appearing as a flat, dark void. This is particularly noticeable in the closeup and front views.
- **2D Tricks:** None.
- **Rating:** 4/5

### 3. Euphoric (1.0)
- **Read:** Reads as a smile/euphoria across all angles.
- **Artifacts:** Shallow mouth crease. The nasolabial folds (smile lines) are soft and don't quite connect to the nostrils realistically, giving it a slightly "painted on" appearance from the front.
- **2D Tricks:** Mouth interior is a dark red/black slit with no volume.
- **Rating:** 4/5

### 4. Wired (1.0)
- **Read:** High intensity maintained.
- **Artifacts:** Blotchy orbital shadows. The dark areas around the eyes look like heavy, uneven makeup or texture noise rather than natural shadow/muscle tension. This is very evident in the closeup.
- **2D Tricks:** None.
- **Rating:** 4/5

### 5. Exhausted (1.0)
- **Read:** Droopy eyelids and mouth read well.
- **Artifacts:** Symmetrical "sculpted" puffiness. The lower eyelids look a bit too perfectly symmetrical and thick, lacking the characteristic unevenness of real exhaustion.
- **2D Tricks:** Mouth interior void.
- **Rating:** 4/5

### 6. Aggressive (1.0)
- **Read:** Intense furrowed brow reads well.
- **Artifacts:** Pinched mouth corners. In the closeup, the corners of the mouth look slightly disconnected or "pinched" into the cheeks.
- **2D Tricks:** None; the brow furrow is clearly real 3D geometry as it deforms the silhouette in the left34 view.
- **Rating:** 4.5/5

### 7. Yielding (1.0)
- **Read:** Submissive/uncertain look is consistent.
- **Artifacts:** Minor mouth void.
- **2D Tricks:** Center-raised brows hold up surprisingly well in 3D.
- **Rating:** 4.5/5

### 8. Smirk (1.0)
- **Read:** Asymmetrical smirk reads well.
- **Artifacts:** Rubbery lip stretch. From the front, the lower lip seems to stretch towards the smirking side in a way that looks slightly more like a rubber sheet than muscle.
- **2D Tricks:** None.
- **Rating:** 4/5

## Combos

### Combo: Crisis (Front, Left34)
- **Read:** Very intense and consistent.
- **Artifacts:** The combined mouth opening creates a very large "black hole" artifact. Brow furrow is extremely deep, bordering on "sharp" geometry in the front view.
- **Rating:** 4/5

### Combo: Calm (Front, Left34)
- **Read:** Relaxed and pleasant.
- **Artifacts:** None significant.
- **Rating:** 5/5

## Summary of Findings
1.  **The "Black Hole" Mouth:** This is the most consistent failure across all open-mouth expressions. The lack of teeth, tongue, or any internal volume makes these expressions fail the "realism" test upon closer inspection or from side angles.
2.  **Structural Integrity:** Most expressions (notably `aggressive` and `yielding`) use actual geometry/displacement for furrows and folds, which is excellent. No "2D tricks" were detected that break the illusion from the 3/4 view.
3.  **Shadow Noise:** The `wired` expression suggests that the texture/shadow maps for the eye area might need refinement to avoid a blotchy, noisy look.

**Average Consistency Rating: 4.3/5**
