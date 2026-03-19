## psi1 -- The Asymmetry Axis (Smirk / Skeptical Frown)

At +3.0, the face displays a pronounced lopsided smirk. One corner of the mouth pulls upward and backward while the other side remains relatively neutral. There is an accompanying asymmetry in the cheeks and a subtle brow difference. The overall impression is sly, knowing, or sardonic -- the look of someone who sees through a pretense.

At -3.0, the asymmetry reverses. One corner of the mouth drops into a skeptical downturn. The face reads as dubious, unimpressed, or mildly contemptuous. At -1.5 this is a subtle expression of doubt.

The transition through zero is smooth. The neutral baseline is symmetric, and psi1 progressively breaks that symmetry as magnitude increases.

This is the ONLY antisymmetric component in the first ten expression PCs. Its self-reflection correlation is -0.898 (verified via the project's mirror map analysis), meaning when you mirror the mesh, the deformation nearly perfectly inverts. Every other component in psi0-psi9 is symmetric (correlation > +0.9).

The most affected regions are the mouth corners, the nasolabial fold on one side, and subtle periorbital asymmetry. The forehead and cranium are largely unaffected.

The positive pole reads as: a poker player who knows they have the winning hand. A sardonic aside. The Mona Lisa.
The negative pole reads as: a critic watching a bad performance. Mild contempt. "Really?"

**Symmetry:** -0.90 -- Deliberately antisymmetric. Left34 and right34 views confirm opposite-handed expression character.

**Artifacts:** No geometric artifacts in the tested range, but the asymmetry itself is the "artifact" for recipes that need bilateral expression. At high weights, the lopsidedness becomes cartoonish.

**Safe range:** [-3.0, 3.0] -- Keep weights low when used in recipes (current usage at 1.25 is already pushing it).

**Currently used in:**
- alarm_euphoric recipe at weight 1.25 (adds asymmetric smile character)
- NOTE: The project CLAUDE.md explicitly warns against psi1 for bilateral expression. The euphoric recipe mitigates this by combining psi1 at moderate weight with the symmetric psi11+psi12 conjugate pair.

**Potential uses:** Best reserved for intentional asymmetry -- a "character" accent that makes a face look more human and less robotic. Could be useful at very low weights (0.3-0.5) to add natural variation, but the project convention is to avoid it for primary expression axes. If an expression needs to look knowing or sardonic specifically, psi1 is the tool for it.
