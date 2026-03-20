# Eye Render Evaluation Report (w1 & w2)

Based on a review of the renders in `tools/eval/data/renders/eyes-w1/` and `tools/eval/data/renders/eyes-w2/`, here is the evaluation of the custom eye shader on the FLAME model:

### 1. Iris/Pupil Visibility
- **Visibility**: They are clearly visible. 
- **Sizing**: The iris is quite large relative to the visible sclera, giving a slightly intense, "staring" look even in neutral expressions. Conversely, the pupil is extremely small (a pinprick), and its size appears completely static across all expressions (even in "alarmed_wired" or "exhausted"). The lack of pupil dilation significantly harms realism.

### 2. Specular Highlight
- **Catchlight**: There is a critical lack of specular highlight or catchlight on the cornea. The eye surface appears entirely matte and flat across all angles (front, closeup, 3/4 views). This is the single biggest factor contributing to the eyes looking "dead" and doll-like rather than wet and alive.

### 3. Color
- **Naturalness**: The iris color is a very vibrant, overly saturated green. It looks more like a high-contrast texture map than natural eye pigmentation. 
- **Detail**: The texture uses hard, dark radial lines that lack natural blending, depth, or organic variation, adding to the painted-on feel.

### 4. Expression Interaction
- **Eyelid Interaction**: The eyes do not interact naturally with the eyelid geometry. In expressions where the eyelids close slightly (e.g., `aggression` / squinting, `yielding` / droopy), the iris appears to clip into or intersect awkwardly with the eyelid meshes, revealing that it acts as a flat surface rather than a volumetric sphere sitting in a socket.

### 5. Anatomical Accuracy
- **Centering and Tracking**: While centered adequately in neutral poses, the eyes fail to track together realistically during extreme expressions. For example, in `alarmed_wired_closeup.png` and `exhausted_closeup.png`, a noticeable strabismus (wall-eyed) effect occurs where the eyes point in slightly divergent directions.
- **Corneal Depth**: The iris feels completely flat against the sclera, lacking the anatomical bulge of the cornea over the iris cavity.

### 6. Scale
- **Readability at 120px**: At a small production scale (~120px per face), the high-frequency, dark radial lines of the iris texture are very likely to cause aliasing, visual noise, or look like a dark smudge. A softer texture with less harsh contrast would scale much better.

### 7. Overall Life
- **Verdict**: The eyes currently look painted-on, plastic, and lifeless. To resolve this and breathe life into the character, the shader critically needs:
  1. A strong, glossy specular highlight (catchlight) to simulate the wet cornea.
  2. A less saturated, softer iris texture to prevent aliasing at small scales.
  3. Dynamic pupil sizing.
  4. Fixes to the eye-tracking/strabismus in extreme expressions.
  5. Better depth/clipping handling against the eyelid geometry.