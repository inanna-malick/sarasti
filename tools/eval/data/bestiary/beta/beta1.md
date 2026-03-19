# Beta1 — Vertical Face Elongation

**Axis:** round/compressed face (-) ... tall/elongated face (+)

## What It Does

Beta1 is the second principal component and captures the face's vertical aspect ratio — the relationship between height and width. Where beta0 is about mass, beta1 is about proportions.

## Positive Pole (+1.5 to +3.0): The Long Face

Pushing positive stretches the face vertically. The forehead grows taller, the midface elongates, the distance from brow to chin increases, and the chin drops and narrows into a more pointed shape. The jaw, while lengthening, also narrows slightly — the overall silhouette transitions from an oval to a taller, more rectangular shape. At +1.5 it reads as "a person with a long face." At +3.0 it becomes noticeably elongated — still within human range but at the extreme end.

In the 3/4 views at +2.0, the profile confirms genuine skeletal elongation: the cranium is taller, the mandible extends further downward, and the overall head reads as vertically stretched from crown to chin. The neck area also appears slightly longer.

## Negative Pole (-1.5 to -3.0): The Round Face

Pulling negative compresses the face vertically and broadens it. The forehead shortens, cheeks widen and become more prominent, the chin recedes and rounds off. At -1.5 the face looks compact and round. At -3.0 it approaches a distinctly moon-faced quality — very wide relative to its height, with a stubby chin and reduced forehead.

The roundness is genuine structural compression, not just soft tissue: the skull itself becomes shorter and wider in profile.

## Symmetry

Very high symmetry (0.97). This is a vertical axis by nature, so left-right parity is expected and confirmed by the 3/4 views.

## Safety

Clean and robust through the full -3.0 to +3.0 range. No artifacts, no mesh folding. Like beta0, this component moves vertices in well-distributed directions that resist geometric breakdown.

## Current Usage

Referenced in the stature axis in CLAUDE.md documentation, contributing to the heavy/gaunt distinction. Positive elongation can read as gaunt; negative compression as heavy/stocky. The dominance recipe does not directly use beta1, keeping mass (beta0) and proportions (beta1) as somewhat independent controls.

## Interactions

- With **beta0**: orthogonal pairing. beta0 at +2 with beta1 at +2 = a tall, heavy skull (large AND elongated). beta0 at +2 with beta1 at -2 = a wide, round, massive head. They combine cleanly.
- With **beta3**: both can affect jaw shape. Beta1's jaw narrowing (positive) pairs with beta3's jaw changes to offer fine-grained mandible control.

## Naturalist Notes

In anthropometry, the cephalic index measures the ratio of head breadth to length — beta1 is essentially the FLAME model's continuous version of this classical measurement. Populations with dolichocephalic (long-headed) tendencies would cluster at positive beta1; brachycephalic (broad-headed) at negative. The correlation with perceived maturity (longer faces reading as older) is a known effect in face perception research.
