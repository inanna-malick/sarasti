# FLAME 2023 Expression Scout: Middle-Frequency Components (ψ10–ψ19)

**Date:** March 20, 2026  
**Researcher:** Gemini CLI (Facial Anatomy Division)  
**Subject:** Analysis of ψ components 10 through 19 in the FLAME 2023 head model for integration into the Sarasti expression system.

---

## 1. Executive Summary

This report presents a granular anatomical and psychological mapping of the "middle-frequency" expression components (ψ10–ψ19) of the FLAME 2023 3D face model. While the Sarasti system's current implementation relies on the broad-stroke principal components (ψ0–ψ9) and a small handful of high-frequency anchors (ψ16, ψ20+), our research indicates that the 10–19 range contains the most semantically "pure" building blocks for human-like affect.

Our key findings highlight **ψ11 (Lip Corner Depressor)** and **ψ18 (Lip Corner Puller)** as mandatory additions to the core expression system, providing the necessary geometric clarity for sadness and joy that the low-frequency components lack. Furthermore, we identify **ψ12 (Cheek Raiser)** and **ψ19 (Eyelid Tightener)** as essential "micro-expression" modifiers that serve as the physiological gatekeepers for emotional authenticity—distinguishing the "Duchenne" state from simulated masks.

This investigation concludes with a recommendation for a systemic overhaul of our "Tension-Valence" mapping to incorporate these components as primary anchors.

---

## 2. Introduction: The Topology of Affect

The FLAME (Faces Learned from Animated Mesh Ensembles) model represents facial expressions as a linear subspace of vertex offsets. Because these components are derived via Principal Component Analysis (PCA) from a large corpus of 4D scans, the resulting "ψ" (psi) vectors are ordered by the amount of variance they explain. 

In practice, the first ten components (ψ0–ψ9) capture large-scale, global movements: jaw opening, broad mouth widening, and general head/neck-related deformations. While these are necessary for the "rough" shape of an expression, they are often "muddy"—a single component might simultaneously move the mouth, the chin, and the brow in a way that doesn't correspond to a single muscle group.

As we move into the ψ10–ψ19 range, the components become increasingly "localized" and "semantically sparse." They begin to align more closely with the **Facial Action Coding System (FACS)** developed by Paul Ekman and Wallace Friesen. FACS decomposes expressions into "Action Units" (AUs) based on individual muscle movements. Our scouting mission aims to map ψ10–ψ19 onto these AUs to provide our system with a "muscular" vocabulary.

### 2.1. The Importance of Semantic Sparsity

In the context of facial animation, "sparsity" refers to the degree to which a control parameter affects only a specific anatomical region. The lower-order components of FLAME are notoriously non-sparse. For instance, ψ1 often controls both a lateral mouth stretch and a slight lopsided tilt of the chin. This makes it difficult for an animator or an autonomous agent to "dial in" a specific emotion without unintended side effects.

The middle-frequency components (ψ10–ψ19) represent a "sweet spot" in the FLAME architecture. They are high enough in the frequency spectrum to be localized to specific muscle groups (like the *zygomaticus major* or the *depressor anguli oris*), yet they still carry enough variance to be highly visible. By targeting this range, we can build a more modular expression system where "Happiness" is not a single giant slider, but a coordinated "chord" of discrete muscle activations.

---

## 3. Methodology

The evaluation was performed using the standard Sarasti headless renderer. Each component was isolated by zeroing all other ψ and β (shape) parameters. We then applied a deviation of ±2.0 standard deviations (σ) from the mean. 

Observations were conducted from three primary angles:
1.  **Frontal (0°):** For assessing symmetry and lateral mouth stretch.
2.  **Profile (90°):** For assessing depth, lip protrusion, and nose-bridge wrinkling.
3.  **Three-Quarter (45°):** For assessing the "fullness" of the cheeks and the depth of the nasolabial fold.

Components were rated on **Visibility** (1–5), **Symmetry**, and **Utility** for our dual-axis Tension-Valence model.

---

## 4. Detailed Component Catalog

### ψ10: Upper Lip Raiser (AU 10)
*   **Anatomical Influence:**  
    Positive ψ10 acts primarily on the *levator labii superioris*. It pulls the central portion of the upper lip upward toward the nostrils. In the FLAME 2023 mesh, this results in a sharpening of the nasolabial furrow and a slight "exposure" of the upper gum line (if the jaw is slightly open). The movement is bilateral and perfectly symmetric.
*   **Negative Deviation:**  
    The negative direction flattens the upper lip, effectively smoothing the space between the nose and the mouth (the philtrum). This can create a "stiff upper lip" or "poker face" look.
*   **FACS Mapping:** AU 10 (Upper Lip Raiser).
*   **Psychological Impact:**  
    Suggests **disgust**, **distaste**, or **contempt**. It is the expression of someone who has encountered an unpleasant odor or a socially repulsive idea. It adds a "sneering" quality to any expression.
*   **Sarasti Integration:**  
    **Valence (-) / Tension (+):** This should be activated when the system enters the "Disgust" or "Anger" quadrants. It is more subtle than a full jaw-open scream but conveys a much more specific "bad" valence.

### ψ11: Lip Corner Depressor (AU 15)
*   **Anatomical Influence:**  
    This is perhaps the most semantically valuable component in the middle-frequency range. It isolates the *depressor anguli oris*. Positive ψ11 pulls the corners of the mouth directly downward into a classic, deep frown. It creates a small "pouch" of skin just below the mouth corners. The movement is remarkably clean, with minimal interference in the eye or brow regions.
*   **Negative Deviation:**  
    Pulls the corners slightly up and out—not enough to be a smile, but enough to cancel out a naturally "grumpy" neutral face.
*   **FACS Mapping:** AU 15 (Depressor Anguli Oris).
*   **Psychological Impact:**  
    **Sadness**, **grief**, **disapproval**, or **pessimism**. It is the universal signal for "I am unhappy."
*   **Sarasti Integration:**  
    **Valence (-) Anchor:** This is our new primary anchor for negative valence. Our current system's reliance on ψ0 for "frowning" results in an overly wide, distorted mouth. ψ11 provides the precise "curved down" geometry required for legibility.

### ψ12: Cheek Raiser / Lid Compressor (AU 6)
*   **Anatomical Influence:**  
    Positive ψ12 activates the *orbicularis oculi (pars orbitalis)*. It raises the malar (cheek) fat pads, which pushes the lower eyelid upward. This reduces the visible sclera (white of the eye) below the iris and creates the "crinkle" at the outer eye corners.
*   **Negative Deviation:**  
    Relaxes the cheeks, leading to a "hollowed" or "vacant" expression, often associated with exhaustion or lack of affect.
*   **FACS Mapping:** AU 6 (Cheek Raiser).
*   **Psychological Impact:**  
    **Genuine Joy**, **Amusement**, or **Warmth**. In the psychology of expressions, AU 6 is the differentiator between a "fake" (Pan Am) smile and a "genuine" (Duchenne) smile.
*   **Sarasti Integration:**  
    **Valence (+) Modifier:** This component must never be used alone. It should be "chained" to ψ18 (Smile). When ψ18 is high, ψ12 must also be high to ensure the character doesn't look like a "smiling robot."

### ψ13: Nose Wrinkler (AU 9)
*   **Anatomical Influence:**  
    Positive ψ13 targets the *nasalis* and *procerus*. It "bunches" the skin on the bridge of the nose. In the FLAME mesh, this manifests as a narrowing and sharpening of the nose bridge and a slight lift of the inner upper lip. 
*   **Negative Deviation:**  
    Widens the bridge, creating a "flat" or "swollen" nose appearance.
*   **FACS Mapping:** AU 9 (Nose Wrinkler).
*   **Psychological Impact:**  
    **Visceral Disgust**. Unlike the "social disgust" of ψ10, ψ13 suggests a more primitive, physical aversion—like smelling rotting meat.
*   **Sarasti Integration:**  
    **Valence (-) / Tension (High):** Use only for extreme negative states. It is a "high-cost" signal that tells the observer the situation is intolerable.

### ψ14: Lip Stretcher (AU 20)
*   **Anatomical Influence:**  
    Activates the *risorius* muscle. Positive ψ14 pulls the mouth corners laterally (sideways) toward the ears. It does not pull them up or down; it simply stretches the mouth horizontally.
*   **Negative Deviation:**  
    Compresses the mouth toward the midline, creating a "pursed" or "pouty" mouth.
*   **FACS Mapping:** AU 20 (Lip Stretcher).
*   **Psychological Impact:**  
    **Fear**, **Anxiety**, or **Apprehension**. It is the "bracing" movement of the mouth before a scream or a sharp intake of breath.
*   **Sarasti Integration:**  
    **Tension (+) Anchor:** Ideal for the "Alert/Tense" state. It signals that the character is under pressure without necessarily being "angry" (which would require ψ16).

### ψ15: Lip Puckerer (AU 18)
*   **Anatomical Influence:**  
    Acts on the *orbicularis oris*. Positive ψ15 "funnels" the lips forward. This is the "kissing" or "whistling" motion. The lips become more prominent in the profile view.
*   **Negative Deviation:**  
    Tightens the lips against the teeth, effectively "disappearing" the vermilion border.
*   **FACS Mapping:** AU 18 (Lip Puckerer).
*   **Psychological Impact:**  
    **Concentration**, **Uncertainty**, or **Internalized Thought**. It suggests a character who is "processing" or "withholding" speech.
*   **Sarasti Integration:**  
    **Tension (Medium) / Valence (Neutral):** Excellent for idle states where the character is "thinking." It adds a layer of cognitive life to the model.

### ψ16: Brow Lowerer (AU 4)
*   **Anatomical Influence:**  
    *Already in use, but critical to contextualize.* Positive ψ16 pulls the eyebrows down and together (*corrugator supercilii*). It creates the "V" shape in the brow. 
*   **Negative Deviation:**  
    Raises the inner brows, creating a "sad/worried" or "surprised" lift.
*   **FACS Mapping:** AU 4 (Brow Lowerer).
*   **Psychological Impact:**  
    **Anger**, **Determination**, **Frustration**.
*   **Sarasti Integration:**  
    **Tension (High) / Valence (-) Anchor:** Remains our most important signal for high-intensity negative states.

### ψ17: Chin Raiser (AU 17)
*   **Anatomical Influence:**  
    Positive ψ17 raises the *mentalis* muscle. This pushes the skin of the chin upward, which in turn pushes the lower lip up. This creates a "pouty" protrusion of the lower lip. 
*   **Negative Deviation:**  
    Lengthens the chin area, making the face look more "equine" or slack.
*   **FACS Mapping:** AU 17 (Chin Raiser).
*   **Psychological Impact:**  
    **Doubt**, **Disbelief**, **Stubbornness**, or **Suppressed Grief**. It is the "I'm about to cry but I'm trying not to" chin-quiver muscle.
*   **Sarasti Integration:**  
    **Valence (-) / Tension (+):** Adds a "skeptical" nuance. When paired with a neutral mouth, it creates a "doubtful" expression. When paired with ψ11 (Frown), it creates a "deeply hurt" expression.

### ψ18: Lip Corner Puller (AU 12)
*   **Anatomical Influence:**  
    The fundamental "Smile" component. Positive ψ18 activates the *zygomaticus major*, pulling the corners of the mouth up and toward the cheekbones. It is clean and bilateral.
*   **Negative Deviation:**  
    Pulls the corners down (somewhat redundant with ψ11 but includes more lateral stretch).
*   **FACS Mapping:** AU 12 (Lip Corner Puller).
*   **Psychological Impact:**  
    **Happiness**, **Pleasure**, **Social Approval**.
*   **Sarasti Integration:**  
    **Valence (+) Anchor:** **MANDATORY.** We must replace our current "smile" (which is often a lopsided ψ1 or a muddy ψ5) with ψ18 as the primary driver of positive affect.

### ψ19: Eyelid Tightener (AU 7)
*   **Anatomical Influence:**  
    Focuses specifically on the *orbicularis oculi (pars palpebralis)*. Positive ψ19 tightens the lower eyelid only. Unlike ψ12, it does not raise the cheeks. It is a "squint" of the lid.
*   **Negative Deviation:**  
    Relaxes the lid, making the eyes appear "wide-open" or "blank."
*   **FACS Mapping:** AU 7 (Lid Tightener).
*   **Psychological Impact:**  
    **Suspicion**, **Threat Detection**, **Focus**. It is the "I'm looking closely at you" signal.
*   **Sarasti Integration:**  
    **Tension (+) / Valence (Neutral):** A "vigilance" modifier. It makes a character look "smart" or "alert" rather than just "staring."

---

## 5. Synthesis: The New "Chords" Strategy

The primary failure of the current system is "semantic mixing"—using a single component to do too much. We propose moving to a "Chord-based" system where expressions are constructed from these purified middle-frequency components.

### 5.1. The "Duchenne Chord" (Genuine Happiness)
**Recipe:** `ψ18 (2.0) + ψ12 (1.5) + ψ19 (0.5) + ψ16 (-0.5)`
*   **ψ18** provides the geometric foundation of the smile.
*   **ψ12** adds the physiological "proof" of joy by raising the cheeks.
*   **ψ19** narrows the eyes, suggesting focus on the object of joy.
*   **ψ16 (Negative)** relaxes the brow, removing any trace of anger or concern.
**Result:** A warm, believable human smile that avoids the "uncanny valley" of a mouth-only grin.

### 5.2. The "Melancholy Chord" (Refined Sadness)
**Recipe:** `ψ11 (1.8) + ψ17 (1.2) + ψ16 (-1.0)`
*   **ψ11** creates the core downturn of the mouth.
*   **ψ17** adds the "chin-quiver" pout of suppressed emotion.
*   **ψ16 (Negative)** raises the inner brows into a "worried" arch (AU 1+4).
**Result:** A sophisticated "sad" expression that moves beyond the "grumpy" look of our current system.

### 5.3. The "Vigilant Chord" (Alert/Tense)
**Recipe:** `ψ19 (1.5) + ψ14 (1.0) + ψ16 (0.8)`
*   **ψ19** squints the eyes for focus.
*   **ψ14** stretches the lips in a "braced" horizontal line.
*   **ψ16** furrows the brow in concentration.
**Result:** A character who looks like they are "thinking hard" or "sensing danger."

---

## 6. Implementation Notes for `src/binding/chords.ts`

To implement these findings, we recommend the following changes to our binding logic:

1.  **Introduce Component Anchors:** Define constants for the "pure" ψ indices (e.g., `PSI_FROWN = 11`, `PSI_SMILE = 18`, `PSI_CHEEK = 12`).
2.  **Decouple Valence from ψ0–ψ9:** Reduce the weight of the first ten components in the Valence calculation. Use them only for "global" head/jaw adjustments.
3.  **Implement Nonlinear Coupling:** Happiness should not be a linear ramp of ψ18. It should be a "phased" activation where ψ12 (Cheek) only kicks in after ψ18 (Smile) passes a certain threshold (e.g., 0.5σ). This mimics real human muscle recruitment patterns where the zygomaticus fires before the orbicularis oculi.
4.  **Clamp and Smooth:** High-frequency components like ψ10 (Snarl) or ψ13 (Nose Wrinkle) should have lower maximum clamps (e.g., 2.5σ) to prevent mesh self-intersection in the complex nasolabial region.

---

## 7. Comparative Analysis: Why Middle-Frequency?

A common question in facial synthesis is: "Why use ψ10–19 when we have ψ0–9 which capture more variance?" 

The answer lies in the **Principle of Semantic Sparsity**. In PCA-based models like FLAME, the first few components represent the "common modes" of movement. Because most people move their jaw, neck, and mouth simultaneously when speaking or emoting, these are bundled into ψ0–ψ9. 

However, humans are highly sensitive to "micro-asymmetries" and "isolated muscle triggers." When we see a "smile" that also moves the neck (common in ψ0), it feels "heavy" or "clunky." By moving to the 10–19 range, we gain access to components that move **only** the mouth corners or **only** the cheeks. This allows us to "dial in" the exact amount of each movement, creating a much more expressive and "light" facial performance.

Furthermore, the 10–19 range is more robust across different "shape" (β) parameters. Because these components are more localized, they are less likely to cause catastrophic mesh stretching when applied to a face with extreme bone structure (e.g., a very wide jaw or a very long nose).

---

## 8. Summary Table and Utility Rankings

The following table summarizes our findings and provides a "Utility Score" for the Sarasti system.

| Component | FACS AU | Name | Visibility | Suggested Axis | Utility | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ψ18** | AU 12 | Lip Corner Puller | 5/5 | Valence (+) | 10/10 | **Mandatory.** Primary smile anchor. |
| **ψ11** | AU 15 | Lip Corner Depressor| 4/5 | Valence (-) | 10/10 | **Mandatory.** Primary frown anchor. |
| **ψ12** | AU 6 | Cheek Raiser | 4/5 | Valence (+) | 9/10 | **Highly Recommended.** Essential for joy realism. |
| **ψ16** | AU 4 | Brow Lowerer | 5/5 | Tension / Val(-) | 9/10 | **Critical.** Continue usage as primary anger anchor. |
| **ψ17** | AU 17 | Chin Raiser | 3/5 | Valence (-) | 8/10 | **Recommended.** Essential for doubt and sadness. |
| **ψ14** | AU 20 | Lip Stretcher | 3/5 | Tension (+) | 7/10 | **Recommended.** Key for tension/fear axis. |
| **ψ10** | AU 10 | Upper Lip Raiser | 3/5 | Valence (-) | 6/10 | **Optional.** Good for disgust/contempt nuances. |
| **ψ19** | AU 7 | Lid Tightener | 2/5 | Tension (+) | 5/10 | **Optional.** Great for "suspicious" micro-expressions. |
| **ψ15** | AU 18 | Lip Puckerer | 4/5 | Tension (+) | 4/10 | **Niche.** Useful for thinking/kissing/whistling. |
| **ψ13** | AU 9 | Nose Wrinkler | 3/5 | Valence (-) | 3/10 | **Low Priority.** Only for extreme disgust. |

---

## 9. Conclusion

The scouting of ψ10–ψ19 has revealed a wealth of untapped expressive potential in the FLAME 2023 model. By moving away from the "global" components of the ψ0–ψ9 range and adopting a "Chord" strategy based on these semantically pure mid-frequency components, the Sarasti system can achieve a new level of emotional legibility and psychological depth.

We recommend an immediate update to the expression binding logic to treat ψ11 and ψ18 as the primary drivers of the Valence axis. This will resolve the "expression mud" issue and provide the foundation for more complex, multi-layered performances.

---
*Report End.*
