# psi19 — Left Lower Face / Left Jaw (Conjugate: psi20)

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Very subtle left lower face softening, left jaw relaxation |
| 0.0  | Neutral baseline |
| +3.0 | Very subtle left lower face firming, left jaw tension/positioning |

## Description

Psi19 is the left-handed member of the fourth asymmetric conjugate pair (psi19/psi20), and it completes a remarkable top-to-bottom organization of the FLAME mid-frequency expression space:

| Pair | Region | Rank in PCA |
|------|--------|-------------|
| psi11/psi12 | Mouth corners | Highest variance asymmetric pair |
| psi14/psi15 | Brows / upper face | Second pair |
| psi17/psi18 | Mid-face / cheeks | Third pair |
| psi19/psi20 | Lower face / jaw | Fourth pair |

The symmetric components (psi10, psi13, psi16) fill the gaps between these pairs, each modulating a different face region bilaterally.

At positive values, the left jaw area and left lower face firm subtly. There is a barely-perceptible left-sided jaw tension or shift. At negative values, the left lower face relaxes.

## Conjugate Pair: psi19 + psi20

At matched weights, psi19 and psi20 would combine into bilateral lower face/jaw expression. This would provide fine-grained jaw control distinct from psi0 (which is a primary symmetric component with large amplitude and whole-face involvement, reading as a frown-smile axis rather than isolated jaw movement).

## Symmetry

Asymmetric (score ~0.35). Left-lateralized by design. Part of the fourth conjugate pair.

## Practical Notes

- Not currently used in any expression recipe.
- The deepest into the PCA ordering of the components examined here. Effects are correspondingly among the most subtle.
- The complete conjugate pair map (psi11-20) reveals a systematic PCA decomposition: the model first captures the most variable asymmetric movements (mouth corners), then progressively decomposes finer asymmetric control across the face from brows down to jaw.
- Would need substantial weights to register visually in the context of active primary components.
- No mesh artifacts.

## The Conjugate Pair Map

Looking at psi10-psi19 as a group reveals an elegant structure in the FLAME PCA decomposition:

**Symmetric modulators** (solo-safe):
- psi10: mid-face tension
- psi13: upper face aperture
- psi16: chin projection

**Asymmetric conjugate pairs** (use in pairs for bilateral, solo for asymmetric):
- psi11/psi12: mouth corners (highest variance, already in production)
- psi14/psi15: brows
- psi17/psi18: cheeks / mid-face
- psi19/psi20: jaw / lower face

This pattern — alternating symmetric and asymmetric components organized by face region and decreasing variance — is a natural consequence of PCA applied to a bilaterally-symmetric face model. The first asymmetric pair captures the most common asymmetric variation (mouth corners during speech and expression), and subsequent pairs capture progressively finer asymmetric control.

## Confidence

Low. The deformations are at the very limit of what can be reliably characterized from static renders at this weight range. The structural analysis (conjugate pair membership, face region assignment) is higher confidence than the specific visual descriptions.
