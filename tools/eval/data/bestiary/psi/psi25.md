# psi25 -- Deep PCA Tail Component

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi25 is deep in the expression PCA tail. All seven renders -- five frontal views spanning the full weight range, plus left and right 3/4 profile views at +2.0 -- are visually indistinguishable from the neutral face. No consistent directional change in any facial feature is observable.

## Entering the Noise Floor

Components in the psi20+ range have crossed what might be called the expression noise floor. The PCA eigenvalues at this depth are so small that the resulting mesh deformations are sub-pixel at standard render resolution. Whatever facial variation these components encode in the training set, it does not produce visually meaningful changes at the weight magnitudes used in expression recipes (typically 1.0-3.0 per component, with total magnitude budgets of 20-25).

This does not mean these components are useless in all contexts. In fine-grained face reconstruction or interpolation between specific training subjects, they contribute meaningful detail. But for the Sarasti use case -- mapping financial crisis dynamics to readable facial expressions -- they are below the utility threshold.

## Practical Notes

- Not currently used in any expression recipe.
- No practical application for Sarasti's expression mapping.
- No mesh artifacts.

## Confidence

Very low. Visual characterization is impossible at these weights.
