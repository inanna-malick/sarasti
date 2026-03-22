# VFX Review Report: Wave 16 FLAME Renders
Date: 2026-03-19
Supervisor: Gemini CLI (VFX Specialist)

## 1. Summary of Top 5 Most Severe Issues
Across the 72 reviewed images, the following issues were most detrimental to visual quality and immersion:

1.  **Mouth "Black Hole" Effect (Severity 4):** Expressions like `alarmed` and `crisis` show a void-like pitch-black mouth interior. The complete absence of teeth, tongue, or internal oral geometry is the single biggest immersion breaker.
2.  **Lifeless/Dead Eyes (Severity 3):** Most renders suffer from "dead eye" syndrome. Pupils are flat, dark, and lack specular highlights or corneal reflections. This is especially noticeable in `neutral` and `aggressive` sets.
3.  **Mesh Strain/Artifacts at Mouth Corners (Severity 3):** Extreme expressions (e.g., `smirk`, `combo_sharp-chad-crisis`) cause the mesh to pull unnaturally, creating shadow artifacts that look like holes or jagged geometry at the commissures.
4.  **Shadow Banding & Aliasing (Severity 2):** Subtle but persistent horizontal banding in shadows is visible under the eyes and jawline (e.g., `combo_crisis`). This suggests low shadow map resolution or improper bias settings in the renderer.
5.  **Uncanny Skin Uniformity (Severity 2):** While `weathered` tries to add texture, most models (especially `young` and `puffy`) have a plastic-like skin finish that lacks micro-surface detail (pores, fine wrinkles) and subsurface scattering.

---

## 2. Per-Image Review Table

| Filename | Severity | Issues Found |
| :--- | :---: | :--- |
| aggressive_1.0_closeup_eyes.png | 2 | Dead eyes, very dark pupils. |
| aggressive_1.0_closeup.png | 2 | Shadow artifacts at base of nostrils. |
| aggressive_1.0_front.png | 2 | Jagged lip line. |
| aggressive_1.0_left34.png | 2 | Consistent with other aggressive views. |
| alarmed_1.0_closeup_eyes.png | 3 | Eyes bulging unnaturally; whites too clean. |
| alarmed_1.0_closeup.png | 4 | **Black hole mouth interior.** Completely broken immersion. |
| alarmed_1.0_front.png | 4 | Black hole mouth interior. |
| alarmed_1.0_left34.png | 4 | Black hole mouth interior. |
| chad_1.0_closeup_eyes.png | 2 | Lacks eye highlights. |
| chad_1.0_closeup.png | 2 | Bridge of nose too smooth/low detail. |
| chad_1.0_front.png | 2 | Jawline is very sharp, looks slightly aliased. |
| chad_1.0_left34.png | 3 | Jaw-to-neck transition looks clipped/unnatural. |
| combo_calm_closeup_eyes.png | 1 | Best looking eyes in the set, still a bit flat. |
| combo_calm_closeup.png | 1 | No major issues. |
| combo_calm_front.png | 1 | No major issues. |
| combo_calm_left34.png | 1 | No major issues. |
| combo_crisis_closeup_eyes.png | 3 | Shadow banding under eyes. |
| combo_crisis_closeup.png | 4 | **Black hole mouth.** Mesh strain at corners. |
| combo_crisis_front.png | 4 | Black hole mouth. |
| combo_crisis_left34.png | 4 | Black hole mouth. |
| combo_puffy-soyboi-calm_closeup_eyes.png | 1 | Eyes look okay for the caricature. |
| combo_puffy-soyboi-calm_closeup.png | 2 | Nose looks "buried" in puffy cheeks. |
| combo_puffy-soyboi-calm_front.png | 1 | Consistent. |
| combo_puffy-soyboi-calm_left34.png | 1 | Consistent. |
| combo_sharp-chad-crisis_closeup_eyes.png | 3 | Eyes look stressed but flat. |
| combo_sharp-chad-crisis_closeup.png | 4 | **Severe mesh strain at mouth corners.** Black hole mouth. |
| combo_sharp-chad-crisis_front.png | 4 | Severe mesh strain at mouth corners. |
| combo_sharp-chad-crisis_left34.png | 4 | Jawline-mouth corner interaction looks broken. |
| euphoric_1.0_closeup_eyes.png | 2 | Squinting wrinkles are blurry/low-res. |
| euphoric_1.0_closeup.png | 3 | Smile looks like a grimace; no teeth visible. |
| euphoric_1.0_front.png | 3 | Grimace-like smile. |
| euphoric_1.0_left34.png | 3 | Grimace-like smile. |
| exhausted_1.0_closeup_eyes.png | 2 | Pupils look slightly misaligned (cross-eyed). |
| exhausted_1.0_closeup.png | 2 | Blotchiness on forehead skin. |
| exhausted_1.0_front.png | 2 | Dark circles under eyes look like paint. |
| exhausted_1.0_left34.png | 2 | Consistent. |
| neutral_closeup_eyes.png | 1 | Baseline. Dead eyes. |
| neutral_closeup.png | 1 | Baseline. |
| neutral_front.png | 1 | Baseline. |
| neutral_left34.png | 1 | Baseline. |
| puffy_1.0_closeup_eyes.png | 2 | Plastic-like skin reflections on cheeks. |
| puffy_1.0_closeup.png | 2 | Nostrils look squashed. |
| puffy_1.0_front.png | 2 | Cheeks lack surface detail. |
| puffy_1.0_left34.png | 2 | Consistent. |
| sharp_1.0_closeup_eyes.png | 2 | High contrast shadows look a bit harsh/low-poly. |
| sharp_1.0_closeup.png | 2 | Cheekbone shadow transition is stepped. |
| sharp_1.0_front.png | 2 | Aliasing on the jawline silhouette. |
| sharp_1.0_left34.png | 2 | Consistent. |
| smirk_1.0_closeup_eyes.png | 2 | Eye asymmetry is good, but pupils still dead. |
| smirk_1.0_closeup.png | 3 | **Mouth corner looks like a hole** (shadow artifact). |
| smirk_1.0_front.png | 3 | Mouth corner hole artifact. |
| smirk_1.0_left34.png | 3 | Mouth corner hole artifact. |
| soyboi_1.0_closeup_eyes.png | 1 | Caricature fits the target. |
| soyboi_1.0_closeup.png | 1 | Thin lips are well-defined. |
| soyboi_1.0_front.png | 1 | Consistent. |
| soyboi_1.0_left34.png | 1 | Consistent. |
| weathered_1.0_closeup_eyes.png | 2 | Wrinkles look like noise/grain. |
| weathered_1.0_closeup.png | 2 | Eye bags lack anatomical depth. |
| weathered_1.0_front.png | 2 | Skin looks "dirty" rather than aged. |
| weathered_1.0_left34.png | 2 | Consistent. |
| wired_1.0_closeup_eyes.png | 3 | Sclera is too bright; "sticker eye" effect. |
| wired_1.0_closeup.png | 2 | High-intensity look is uncanny but technically okay. |
| wired_1.0_front.png | 2 | Consistent. |
| wired_1.0_left34.png | 2 | Consistent. |
| yielding_1.0_closeup_eyes.png | 1 | Very similar to neutral. |
| yielding_1.0_closeup.png | 1 | No major issues. |
| yielding_1.0_front.png | 1 | No major issues. |
| yielding_1.0_left34.png | 1 | No major issues. |
| young_1.0_closeup_eyes.png | 2 | Too smooth; mannequin look. |
| young_1.0_closeup.png | 2 | Lacks any skin micro-texture. |
| young_1.0_front.png | 2 | Head shape looks a bit too spherical. |
| young_1.0_left34.png | 2 | Consistent. |

---

## 3. Recommendations

### Immediate Fixes (High Priority)
1.  **Add Teeth and Tongue Geometry:** This is critical for all expressions involving an open mouth. A basic set of teeth and a dark-red interior would eliminate the "black hole" effect.
2.  **Add Specular Highlights to Eyes:** A simple small, bright reflection on the cornea would solve the "dead eye" issue in 90% of the cases.
3.  **Refine Mouth Corner Weights:** Review the skinning weights at the commissures to prevent the mesh from pinching or creating "holes" during smirks and wide-mouth expressions.

### Technical Improvements (Medium Priority)
1.  **Increase Shadow Map Resolution/Bias:** Adjust the renderer's shadow settings to eliminate the banding visible in facial creases.
2.  **Introduce Subsurface Scattering (SSS):** Even a simple SSS pass would help the skin look more like flesh and less like plastic.

### Aesthetic Refinement (Low Priority)
1.  **Micro-Texture Detail:** Introduce a subtle noise or pore map to break up the perfectly smooth surfaces of the "young" and "puffy" models.
2.  **Anatomical Wrinkles:** For `weathered` and `euphoric` sets, ensure wrinkles follow the underlying musculature rather than appearing as flat texture overlays.
