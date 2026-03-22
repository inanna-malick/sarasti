# Thumbnail Readability Report: Wave 16e (Financial Crisis Monitor)

**Evaluation Context:** 48-64px thumbnails in a high-density financial dashboard.
**Core Requirement:** Immediate pre-attentive recognition of "market state" via facial expression.

## Expression Evaluation

| Expression | Distinguishability (1-5) | Key Thumbnail Features | Confused With | Single Change for Readability |
| :--- | :---: | :--- | :--- | :--- |
| **Neutral** | - | Baseline symmetrical features. | Yielding, Combo Calm | N/A |
| **Alarmed** | 4 | Raised brows (surprise), nasal flare, slightly open mouth. | Wired (at a distance) | Increase brow elevation (ψ6) to create more white space above iris. |
| **Euphoric** | 5 | Wide smile (mouth corners up), cheek lift, eye crinkle. | None | Already highly readable. |
| **Wired** | 3 | Focused eyes, tense jaw, pinched brow. | Neutral, Aggressive | Increase nostril flare (ψ3) or mouth aperture (ψ4) to signal "high energy." |
| **Exhausted** | 4 | Heavy eyelid droop (ψ7), slack jaw. | Yielding | Exaggerate the downward "pull" of the mouth corners (ψ5) to signal capitulation. |
| **Aggressive** | 5 | Intense brow furrow, snarl (teeth bared), focused stare. | Combo Crisis | Lower the brows even further to reduce "eye" visibility and emphasize the "V" shape. |
| **Yielding** | 2 | Soft/curved brows, neutral/slack mouth. | Neutral | Add a subtle downward lip curve (frown) to distinguish "vulnerable" from "neutral." |
| **Smirk** | 3 | Asymmetric mouth lift, one cheek higher. | Neutral (if resolution is too low) | Increase the asymmetry of the mouth corner (ψ11/12) to ensure the slant is visible. |
| **Combo Crisis** | 5 | Distorted: intense brow + heavy eyelids + open snarl. | Aggressive | This is the "high-signal" state; keep it high-variance even if it looks "messy." |
| **Combo Calm** | 3 | Softened features, alert eyes, slight smile. | Neutral, Euphoric | Brighten the eye area or slightly increase head tilt to signal "positive stability." |

## Confusion Matrix (Predicted for 48px)

| Actual \ Perceived | Neutral | Alarmed | Euphoric | Wired | Exhausted | Aggressive | Yielding | Smirk | Crisis | Calm |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Neutral** | **X** | | | | | | O | | | O |
| **Alarmed** | | **X** | | O | | | | | | |
| **Euphoric** | | | **X** | | | | | | | |
| **Wired** | O | | | **X** | | O | | | | |
| **Exhausted** | | | | | **X** | | O | | | |
| **Aggressive** | | | | | | **X** | | | O | |
| **Yielding** | O | | | | | | **X** | | | |
| **Smirk** | O | | | | | | | **X** | | |
| **Combo Crisis** | | | | | | O | | | **X** | |
| **Combo Calm** | O | | O | | | | | | | **X** |

*Legend: **X** = Correct Identification, **O** = Likely Confusion.*

## Key Recommendations

1. **Brow-Eye Contrast:** At 48px, the relationship between the brow and the eye is the most critical signal. `Aggressive` and `Alarmed` are well-separated because one pushes brows down and the other pulls them up.
2. **Mouth Shape vs. Size:** The "Euphorics" are unmistakable because of the mouth width. To improve `Exhausted`, the mouth needs to not just be slack, but clearly "lengthened" vertically.
3. **Asymmetry is Risky:** `Smirk` is easily lost at low resolution. If "Contempt" or "Smirk" is a key market signal, it needs significant exaggeration (Tier 1 read) or a head-tilt assist.
4. **The "Yielding" Problem:** This is currently too close to Neutral. In a financial context, "Yielding" (capitulation) is as important as "Crisis." It needs a more distinct marker, perhaps "melancholic" brow tilt (inner brows up).

**Designer Signature:** *Sarasti Dashboard Design Team*
