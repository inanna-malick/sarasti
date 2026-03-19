## psi6 -- Surprise-Anger Polarity

At +3.0, the face is angry. The brows lower and compress toward the midline, the eyes narrow under heavy lids, and the jaw tightens with a downward-pulling tension in the mouth. The overall impression is hostile, confrontational, and assertive -- a face making a demand or issuing a threat. At +1.5, this is a milder sternness, a disapproving authority figure.

At -3.0, the face opens into surprise. The brows shoot upward, the eyes widen, the mouth drops open slightly, and every feature registers "I did not see that coming." The expression is startled, astonished, caught off guard. At -1.5, this is a mild surprise -- brows lifting, eyes widening, the beginning of a "wait, what?" reaction.

The transition through zero is clean and linear. The neutral face sits at rest, and psi6 sweeps from surprised openness through neutral into angry compression without discontinuities. The polarity is counterintuitive: negative = surprise, positive = anger. This matters for recipe design -- the alarm-alarmed recipe uses psi6 at weight -1.5 (not +1.5) to get surprise.

Despite the FLAME label "lower lip depressor," the primary action is in the upper face. The brow-eye complex is the center of gravity: brows rising/falling, eyes widening/narrowing, and the glabella region compressing or releasing. The mouth participates as a secondary actor, opening slightly in surprise and compressing in anger, but the brows are what make this expression readable.

The positive pole reads as: a boss who just discovered embezzlement. A parent who found the car dented. "Explain yourself."
The negative pole reads as: someone who just opened a surprise party door. A scientist seeing unexpected results. "Wait -- WHAT?"

**Symmetry:** 0.95 -- Strong bilateral symmetry. Both surprise and anger are naturally symmetric expressions, and the renders confirm this. No meaningful left-right bias.

**Artifacts:** Clean through the full tested range. At -3.0 the eye-widening is dramatic but geometry holds. At +3.0 the brow compression is intense but does not produce mesh inversion. Well-behaved component.

**Safe range:** [-4.0, 4.0]

**Currently used in:**
- alarm_alarmed recipe at weight -1.5 (surprise -- note the negative sign to access the surprise pole)

**Potential uses:** The anger pole (positive values) is currently unused. It could serve a hypothetical "aggression" or "confrontation" state, or could be mixed at low positive weight into tension/alarm states to add a hostile edge. The surprise pole is already well-utilized in the alarm axis. This component could potentially contribute to a "stern authority" shape at moderate positive values -- useful if financial instruments ever need to look like they are about to issue a margin call.
