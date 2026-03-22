# Character Animation Evaluation: Expression Combinations (Wave16g)

**Date:** 2026-03-19  
**Evaluator:** Gemini CLI (Senior Character Animator)  
**Subject:** Multi-axis expression blending and shape-expression synergy.

---

## Reference Solo Expressions (Baseline)

Before evaluating the combos, I established the following baseline for the individual axes:
- **Alarmed:** Wide eyes (ψ9), raised brows (ψ4), and jaw drop (ψ2). High energy, shocked.
- **Euphoric:** Broad smile (ψ0, ψ7), relaxed eyes (ψ9), warmth.
- **Wired:** Intense horizontal mouth stretch (ψ6), furrowed brows (ψ4), alert eyes (ψ9). "Caffeinated" focus.
- **Exhausted:** Near-shut eyes (ψ9), deep frown (ψ7), slack jaw (ψ2). "Melting" depletion.
- **Aggressive:** Furrowed brow (ψ4), bared-teeth grimace (ψ6, ψ5), squinted eyes (ψ9). Predatory.
- **Yielding:** High raised brows (ψ4), deep frown (ψ7), slack jaw (ψ2), averted gaze. Vulnerable.

---

## Combo Evaluations

### 1. Combo Crisis
**Composition:** Alarmed (1.0) + Exhausted (1.0) + Aggressive (1.0)
- **Naturalness:** It looks like a state of **manic collapse** or **shocked trauma**. It is not "natural" in a resting sense, but it is a recognizable high-stress state (e.g., shell-shock).
- **Dominance/Loss:** 
    - **Exhausted/Aggressive dominate the eyes (ψ9):** The eye-closing components of Exhaustion (-3.5) and Aggression (-2.0) completely crush Alarmed's eye-opening (+2.5), resulting in a heavy-lidded, squinted stare.
    - **Alarmed dominates the brows (ψ4):** The high brow raise (-3.0) partially offsets the aggressive furrow (+1.5), leaving the brows in a "worried/shocked" high position despite the aggressive mouth.
    - **Synergy on the Jaw (ψ2):** Both Alarmed and Exhausted push for a jaw drop, resulting in a **slack-jawed gape** that is very prominent.
- **Result:** It creates a NEW state: **"The Thousand-Yard Stare."** It looks like someone who is beyond the point of reason—aggressively defensive but physically spent.
- **Coherence Rating:** 3/5 (The eyes fight a bit too much, creating a "glazy" look that might be interpreted as a technical error rather than intent).
- **Improvement:** Reduce Exhaustion to 0.6 to allow the Alarmed eyes to "peek through" more, or reduce Aggression to let the exhaustion-sagginess take over the mid-face.

### 2. Combo Calm
**Composition:** Euphoric (1.0) + Wired (0.5) + Yielding (0.5)
- **Naturalness:** Very natural. It looks like **"Flow State"** or **"Satisfied Engagement."**
- **Dominance/Loss:**
    - **Euphoric dominates the mouth:** The smile (ψ7=1.25 net) survives the yielding frown, resulting in a pleasant, subtle smirk.
    - **Wired/Euphoric synergy on eyes:** Both push for alert eyes (ψ9=2.5 net), creating a look of "bright-eyed" interest.
    - **Yielding dominates the brows:** The brows are slightly raised (-0.5), which removes the "intensity" of Wired and makes the character look approachable.
- **Result:** A very recognizable and appealing state of **"Serene Focus."**
- **Coherence Rating:** 4.5/5.
- **Improvement:** This is a "sweet spot" in the system. No changes suggested.

### 3. Full sharp-chad-crisis
**Composition:** Sharp Jaw + Chad Shape + Crisis Expression
- **Naturalness:** This is a classic "Villian" or "Dark Hero" archetype. The bone structure (sharp, dominant) perfectly complements the intensity of the crisis expression.
- **Dominance/Loss:** The **dominance shape axes** (jaw width, brow ridge) provide the physical scaffolding that makes the "Aggressive" part of the Crisis expression look much more threatening.
- **Result:** **"The Ruthless Commander."** The "Exhausted" components (jaw drop, heavy lids) come across as "Calculated Boredom" or "Cynicism" when paired with a Chad jawline.
- **Coherence Rating:** 5/5.
- **Improvement:** None. This is a perfect example of shape-expression synergy.

### 4. Full puffy-soyboi-calm
**Composition:** Puffy Face + Soyboi Shape + Calm Expression
- **Naturalness:** Highly natural. It looks like a "Content Bureaucrat" or a "Happy Child."
- **Dominance/Loss:** The **puffy/soft shape axes** (rounded jaw, soft features) reinforce the "Yielding" and "Euphoric" components. The "Wired" eyes are softened by the puffy orbital area.
- **Result:** **"The Docile Peasant."** It looks harmless, open, and completely non-threatening.
- **Coherence Rating:** 5/5.
- **Improvement:** None.

---

## Summary Findings

1. **The "Eyelid War":** The most frequent conflict in the system is between Alarmed (wide eyes) and Exhausted (shut eyes). When both are at 1.0, Exhausted usually wins, which can make "Alarmed" feel lost.
2. **Shape Synergy:** The system is extremely effective at using bone structure to re-contextualize expressions. A "Crisis" expression on a "Puffy" face looks like **fear**, while on a "Chad" face it looks like **menace**.
3. **Mouth Cavity:** The recent boost to ψ2 (jaw drop) in Wave16g is a major success—it ensures that "dark mouth cavities" are visible even at thumbnail resolutions (48px), which is critical for reading "Exhausted" and "Yielding" states.

**Final Recommendation:** Consider adding a "conflict resolver" in `chords.ts` that slightly scales down ψ9(-) if ψ4(-) is very high, to prevent the eyes from closing completely when the character is supposed to be "shocked."
