# FLAME Expression Component Analysis ($\psi_0$ - $\psi_9$)

Researcher: Gemini CLI
Date: March 19, 2026
Data Source: `tools/eval/data/renders/census/psi/`

## Component $\psi_0$
- **Negative Pole (-3.0):** Mouth is tightly pursed and pushed forward ("oo" shape). The chin is bunched (mentalis muscle activation). Brows are slightly lowered and the face has a "disgusted" or "disapproving" look.
- **Positive Pole (+3.0):** A clear, broad smile. The mouth corners are pulled up and out. Eyes are slightly narrowed due to cheek raising (Duchenne-like quality). Overall "happy" impression.
- **Multi-Angle Observations:** The `closeup` view reveals significant skin bunching around the chin and nasolabial folds at -3.0. The `left34` view shows the mouth protrusion at -3.0 and the cheek volume increase at +3.0 that the front view slightly flattens.
- **Gradient Smoothness:** 5/5. Very natural transition from purse to smile.
- **Label:** **Mouth Purse vs. Broad Smile**
- **Artifacts:** None noted.

## Component $\psi_1$
- **Negative Pole (-3.0):** Asymmetric mouth pull. The left corner (viewer's right) is pulled down and slightly out, while the right corner stays relatively neutral or moves slightly up. Brows show slight asymmetric tension.
- **Positive Pole (+3.0):** Mirror image of -3.0. The right corner (viewer's left) is pulled down.
- **Multi-Angle Observations:** The `left34` view is critical here; when looking from the left at +3.0, the pull is much more dramatic than it appears from the front. The depth of the oral commissure pull is visible.
- **Gradient Smoothness:** 4/5. The asymmetry can feel a bit "mechanical" but the mesh holds up.
- **Label:** **Asymmetric Lip Corner Depressor (Left vs. Right)**
- **Artifacts:** Slight shading oddity at the extreme corner of the mouth at -3.0.

## Component $\psi_2$
- **Negative Pole (-3.0):** Mouth is closed very tightly, lips compressed together. The jaw seems slightly retracted.
- **Positive Pole (+3.0):** Pure jaw drop. The mouth is open wide, but the lips aren't specifically shaped (like for a vowel), just pulled apart by the jaw. Brows are slightly raised.
- **Multi-Angle Observations:** `left34` shows the significant vertical displacement of the jaw. `closeup` shows the teeth/inner mouth area (rendered dark) very clearly.
- **Gradient Smoothness:** 5/5.
- **Label:** **Jaw Compression vs. Jaw Drop (Surprise)**
- **Artifacts:** None.

## Component $\psi_3$
- **Negative Pole (-3.0):** Lip corners are pulled horizontally wide (Risorius muscle). The mouth becomes a narrow slit. Eyes squint slightly.
- **Positive Pole (+3.0):** Mouth corners are pulled inwards and downwards, creating a "funnel" or "pouty" shape. The philtrum elongates.
- **Multi-Angle Observations:** `left34` shows the flattening of the lips against the teeth at -3.0. `front` view misses how much the lips actually protrude at +3.0.
- **Gradient Smoothness:** 4/5.
- **Label:** **Mouth Stretch (Wide) vs. Lip Pucker/Funnel**
- **Artifacts:** None.

## Component $\psi_4$
- **Negative Pole (-3.0):** High eyebrow raise. The entire forehead is shifted upwards. Eyes appear very wide.
- **Positive Pole (+3.0):** Strong brow furrow (Corrugator). The brows are pulled down and together. Deep vertical folds would be here if the texture supported it; the mesh shows a clear "V" dip between the brows.
- **Multi-Angle Observations:** `closeup` shows the "V" shape in the brow mesh at +3.0 very clearly. `left34` shows the brow ridge protrusion.
- **Gradient Smoothness:** 5/5. Essential component for almost all expressions.
- **Label:** **Brow Raise vs. Brow Furrow**
- **Artifacts:** None.

## Component $\psi_5$
- **Negative Pole (-3.0):** Upper lip raiser (Levator labii superioris). The center of the upper lip is pulled up, exposing where the upper teeth would be. "Sneer" look.
- **Positive Pole (+3.0):** Upper lip is pulled down and over the lower lip slightly. The mouth looks "tucked."
- **Multi-Angle Observations:** `closeup` is vital for seeing the lip-on-lip interaction at +3.0. The `left34` view shows the "snarl" profile at -3.0.
- **Gradient Smoothness:** 4/5.
- **Label:** **Upper Lip Snarl vs. Upper Lip Tuck**
- **Artifacts:** At +3.0, the upper lip can look slightly "melted" into the lower lip.

## Component $\psi_6$
- **Negative Pole (-3.0):** Large "O" shape mouth. Different from $\psi_2$ (jaw drop) because the lips are actively rounded.
- **Positive Pole (+3.0):** Mouth is closed and stretched into a very wide, thin horizontal line.
- **Multi-Angle Observations:** `left34` at -3.0 shows the lips forming a "trumpet" like protrusion. `front` view makes it look like a simple circle.
- **Gradient Smoothness:** 4/5.
- **Label:** **Rounded Mouth ("Oh") vs. Horizontal Lip Stretch**
- **Artifacts:** None.

## Component $\psi_7$
- **Negative Pole (-3.0):** Mouth corners pulled sharply down. Pure "sad" or "frown" expression.
- **Positive Pole (+3.0):** Mouth corners pulled up. A "polite" or "tight-lipped" smile.
- **Multi-Angle Observations:** `closeup` reveals how the nasolabial folds change direction completely between poles.
- **Gradient Smoothness:** 5/5.
- **Label:** **Corner Depressor (Sad) vs. Corner Anguli (Smile)**
- **Artifacts:** None.

## Component $\psi_8$
- **Negative Pole (-3.0):** Jaw is shifted to the viewer's right (model's left).
- **Positive Pole (+3.0):** Jaw is shifted to the viewer's left (model's right).
- **Multi-Angle Observations:** `front` view is best for seeing the lateral shift. `left34` at -3.0 makes the jaw look strangely disconnected because it's shifting away from the camera.
- **Gradient Smoothness:** 3/5. Lateral jaw movements often look slightly "robotic" in linear blends.
- **Label:** **Lateral Jaw Shift (Left/Right)**
- **Artifacts:** Mesh around the TMJ (ear area) can look slightly distorted at extreme shifts.

## Component $\psi_9$
- **Negative Pole (-3.0):** Eye lids are closed or very tightly squinted.
- **Positive Pole (+3.0):** Eye lids are opened wide, showing "scared" or "surprised" eyes.
- **Multi-Angle Observations:** `closeup` is essential. At -3.0, you can see if the lids "intersect" or just meet. At +3.0, the upper lid retraction is visible.
- **Gradient Smoothness:** 5/5.
- **Label:** **Eye Squint/Close vs. Eye Wide Open**
- **Artifacts:** None.
