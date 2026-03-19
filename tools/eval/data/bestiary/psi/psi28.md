# psi28 -- Deep PCA Tail Component

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi28 is deep in the expression PCA tail. All seven renders are visually identical to the neutral face. At this PCA depth, the component encodes micro-variations that are invisible at standard render resolution and typical expression weights.

## Where We Are in the Spectrum

The FLAME model provides 50 expression components (psi0-psi49). The PCA eigenvalue spectrum means that the vast majority of expressible facial variation is captured in the first 10-15 components. By psi28, we are well past the point of diminishing returns:

- **psi0-psi9**: Primary expression drivers. Each component produces visible, whole-face deformation at weight 1.0. Currently used in Sarasti recipes.
- **psi10-psi16**: Secondary modulators. Subtle but visible effects. Symmetric components provide bilateral modulation; psi11/12 conjugate pair is in production.
- **psi17-psi19**: Tertiary effects. Very subtle but still detectable in careful comparison.
- **psi20-psi49**: Sub-visual. Deformations below reliable detection threshold at standard weights.

Psi28 is firmly in the sub-visual band.

## Practical Notes

- Not currently used in any expression recipe.
- No practical application for Sarasti.
- No mesh artifacts.

## Confidence

Very low.
