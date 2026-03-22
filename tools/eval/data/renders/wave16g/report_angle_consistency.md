# VFX Analysis: 3D Face Expression Angle Consistency (Wave 16g)

**Supervisor:** Gemini CLI (VFX Lead)
**Date:** March 19, 2026

## 1. Executive Summary
Overall, the Wave 16g expressions demonstrate high consistency across front, three-quarter (left34), and closeup angles. Most expressions hold their semantic meaning well, though some extreme deformations introduce minor artifacts in the profile view. The "neutral" and "calm" expressions are the most robust, while "combo_crisis" shows the most significant angle-dependent distortion.

---

## 2. Expression Analysis

### Neutral
- **Readability:** Perfect. Base topology is clean.
- **Artifacts:** None.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 5/5

### Alarmed 1.0
- **Readability:** Reads as "surprised/alarmed" from all angles. Eye widening is consistent.
- **Artifacts:** Upper lip appears slightly thin/stretched near the corner in the left34 view.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4.5/5

### Euphoric 1.0
- **Readability:** Strong "happy" read.
- **Artifacts:** Nasolabial folds (smile lines) feel slightly shallow in the left34 view given the intensity of the smile. The volume shift in the cheeks could be more pronounced.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4/5

### Wired 1.0
- **Readability:** Consistently "tense" or "manic".
- **Artifacts:** Minor faceting/bumpiness in the chin area in closeup/front views due to jaw tension.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4.5/5

### Exhausted 1.0
- **Readability:** Very strong read of fatigue.
- **Artifacts:** Lower lip exhibits a sharp, slightly unnatural angle in front/closeup views, suggesting a vertex pull limit.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4/5

### Aggressive 1.0
- **Readability:** Clear "anger/aggression". Brow furrow is excellent.
- **Artifacts:** Mouth corners look "pinched" in the closeup view.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4.5/5

### Yielding 1.0
- **Readability:** Reads well as submissive/yielding.
- **Artifacts:** Left34 view shows a slight jaggedness/stepping on the lower lip edge.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4/5

### Smirk 1.0
- **Readability:** Very clear one-sided smirk.
- **Artifacts:** The raised corner of the mouth feels slightly "stuck" to the surface rather than pulling the cheek volume in the left34 view.
- **2D Tricks:** Feels slightly like a surface-only deformation in the profile.
- **Angle Consistency Rating:** 4/5

---

## 3. Combo Analysis

### Combo Crisis
- **Readability:** High intensity stress/crisis.
- **Artifacts:** Left34 view shows significant stretching around the nasolabial fold and the side of the mouth. The combination of mouth-open and furrowed-brow poses is pushing the topology to its limits.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 3.5/5

### Combo Calm
- **Readability:** Composed and relaxed.
- **Artifacts:** No major artifacts.
- **2D Tricks:** None.
- **Angle Consistency Rating:** 4.5/5

---

## 4. Conclusion & Recommendations
The current mesh and expression set are production-ready for most angles. 

**Key Recommendations:**
1. **Mouth Corners:** Review vertex weights or blendshapes at the mouth corners for "alarmed" and "smirk" to ensure volume is preserved in three-quarter views.
2. **Nasolabial Folds:** Consider deepening the nasolabial folds for high-intensity smiles (Euphoric) to improve 3D readability.
3. **Topology Stress:** "Combo Crisis" highlights areas where multiple expressions overlapping can cause stretching. Consider a corrective blendshape for this specific combination.
