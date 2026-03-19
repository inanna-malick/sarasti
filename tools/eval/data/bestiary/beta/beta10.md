# Beta10 — Midface Width / Nasal Bridge

**Axis:** broad, flat midface (-) ... narrow, refined midface (+)

## What It Does

Beta10 modulates the lateral width of the midface, primarily affecting the nasal bridge and the zygomatic (cheekbone) region. It is a subtle component that fine-tunes facial proportions without dramatic structural change.

## Positive Pole (+1.5 to +3.0): The Narrow Midface

Pushing positive slightly narrows the midface. The nasal bridge becomes more pinched and refined, the cheekbones become marginally sharper, and the inter-cheek region tightens. At +3.0 the effect is visible but modest — a slightly more sculpted midface compared to baseline. The nose appears narrower.

## Negative Pole (-1.5 to -3.0): The Broad Midface

Pulling negative broadens the midface. The nasal bridge widens, the cheekbones become less defined, and the region between them flattens. At -3.0 the face reads as having a wider, flatter middle third. The nose broadens marginally.

## Symmetry

Near-perfect bilateral symmetry (0.95). The left and right 3/4 views at +2.0 are essentially mirror images.

## Safety

No artifacts at any tested value. This component is very well-behaved — the deformation is smooth and modest throughout the range. Could likely be pushed well beyond +/-4.0 without issues.

## Current Usage

Not used in any current recipe.

## Interactions

- With **beta0** (global mass): beta0 scales everything including midface; beta10 can fine-tune midface width independently.
- With **beta7** (mid-face width): both affect the midface region, but beta7 is broader and beta10 is more focused on the nasal/zygomatic area.

## Naturalist Notes

This is the first component in this batch that demonstrates the transition from "dramatic global axes" to "subtle regional refinements." At PCA rank 10, the captured variance is noticeably less than the first few components. The visual change between extremes requires deliberate comparison to perceive. This makes beta10 an excellent candidate for identity noise — adding it at low weights to different faces will create subtle variation without risk.
