# Beta19 — Chin Projection (Inverted in Dominance)

**Axis:** jutting, projected chin (-) ... retracted, recessed chin (+)

## What It Does

Beta19 controls the anterior-posterior position of the chin. Its natural negative pole projects the chin forward; its positive pole retracts it. This is the only component in the dominance recipe with an inverted weight.

## Positive Pole (+1.5 to +3.0): The Recessed Chin

Pushing positive retracts the chin. The lower face pulls back, the chin becomes less prominent, and the profile below the mouth becomes flatter. At +3.0 the chin is noticeably more recessed, creating a weaker lower-face profile.

## Negative Pole (-1.5 to -3.0): The Jutting Chin

Pulling negative projects the chin forward. The lower face extends anteriorly, the chin becomes more prominent and jutting, and the profile gains a stronger lower-face projection. At -3.0 the chin is noticeably forward — a strong, assertive chin.

## Symmetry

Good bilateral symmetry (0.95). Left and right 3/4 views are consistent.

## Safety

No artifacts at any tested value. The effect is most visible in the 3/4 views where chin projection is prominent. Clean geometry throughout.

## Current Usage

Used in the **dominance** shape axis with weight **-1.9** (inverted). This means:
- **Chad pole** (positive dominance): drives beta19 negative = jutting chin
- **Soyboi pole** (negative dominance): drives beta19 positive = recessed chin

The inversion is deliberate — the component's negative pole provides the forward chin projection desired for dominant faces. This is the only inverted weight in the entire dominance recipe.

## Interactions

- With **beta2** (chin projection): beta2 is the primary chin axis and includes chin projection among its effects. Beta19 provides supplementary anterior-posterior chin control. They likely capture slightly different aspects of chin morphology.
- With **beta12** (chin angularity): beta12 adjusts chin shape; beta19 adjusts chin depth. Complementary dimensions of chin character.
- With **beta3** (jaw width): beta3 widens the jaw laterally; beta19 projects the chin anteriorly. These are orthogonal dimensions — a jaw can be wide-and-projected or wide-and-recessed.

## Naturalist Notes

The inversion of beta19 in the dominance recipe is noteworthy. Most shape components are loaded positive-to-positive: more dominance means more of the component. Beta19 is the exception because its PCA-derived polarity happens to put chin retraction on the positive side, which is the opposite of what dominance needs. The recipe corrects for this by inverting the weight. This is a common situation in PCA-based systems — the signs of principal components are arbitrary, determined by the SVD solver rather than by any semantic meaning. The recipe weight simply aligns the component's effect with the desired perceptual outcome.
