# Beta0 — Global Cranial Mass

**Axis:** small/gracile head (-) ... large/heavy head (+)

## What It Does

Beta0 is the king of shape components — the first principal component, capturing more variance than any other single axis. It controls the overall volumetric mass and breadth of the entire head.

## Positive Pole (+1.5 to +3.0): The Heavy Skull

Pushing beta0 positive inflates the head like a balloon that happens to be shaped like a skull. Everything gets bigger, but not uniformly: the jaw broadens significantly, the cranium expands laterally and vertically, the cheeks fill out and become more prominent, and the neck thickens. The brow ridge deepens slightly. The overall impression at +1.5 is "a man with a large head"; at +3.0 it becomes "an implausibly thick-skulled brute." The face reads as physically imposing, dominant, and mature.

Visible from the 3/4 views: the cranium is genuinely wider, not just the soft tissue. The ears sit further apart. The jawline extends further from the neck. This is bone-level mass, not just fat.

## Negative Pole (-1.5 to -3.0): The Gracile Head

Pulling negative deflates everything. The jaw narrows, the cranium contracts, the cheeks flatten, and the neck thins. At -1.5 the face reads as slightly built or youthful. At -3.0 it is a strikingly small, fine-boned head — almost childlike proportions on an adult face template. The eyes appear proportionally larger because the surrounding skull has shrunk.

## Symmetry

Near-perfect bilateral symmetry (0.98). The left and right 3/4 views at +2.0 are essentially mirror images. This is expected for a global scale axis derived from PCA on a population.

## Safety

Extremely robust. No mesh artifacts visible anywhere in the -3.0 to +3.0 range. This component extrapolates cleanly because it moves vertices along well-distributed directions without creating folds or inversions. Could likely be pushed to +/-5.0 before any geometry issues arise.

## Current Usage

Used in the **dominance** shape axis with weight 2.5. Positive dominance (chad) adds mass; negative (soyboi) removes it. This is appropriate — beta0 is the most reliable "make the face bigger and more imposing" lever available.

## Interactions

- With **beta1** (vertical stretch): beta0 gives mass, beta1 gives height. Combined positive yields a tall, heavy head. Combined negative yields a tiny, narrow head.
- With **beta2** (face width/nose): beta0+beta2 can stack to create extremely wide faces. The dominance recipe uses both (beta2 at 2.5) — the interaction produces a convincingly broad-featured individual.

## Naturalist Notes

In the FLAME training data, this axis likely correlates with a combination of sex (males tend toward positive), body mass, and skeletal frame size. The coupling between jaw width and cranial expansion suggests it captures a real anthropometric axis rather than an arbitrary PCA direction.
