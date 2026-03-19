## psi4 -- Engagement / Boredom Tonus

At +3.0, the face is locked in. The lips press together with purpose -- not pursed like psi0-negative, but firm with concentration. The eyes narrow slightly, not squinting but focusing. The periorbital muscles tighten. The overall impression is of someone who is deeply engaged, alert, and tracking something intently. At +1.5, this is a subtle attentiveness -- the difference between someone who is present and someone who is merely sitting there.

At -3.0, everything slackens. The face loses its tension, the mouth relaxes into a loose, slightly parted neutrality, and the eyes defocus. The expression reads as vacant, bored, and utterly disengaged. At -1.5, this is the early stages of checking out -- the moment a student's attention drifts in a lecture.

The transition through zero is exceptionally smooth. This component operates more through muscle tone modulation than through dramatic shape changes. The neutral face sits at a middling level of engagement, and psi4 dials this up or down.

What makes psi4 distinctive is its whole-face distribution. Where psi0 is primarily mouth, psi3 is primarily mid-face, and psi8 is primarily upper-face, psi4 affects all regions simultaneously but subtly. It is a "tone knob" rather than a "shape knob." The visual effect at any given intensity is less dramatic than other components, but it is immediately readable at the gestalt level -- you recognize the face as "paying attention" or "not paying attention" even if you cannot point to which specific feature changed.

The positive pole reads as: a chess player calculating six moves ahead. A hawk tracking prey. A surgeon mid-procedure.
The negative pole reads as: someone on hold with their insurance company. The third hour of a bad meeting. Sunday afternoon ennui.

**Symmetry:** 0.97 -- Near-perfect bilateral symmetry. One of the best-behaved components for symmetric expression.

**Artifacts:** Extremely clean. Because psi4 works through tone rather than dramatic deformation, mesh artifacts are essentially absent even at extremes. The geometry changes are subtle and well-distributed, avoiding the vertex bunching or thinning that affects more dramatic components.

**Safe range:** [-4.0, 4.0] -- Possibly safe well beyond this range given its subtlety.

**Currently used in:**
- fatigue_wired recipe at weight 1.2 (engagement -- locked in, wired)
- fatigue_exhausted recipe at weight -1.5 (boredom -- shutdown, vacant)

**Potential uses:** This is the ideal "energy level" modulator. It belongs on any axis where the face needs to convey the difference between active engagement and passive withdrawal. Its subtlety makes it safe to layer on top of more dramatic components without visual conflict. Could potentially contribute to alarm states (positive = hypervigilant) or content states (slight negative = relaxed but not vacant). The fact that it works across the whole face makes it complement rather than compete with regionally-focused components.
