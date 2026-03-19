# psi27 -- Deep PCA Tail Component

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi27 is deep in the expression PCA tail. All seven renders are visually identical to the neutral face. No feature-level change is discernible across the -3.0 to +3.0 sweep or in the 3/4 profile views.

By component 27, we are more than halfway through the available 50 expression components, yet the cumulative variance captured by components 0-9 dominates so thoroughly that these later components encode only trace residuals.

## The Deep PCA Landscape (psi20-29)

Components psi20 through psi29 share a common characteristic: they are all below the visual discrimination threshold at the weight magnitudes used in the census renders (+/-3.0). This suggests a sharp variance cliff somewhere between psi15-19 (where deformations are still subtly visible) and psi20+ (where they are not).

For Sarasti's expression system, which currently uses only psi0-psi9 plus the psi11/12 conjugate pair, these components are irrelevant. The entire psi20-29 band could be zeroed without any visible impact on rendered faces.

## Practical Notes

- Not currently used in any expression recipe.
- Functionally invisible at practical weight budgets.
- No mesh artifacts.

## Confidence

Very low. Below the floor of reliable visual characterization.
