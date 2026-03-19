# Beta15 — Cranial Depth / Forehead Projection

**Axis:** flat, shallow cranium (-) ... deep, projected cranium (+)

## What It Does

Beta15 adjusts the anterior-posterior depth of the upper skull. It controls how much the forehead projects forward and how deep the cranial vault is from front to back, along with subtle temporal region fullness.

## Positive Pole (+1.5 to +3.0): The Deep Cranium

Pushing positive deepens the cranial vault in the front-to-back dimension. The forehead projects slightly further forward, the temples fill out subtly, and the brow shelf becomes marginally more prominent. The effect is most visible in the 3/4 views. At +3.0 the skull has a subtly deeper profile.

## Negative Pole (-1.5 to -3.0): The Shallow Cranium

Pulling negative flattens the cranial vault. The forehead recedes, the temples become marginally more concave, and the upper skull profile becomes shallower. At -3.0 the forehead is noticeably flatter in profile.

## Symmetry

Good bilateral symmetry (0.95). Both 3/4 views confirm consistent bilateral behavior.

## Safety

No artifacts at any tested value. Clean geometry throughout. The visual change is most apparent in the 3/4 views; frontal views show minimal change.

## Current Usage

Not used in any current recipe. The CLAUDE.md spec lists beta15 as part of the stature shape axis, but the current codebase implements only the dominance axis for shape.

## Interactions

- With **beta11** (forehead contour): beta11 adjusts the roundness of the forehead; beta15 adjusts its depth. These are complementary upper-face controls.
- With **beta1** (vertical stretch): beta1 stretches vertically including forehead height; beta15 adds depth in the orthogonal anterior-posterior direction.

## Naturalist Notes

Beta15 primarily matters in profile and 3/4 views. From the front, its contribution is nearly invisible. If a stature axis were to be implemented as described in the CLAUDE.md spec, beta15 could contribute to the vertical/gaunt pole via cranial depth variation. For now, it is a dormant component — documented in the spec but not wired into the binding.
