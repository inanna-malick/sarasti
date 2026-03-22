# FLAME Shape Component Analysis (β0 - β9)

This report analyzes the structural impact of the first ten shape components (β0 through β9) of the FLAME 3D face model. These components define the permanent skeletal and soft-tissue structure of the face (identity), distinct from expression.

## β0: Face Width / Robustness

*   **Negative Pole (-3.0):** Narrow face, elongated skull, slim jawline, and thinner neck. The overall appearance is "ectomorphic" or lean.
*   **Positive Pole (+3.0):** Broad face, wide jaw, significant volume in cheeks and neck. The skull appears shorter and wider. Appearance is "endomorphic" or robust.
*   **Multi-Angle Insight:** The `front` view clearly shows the lateral expansion. The `left34` view reveals how the jawline loses definition as it widens and the neck thickens.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** Minor stretching at the neck-base at +3.0, but no tearing.

## β1: Face Aspect Ratio / Elongation

*   **Negative Pole (-3.0):** Short, wide face with more protrusion in the lower face and jaw area. The face feels "heavy."
*   **Positive Pole (+3.0):** Elongated, narrow face. The features are vertically stretched, leading to a "long face" aesthetic.
*   **Multi-Angle Insight:** `left34` is vital here; it shows that -3.0 isn't just wide, but has a different sagittal projection of the jaw compared to the more vertical +3.0.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None observed.

## β2: Jaw Prominence / Taper

*   **Negative Pole (-3.0):** Strong, prominent, and wide jaw. The face is "bottom-heavy" or square-jawed.
*   **Positive Pole (+3.0):** Tapered jaw, smaller chin. The face is "top-heavy" or heart-shaped, narrowing significantly towards the chin.
*   **Multi-Angle Insight:** `left34` reveals the depth and angle of the mandibular ramus, which is much more vertical at +3.0.
*   **Gradient Smoothness:** 4/5.
*   **Mesh Artifacts:** None.

## β3: Neck Length / Head Height

*   **Negative Pole (-3.0):** Short neck; the head appears to sit lower relative to the shoulders/trapezius.
*   **Positive Pole (+3.0):** Long, elegant neck. The head is elevated.
*   **Multi-Angle Insight:** The `front` view shows the vertical displacement best. `left34` shows the neck-jaw transition.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None.

## β4: Interocular Distance / Eye Spacing

*   **Negative Pole (-3.0):** Eyes are closer together (narrow-set). The bridge of the nose may appear slightly more pinched.
*   **Positive Pole (+3.0):** Eyes are further apart (wide-set).
*   **Multi-Angle Insight:** `closeup` shows the tear duct area and how the inner eye corners move. `front` is best for assessing the overall "look" of the spacing.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** Extreme +3.0 can make the eye-socket-to-bridge transition look slightly flat.

## β5: Nose Tip Angle / Chin Depth (Sagittal Profile)

*   **Negative Pole (-3.0):** Nose is more "hooked" or downward-pointing (aquiline). The chin is slightly receded.
*   **Positive Pole (+3.0):** Nose is more "upturned" or straight (celestial/button). The chin is more prominent and forward-projecting.
*   **Multi-Angle Insight:** **Critical Axis for Profiling.** Changes are nearly invisible from the `front` but transformative in `left34`.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None.

## β6: Brow Prominence / Eye Depth

*   **Negative Pole (-3.0):** Recessed brow ridge; eyes appear more "bulging" or prominent. The forehead-to-eye transition is flatter.
*   **Positive Pole (+3.0):** Prominent brow ridge (supraorbital ridge). Eyes appear deep-set and hooded by the brow.
*   **Multi-Angle Insight:** `left34` shows the "shelf" created by the brow. `closeup` shows the shadow depth in the orbital sockets.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None.

## β7: Nose Width

*   **Negative Pole (-3.0):** Wider nose, particularly at the alae (nostrils) and bridge.
*   **Positive Pole (+3.0):** Narrow, thin nose.
*   **Multi-Angle Insight:** `front` and `closeup` are most useful. `left34` shows if the width affects the profile (it doesn't significantly for this axis).
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None.

## β8: Lip Fullness / Mouth Width

*   **Negative Pole (-3.0):** Thinner lips and a slightly wider mouth opening. The mouth area appears flatter against the face.
*   **Positive Pole (+3.0):** Fuller, more "pouty" lips. The mouth width is slightly reduced laterally.
*   **Multi-Angle Insight:** `closeup` is essential to see the vermilion border and volume. `left34` shows the anterior projection of the lips.
*   **Gradient Smoothness:** 4/5.
*   **Mesh Artifacts:** Minor compression artifacts at the corners of the mouth at +3.0.

## β9: Cheek Volume / Midface Fullness

*   **Negative Pole (-3.0):** Flat cheeks, more prominent malar (cheekbone) definition due to lack of soft tissue. Appearance is "gaunt" or bony.
*   **Positive Pole (+3.0):** Full, rounded cheeks (buccal fat prominence). The midface is "fleshy."
*   **Multi-Angle Insight:** `left34` shows the curve of the cheek (the Ogee curve). `front` shows the change in the face's outline at the midsection.
*   **Gradient Smoothness:** 5/5.
*   **Mesh Artifacts:** None.
