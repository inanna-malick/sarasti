# psi29 -- Deep PCA Tail Component (End of Census Batch)

## Visual Summary

| Pole | Read |
|------|------|
| -3.0 | Visually indistinguishable from neutral |
| 0.0  | Neutral baseline |
| +3.0 | Visually indistinguishable from neutral |

## Description

Psi29 is the last component in this census batch and the last before the psi30+ range that CLAUDE.md describes as "overfitted to training subjects." All seven renders are visually identical to the neutral face. No feature-level change is discernible across the weight sweep.

## Summary of the psi20-psi29 Band

The entire psi20-29 band shares a single defining characteristic: **visual invisibility at standard weights.** All 70 renders examined across these 10 components (7 renders per component) show no detectable deviation from the neutral face.

This is the natural consequence of PCA eigenvalue decay. The FLAME expression model was trained on a dataset of facial performances, and PCA decomposes this into orthogonal modes ordered by decreasing variance. The first few modes (psi0-9) capture the broad, high-energy movements — jaw drop, brow raise, whole-face expressions. The next band (psi10-19) captures secondary detail — asymmetric mouth corners, subtle brow lateralization, mid-face modulation. By psi20+, the remaining variance is so small that even at 3-sigma weights, the deformation falls below the visual threshold.

### Key findings for psi20-29:
- **psi20**: Completes the psi19/20 conjugate pair (lower face/jaw, right-lateralized). The last component with a confident structural assignment.
- **psi21-29**: Below reliable visual characterization threshold. Structural assignments (symmetric/asymmetric, face region) are purely speculative extrapolation from the psi10-20 pattern.
- **No mesh artifacts** in any component at any tested weight.
- **No practical application** for Sarasti's expression mapping system.

## The Useful Expression Frontier

For Sarasti's purposes, the useful expression frontier lies at approximately psi12:
- **In production**: psi0-psi9 (primary drivers), psi11+psi12 (bilateral smile conjugate pair)
- **Available but unused**: psi10, psi13-psi19 (subtle secondary effects, potentially useful for nuance)
- **Below utility threshold**: psi20-psi49

The 50-component expression space that FLAME provides is generous — roughly 12 components suffice for the full range of crisis-to-face expression mapping.

## Confidence

Very low.
