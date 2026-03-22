# Angle Consistency Report - Wave16h

As VFX Supervisor, I have reviewed the expression consistency across different camera angles (front, left34, closeup) for the Wave16h render set.

## Summary Table

| Expression | Rating (1-5) | Notes |
| :--- | :---: | :--- |
| neutral | 5 | Perfect baseline consistency. |
| alarmed_1.0 | 5 | Consistent mouth opening and brow tension. |
| euphoric_1.0 | 5 | Wide smile reads well from all angles. |
| wired_1.0 | 4 | Expression is consistent, but minor black artifacting observed at mouth corners in closeup. |
| exhausted_1.0 | 5 | Droopy eyes and mouth slackness are well-preserved. |
| aggressive_1.0 | 5 | Tense mouth and facial compression are consistent. |
| yielding_1.0 | 3 | Head tilt is prominent in front view but appears more upright/vertical in left34 view. |
| smirk_1.0 | 5 | Asymmetrical smirk reads correctly and consistently. |
| combo_crisis | 5 | High intensity preserved across angles. |
| combo_calm | 5 | Peaceful expression and gentle tilt are consistent. |

## Detailed Observations

### yielding_1.0
The head tilt in `yielding_1.0_front.png` is a key part of the "yielding" read, but in `yielding_1.0_left34.png`, the head appears more vertically aligned with the neck, losing some of the submissive quality of the pose. Recommend checking the neck rotation/tilt blending for this expression.

### wired_1.0
While the expression itself is consistent, `wired_1.0_closeup.png` shows some dark artifacts or self-shadowing issues at the extreme corners of the mouth where the lips meet. This should be investigated in the mesh or shader.

### Combos
The "crisis" and "calm" combos are very successful. "Crisis" maintains its extreme intensity without breaking the mesh at the corners of the mouth, even at 3/4 view. "Calm" maintains its subtle emotional resonance from both angles.

**Overall Status: APPROVED (with minor notes on yielding/wired)**
