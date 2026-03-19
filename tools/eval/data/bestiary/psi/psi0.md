## psi0 -- Mouth Aperture / Valence Gate

At +3.0, the face displays a wide, loose grin. The jaw drops, the mouth opens broadly, and the cheeks pull outward and upward. The nasolabial folds deepen. The overall impression is affable and slightly dopey -- someone receiving pleasant news they did not expect. At +1.5, this is a gentle, warm smile with parted lips.

At -3.0, the lips compress into a tight, prim pucker. The mouth becomes a small rosebud shape, pinched and withholding. The face reads as someone biting back a comment, or tasting something sour. At -1.5 this is a subtle tightening, lips pressed together in mild disapproval or concentration.

The transition through zero is smooth and essentially linear. The neutral face has a relaxed, closed-mouth resting state, and psi0 sweeps cleanly from pursed-tight to wide-open without any discontinuities or sudden jumps.

Despite the FLAME documentation calling this "jaw drop," it is much more than a hinge. The entire lower face reorganizes: cheeks move, nasolabial folds deepen, lip shape changes. The upper face is largely unaffected, making this primarily a lower-face component.

The positive pole reads as: someone who just got good news, a friendly greeting, a loose and trusting openness.
The negative pole reads as: someone withholding judgment, suppressing a reaction, a librarian's quiet disapproval.

**Symmetry:** 0.96 -- Near-perfect bilateral symmetry. The left34 and right34 views at +2.0 are essentially mirror images.

**Artifacts:** Clean through the full tested range of -3.0 to +3.0. At positive extremes the mouth opens very wide but geometry remains intact. At negative extremes, lips thin but do not invert. Conservative safe range extends to at least +/-4.0.

**Safe range:** [-4.0, 4.0]

**Currently used in:**
- alarm_euphoric recipe at weight 0.75 (light smile)
- fatigue_exhausted recipe at weight 0.4 (slack, dopey mouth)

**Potential uses:** This is the most reliable general-purpose mouth modulator. It could serve any axis that needs mouth openness variation. Its positive pole adds warmth to euphoric states; its negative pole could contribute to tense, clenched states. Good candidate for a "reserve" component that adds subtle mouth character to any recipe without risk of artifacts.
