# psi24 -- Deep Mid-Frequency Component (Predicted: Symmetric Modulator)

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi24 lies deep in the expression PCA tail. All seven renders are visually indistinguishable from the neutral face. No feature-level change is discernible in the mouth, eyes, brows, cheeks, jaw, or overall face shape across the -3.0 to +3.0 weight sweep.

If the alternating pattern from psi10-20 extrapolates, psi24 would be a symmetric modulator (following the sequence: psi10 symmetric, psi11/12 pair, psi13 symmetric, psi14/15 pair, psi16 symmetric, psi17/18 pair, then psi19/20 pair, psi21 symmetric, psi22/23 pair, **psi24 symmetric**). However, the pattern may not persist this deep.

## The Variance Cliff

The practical takeaway for all components in this range (psi20+) is that they have fallen off the variance cliff. The PCA eigenvalues decay rapidly, and by this point each component captures such a small fraction of expression variance that even at 3-sigma weights the resulting vertex displacements are sub-pixel in standard rendering conditions.

## Practical Notes

- Not currently used in any expression recipe.
- No practical application at standard weight budgets.
- No mesh artifacts.

## Confidence

Very low.
