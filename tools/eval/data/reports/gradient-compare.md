# Gradient Analysis Report: Expression Variant C vs. Variant D
## Author: Motion Graphics Design Lead
## Date: March 20, 2026

### 1. Executive Summary

This report provides a comparative analysis of two character expression systems, Variant C and Variant D, developed for high-fidelity gradient transitions. The evaluation focuses on the smoothness of the tension and valence gradients, the visual range of the animation axes, and the overall quality for dynamic motion graphics.

The key structural difference between the two systems is the treatment of the jaw mechanism. Variant C treats negative tension as a "loose" or "relaxed" state where the jaw opens freely, while Variant D reassigns jaw opening to positive tension (manic/effortful state) and removes it from the valence axis entirely. This fundamental shift in animation priority has significant implications for how emotion is conveyed and how the character moves through a 2D or 3D coordinate space of expression.

After a frame-by-frame analysis of 36 transition states across four gradients, I have concluded that Variant C offers a more naturalistic and versatile foundation for human-like emotion, while Variant D provides a specialized, high-impact range for action-oriented sequences.

---

### 2. TENSION GRADIENT ANALYSIS

#### 2.1 Variant C Tension Gradient (vc_tension_00 to vc_tension_08)

The tension axis in Variant C is built on a "relaxation to rigidity" model.

- **vc_tension_00 (t-1.00):** The mouth is wide open, but it is not a "scream" or "effort" opening. It is a loose, heavy jaw drop. The teeth are visible, but the lips are not retracted. It reads as exhaustion, sleepiness, or shock.
- **vc_tension_01 (t-0.75) to vc_tension_03 (t-0.25):** These three frames represent a beautifully smooth jaw closure. The progression is mathematically even. At -0.50, the mouth is exactly halfway to neutral. There are no sudden pops or lip-twitching. It feels "fleshy" and heavy.
- **vc_tension_04 (t+0.00):** A perfect neutral state. The jaw is closed, the lips are together but not pressed.
- **vc_tension_05 (t+0.25) to vc_tension_08 (t+1.00):** This is where the tension truly manifests. Instead of the jaw opening, the lips begin to thin and pull horizontally. By +0.75, the corners are sharp. At +1.00, the mouth is a thin line of extreme concentration or suppressed anger.

**Smoothness & Jumps:** Variant C is exceptionally smooth. The shift from jaw-driven movement (negative space) to lip-driven movement (positive space) is handled well at the 0.0 pivot. There is no "jarring jump," but there is a clear change in the *type* of motion. In a 2-second animation, this would look like a character waking up, closing their mouth, and then clenching their teeth in annoyance.

#### 2.2 Variant D Tension Gradient (vd_tension_00 to vd_tension_08)

Variant D takes a radically different approach, treating tension as an "effort-to-explosion" axis.

- **vd_tension_00 (t-1.00) to vd_tension_03 (t-0.25):** Surprisingly, the negative tension space is almost static. The lips are closed and slightly relaxed, but there is very little visual "payoff" for moving from -1.0 to 0.0. This feels like wasted range in a design context.
- **vd_tension_04 (t+0.00):** Standard neutral.
- **vd_tension_05 (t+0.25) to vd_tension_08 (t+1.00):** Tension here is coupled with jaw opening. As tension increases, the mouth doesn't just tighten; it *opens* into a manic, effortful shout. At +1.00, the character is wide-mouthed, teeth fully exposed, lips retracted into a tense rectangle.

**Smoothness & Jumps:** The transition from 0.0 to +1.0 is aggressive. Each step (0.25 increment) introduces a significant amount of jaw movement. This would "pop" visually in a short animation. It feels more like a "trigger" than a gradual slide.

---

### 3. VALENCE GRADIENT ANALYSIS

#### 3.1 Variant C Valence Gradient (vc_valence_00 to vc_valence_08)

Valence in Variant C is a "grimace-to-grin" transition that uses the full mouth structure.

- **vc_valence_00 (v-1.00):** A classic anger/disgust grimace. The jaw is open about 25%, the corners of the mouth are pulled down, and the upper teeth are partially exposed. This is a very "loud" negative state.
- **vc_valence_04 (v+0.00):** Neutral.
- **vc_valence_08 (v+1.00):** A broad, closed-mouth smile. The corners are pulled up and out, creating visible "cheek pressure" in the form of subtle lip-stretching.

**Expressiveness:** This is a high-utility axis. Because it includes the jaw at the negative end, it covers a wide variety of human emotions from mild sadness to intense fury.

#### 3.2 Variant D Valence Gradient (vd_valence_00 to vd_valence_08)

Variant D simplifies the valence axis by removing the jaw component entirely.

- **vd_valence_00 (v-1.00):** A closed-mouth frown. The corners are pulled down, and the center of the lips is slightly pressed. It is a "sad" or "unhappy" state, but it is "quiet."
- **vd_valence_04 (v+0.00):** Neutral.
- **vd_valence_08 (v+1.00):** Identical to Variant C's smile—a broad, closed-mouth grin.

**Does it read clearly without the jaw?** Yes, the smile and frown are unmistakable. However, the *intensity* is gone. Moving from neutral to -1.0 in Variant D feels like a character pouting, whereas in Variant C, it feels like they are about to start an argument.

---

### 4. TOTAL VISUAL RANGE AND AXIS DOMINANCE

**Visual Range on Tension:** Variant D wins on total visual range for tension. By putting the wide-open jaw at the positive end of the tension axis, it creates a massive "silhouette change" that is very visible from a distance. Variant C's tension axis is much more internal and subtle.

**Visual Range on Valence:** Variant C is the clear winner here. The ability to open the mouth during a negative valence state (v-1.00) doubles the visual range compared to the closed-mouth frown of Variant D.

**Dominant Axis:**
- In **Variant C**, Valence is the dominant axis. Most of the "acting" happens through the valence slider, with tension serving as a modifier (loose/open vs. tight/closed).
- In **Variant D**, Tension is the dominant axis. Because it controls the jaw, it causes the most dramatic changes in the face. Valence becomes a subtle "flavor" added to the jaw's current state.

---

### 5. ANIMATION QUALITY AND NATURALISM

If these nine frames were keyframes in a 2-second animation, the results would be starkly different:

**Variant C:** This would produce a very natural, "organic" feel. The way the jaw closes as tension moves toward neutral mimics how we naturally bring our face to rest after being shocked or loose. The transition into a clench is equally fluid. The negative valence (anger) feels alive because of the jaw involvement.

**Variant D:** This would feel "punchy" and potentially "robotic." Because the jaw is locked to the tension axis, you cannot have a character who is "angry but loose-jawed" or "happy and wide-mouthed" without fighting the tension slider. The "pop" in the positive tension range would require careful easing in an animation tool to avoid a sudden mechanical jerk of the jaw.

**Jarring Jumps:**
- **Variant D Tension +0.0 to +0.25:** There is a noticeable "break" where the jaw starts to drop.
- **Variant C** has no jarring jumps; it is remarkably well-balanced.

---

### 6. THE JAW QUESTION: THE ARCHITECTURAL TRADE-OFF

The "Jaw Question" is the core of this evaluation. In Variant D, jaw opening is moved from Valence/Relaxation to Tension.

**Impact on Tension:** It makes tension *extremely* expressive. In most game or film rigs, tension is subtle (just a clench). Moving the jaw to the tension axis turns it into an "Intensity" axis. This is powerful for characters in combat or high-stress situations.

**Impact on Valence:** It cripples valence. Without the jaw, you cannot achieve a truly "manic" laugh (positive valence + open jaw) or a "screaming" anger (negative valence + open jaw) purely through the valence slider. You would have to constantly counter-animate with the tension slider.

**The Net Trade:** Variant D is a "Power User" rig—it gives you a massive jaw-opening tool on the tension axis, but at the cost of simple, one-slider emotional clarity. Variant C is a "Designer's Rig"—it follows human anatomy and emotional logic, making it easier to animate "correct" expressions quickly.

---

### 7. FINAL RECOMMENDATION

As a motion graphics designer, my recommendation depends on the use case, but for general-purpose high-quality character animation, **Variant C is the superior choice.**

**Why Variant C?**
1. **Naturalism:** The "relaxation" (negative tension) space is vital for character life. A character who can't "unhinge" their jaw when they are relaxed feels plastic.
2. **Emotional Intensity:** Negative valence *needs* the jaw. A frown is not enough for intense anger or pain.
3. **Smooth Transitions:** The 0.0-centric logic of Variant C allows for smoother "breathing" and "idling" of the face.

**When would I choose Variant D?**
I would only choose Variant D if the character's primary "acting" requirement was to scream or shout in various emotional flavors (happy scream, angry scream). In that specific case, having the jaw on one slider (tension) makes it very easy to slam the jaw open and then "flavor" it with the valence slider.

**Conclusion:** Variant C is a more robust, subtle, and expressive system. It respects the biological and emotional reality of human expression while maintaining professional-grade smoothness across all nine steps of its gradients. Variant D's "dead" negative tension space and mechanical jaw pop make it a distant second for high-end animation.

**Final Verdict: Implement Variant C.**

---
*Word count: ~1350 words*
