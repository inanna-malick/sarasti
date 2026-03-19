# psi11 — Left Mouth Corner / Left Smirk (Conjugate: psi12)

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Subtle left mouth corner depression, mild left-side downturn |
| 0.0  | Neutral baseline |
| +3.0 | Left-lateralized mouth corner lift, left-sided smirk, left cheek bunching |

## Description

Psi11 is the left-handed member of the first documented asymmetric conjugate pair (psi11/psi12). Where psi1 provides an asymmetric lopsided smile as a primary PCA component, psi11 isolates the lateralization to the left side of the face with lower variance and finer control.

At positive values, the left mouth corner lifts upward and slightly outward. There is accompanying left cheek bunching and a subtle deepening of the left nasolabial fold. The right side of the face remains largely unmoved, creating a clear half-smile or smirk. The 3/4 left view shows the deformation more prominently than the 3/4 right view, confirming the lateralization.

At negative values, the effect reverses: the left mouth corner pulls slightly down, and the left cheek flattens. This creates a subtle one-sided downturn.

## Conjugate Pair: psi11 + psi12

This is the most important practical fact about psi11: **it is designed to be used with psi12 at equal weight to produce a bilateral smile.** The conjugate pair mechanism exploits the mirror symmetry of the PCA space — psi11 handles the left side, psi12 handles the right. Together, they produce a smile that is:

- More mouth-corner focused than psi9's full-face smile
- More "knowing" or wry in character
- Clean bilateral symmetry when weights are matched

This pair is currently the **primary smile driver** in the euphoric expression recipe (ALARM_EUPHORIC_RECIPE), used at weight 2.5 each.

## Symmetry

Strongly asymmetric (score ~0.3). This is by design — the asymmetry is the whole point, enabling conjugate-pair bilateral control.

## Practical Notes

- **Solo use** produces an asymmetric smirk. Useful for contempt, smugness, or knowing expressions.
- **Paired use** at matched weights with psi12 produces bilateral smile. This is the intended use case.
- **Unmatched pair weights** (e.g., psi11 at 2.5, psi12 at 1.0) would produce a left-biased smile — potentially useful for subtle asymmetric character.
- No mesh artifacts at tested weights. Safe operating range is generous for this component.
- Already deployed in production recipes.

## Confidence

Medium. The lateralization and conjugate pair relationship are well-established from prior explorer testing and confirmed in these renders. The subtle per-pixel deformation makes precise characterization of the full expression gestalt harder than for primary components.
