# Beta9 — Ear Prominence and Temporal Width

**Axis:** flat/recessed ears (-) ... prominent/protruding ears (+)

## What It Does

Beta9 is the ear component. It controls how much the ears protrude from the skull and the width of the head at the temporal level — the stripe of skull directly above and around the ears.

## Positive Pole (+1.5 to +3.0): The Prominent Ears

Pushing positive pushes the ears outward from the skull. They become more visible in the frontal view, protruding further from the head silhouette. The temporal region may widen slightly as the lateral skull geometry expands at ear level. At +1.5 the ears are subtly more prominent. At +3.0 they are visibly protruding — "jug ears" territory, though the FLAME ear geometry is simplified enough that the effect is more about protrusion than fine ear shape.

The 3/4 views show the ear protrusion most clearly: the ear stands further off the skull in profile, catching more light and shadow on its anterior surface.

## Negative Pole (-1.5 to -3.0): The Flat Ears

Pulling negative pins the ears against the skull. They become less visible in the frontal view, presenting a sleeker lateral silhouette. The temporal region narrows slightly. At -1.5 the ears are subtly flatter. At -3.0 they are pressed close to the skull — almost blending into the head contour.

## Subtlety Level

This is the subtlest component in the beta0-beta9 range. Ears are not where viewers look when reading a face. The change is real and visible, but it carries almost no semantic weight in terms of dominance, age, or emotional state. In a field of 25 faces at typical rendering size, beta9's contribution would be essentially invisible as a standalone effect.

## Symmetry

Good symmetry (0.95). Both ears protrude or flatten together. The left and right 3/4 views match well, confirming even bilateral effect.

## Safety

Clean through the full range. The ear is a relatively simple mesh region with no fine details that could fold or invert. No artifacts at any tested value.

## Current Usage

Not used in any current recipe — neither dominance nor stature. This is appropriate. Ear prominence is not a meaningful signal for any of the axes Sarasti cares about.

## Potential Future Use

While beta9 is not useful for crisis-state mapping, it could serve as a source of **individual identity variation**. If the 25 faces in the field need to be visually distinct from each other (beyond their crisis-state-driven expressions and dominance shapes), mixing in small amounts of beta9 (along with other non-recipe components) could add subtle character differences. Ear protrusion is one of those features that helps make a face look like a specific individual rather than a generic template.

## Interactions

- With **beta0**: beta0 scales the whole head, including ears. Beta9 independently controls ear protrusion. You could have a massive head (beta0+) with flat ears (beta9-) or a small head (beta0-) with prominent ears (beta9+). The two are orthogonal in this region.
- With **beta2**: beta2 widens the midface; beta9 widens at the ear level. They control width at different vertical heights of the face — midface vs. temporal — and do not interact strongly.

## Naturalist Notes

Ear protrusion (otapostasis) is one of the more heritable facial features, with relatively high twin concordance. It has minimal correlation with sex, age, or body composition — it is essentially a "character" trait rather than a demographic or physiological signal. In the FLAME PCA, the fact that it appears as its own component (rather than being mixed into a mass or proportions axis) confirms that ear shape varies somewhat independently of other facial structures in the training population.
