# Beta23 — Chin/Jaw Angular Refinement

**Axis:** softer/recessed chin (-) ... sharper/projected chin (+)

## What It Does

Beta23 modulates the lower face with subtle changes to chin projection and jawline angularity. It is currently used in the dominance recipe.

## Positive Pole (+1.5 to +3.0): Marginal Chin Sharpening

At +3.0 the chin appears very slightly more pointed or projected, and the jawline contour reads as fractionally more angular. The effect is concentrated in the lower third of the face. At +1.5, the change is barely perceptible.

## Negative Pole (-1.5 to -3.0): Marginal Chin Softening

At -3.0 the chin rounds slightly and the jawline softens by a small amount. The face reads as marginally less angular. At -1.5, the effect is at the edge of detection.

## Symmetry

Appears symmetric (0.94). Both 3/4 views show comparable changes on their respective sides.

## Safety

Extremely safe. No artifacts at any tested value. Even at the recipe weight of 3.75 multiplied by typical activations, the vertex displacements remain modest.

## Current Usage

Used in the **dominance** shape axis with weight **3.75** — "bone structure detail." This is one of the higher weights in the dominance recipe, suggesting it was tuned to make a visible contribution despite the component's inherently low variance.

## How It Works in the Recipe

In isolation, beta23 is subtle. But the dominance recipe uses 11 shape components additively, each pushing the face in a slightly different structural direction. Beta23's specific contribution is angular refinement of the chin and jaw contour — the kind of detail that makes the difference between a face that reads as "large" (from beta0 alone) and one that reads as "defined" (beta0 + beta2 + beta3 + beta23 together). The high recipe weight compensates for the component's low PCA variance.

## Interactions

- With **beta2** (chin projection): beta2 provides the primary forward thrust of the chin. Beta23 adds angular definition on top.
- With **beta3** (jaw width): beta3 widens the jaw broadly. Beta23 sharpens the contour of the jaw line.
- These stack constructively in the dominance recipe.

## Naturalist Notes

The fact that beta23 is used at weight 3.75 in the dominance recipe — among the highest weights — raises a question about whether the recipe could achieve the same effect with lower-numbered components alone. The answer is probably yes for gross effect, but the fine detail beta23 adds (angular chin contour) is not well-captured by any single lower component. High-numbered betas are useful precisely because they capture residual variation that the first few components miss.

**Confidence: medium** — the effect is subtle but real, and its role in the dominance recipe is documented.
