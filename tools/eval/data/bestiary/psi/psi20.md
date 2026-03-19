# psi20 -- Right Lower Face / Right Jaw (Conjugate: psi19)

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi20 is the right-handed mirror of psi19, completing the fourth and final documented conjugate pair in the systematic left/right decomposition of FLAME expression PCA space. The pair operates on the lower face and jaw region.

At the tested weight range (-3.0 to +3.0), the deformation produced by psi20 is at or below the threshold of reliable visual discrimination. All seven renders -- five frontal views across the weight range and both 3/4 profile views at +2.0 -- appear essentially identical to the neutral face. No consistent directional change is discernible across the sweep.

This is entirely expected. By component 20, the PCA eigenvalue has dropped substantially from the leading components. Each successive component captures less training-set variance, meaning that at the same weight magnitude, higher components produce smaller vertex displacements.

## Conjugate Pair: psi19 + psi20

Psi19 (left-lateralized) and psi20 (right-lateralized) together form a bilateral lower face/jaw expression when applied at equal weights. This provides fine-grained jaw control distinct from psi0, which is the primary symmetric component with far larger amplitude and whole-face involvement.

## The Complete Conjugate Pair Architecture (psi10-psi20)

The first 20 expression components beyond psi0-psi9 reveal a systematic structure:

**Symmetric modulators** (solo-safe):
- psi10: mid-face tension
- psi13: upper face aperture
- psi16: chin projection

**Asymmetric conjugate pairs** (use in pairs for bilateral, solo for asymmetric):
- psi11/psi12: mouth corners (highest asymmetric variance)
- psi14/psi15: brows
- psi17/psi18: cheeks / mid-face
- psi19/psi20: jaw / lower face

## Practical Notes

- Not currently used in any expression recipe.
- Effects are below reliable visual threshold at the tested range.
- Would require very large weights (possibly 5.0+) to register visually when combined with active primary components.
- No mesh artifacts observed.

## Confidence

Low. The structural assignment (right-lateralized lower face, conjugate pair with psi19) is inferred from the well-established pair architecture rather than directly observed in these renders. The deformation is too subtle for reliable visual characterization at these weights.
