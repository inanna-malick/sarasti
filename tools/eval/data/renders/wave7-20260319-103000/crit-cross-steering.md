# Art Director Review: Cross-Axis & Triple Interaction (Wave 7)
**Timestamp:** 2026-03-19T10:30Z
**Focus:** Interaction, Dominance, and Glancability

## A. Doppelgänger Hunt: The "Confusability" Audit
The biggest risk to the dashboard is "Semantic Blur"—where two different market states produce the same facial signature.

1.  **The "Distress" Blur:** `cross_alrm_1.5_ftg_-1.5` (Alarmed+Exhausted) vs. `cross_ftg_-1.5_aggr_-1.5` (Exhausted+Yielding).
    - **Shared Visuals:** Both feature heavy eyelid droop and high brow distress. 
    - **The Conflict:** The Alarmed brow pinch (ψ3) and the Yielding worried brow (ψ24) are too similar when the eyes are half-closed. 
    - **Steering:** Boost the "chin retraction" (ψ26) in Alarm to differentiate it from the "slack jaw" of pure Exhaustion.

2.  **The "Intensity" Blur:** `cross_alrm_1.5_ftg_1.5` (Alarmed+Wired) vs. `cross_ftg_1.5_aggr_1.5` (Wired+Aggressive).
    - **Shared Visuals:** High-tension brow, lowered lids, and "locked" gaze.
    - **The Conflict:** At 1.5, the "Scanning" intent of Wired masks the "Fear" intent of Alarm. 
    - **Steering:** Aggression needs the snarl (ψ20) to be louder. If there's no teeth, it's just "Wired."

3.  **The "Unstable Joy" Blur:** `cross_alrm_-1.5_aggr_-1.5` (Euphoric+Yielding) vs. `triple_euphoric-exhausted-yielding`.
    - **Shared Visuals:** Wide mouth, "worried" upper face.
    - **The Conflict:** Both look like a character losing their grip on reality (the "Hide the Pain Harold" effect).
    - **Steering:** Euphoria needs more "cheek lift" (ψ19) to overpower the worried brow unless the market actually *is* in a delirious state.

---

## B. Dominance Hierarchy
Ranking of combos by visual "signal-to-noise" ratio.

**Top 5 (High Signal - "Instantly Readable"):**
1.  `cross_alrm_1.5_aggr_1.5` (Alarmed + Aggressive) — "The Cornered Beast." The brow pinch + snarl is unmistakable.
2.  `cross_dom_1.5_mat_-1.5` (Dominant + Young) — "The Prodigy." Striking contrast between bone structure and skin tone.
3.  `cross_alrm_-1.5_mat_1.5` (Euphoric + Old) — "The Patriarch." Wrinkles + Joyous expansion = High Authority.
4.  `cross_aggr_1.5_dom_1.5` (Aggressive + Dominant) — "The Tyrant." Wide jaw provides the perfect stage for the snarl.
5.  `triple_alarmed-aggressive-old` — "The Prophet of Doom." Maximum readable distress.

**Bottom 5 (Low Signal - "Bland/Generic"):**
1.  `cross_ftg_1.5_aggr_-1.5` (Wired + Yielding) — "The Overwhelmed Intern." Just looks slightly busy.
2.  `cross_aggr_-1.5_dom_-1.5` (Yielding + Submissive) — Double-negative on power. The face just "recedes."
3.  `cross_dom_-1.5_mat_1.5` (Submissive + Old) — "The Feeble." Hard to distinguish from simple aging.
4.  `cross_alrm_1.5_mat_-1.5` (Alarmed + Young) — Smooth skin masks the brow pinch.
5.  `cross_ftg_1.5_aggr_1.5` (Wired + Aggressive) — Without a high snarl value, this just looks like "Intense Focus."

---

## C. Axis Dominance: Who Wins the Face?
When two axes collide, one usually dictates the "read."

*   **Alarm × Fatigue:** **ALARM WINS.** The brow pinch is a structural "event" that renders lid state secondary.
*   **Alarm × Aggression:** **AGGRESSION WINS.** The mouth (snarl/teeth) is a higher-frequency signal than the brow.
*   **Fatigue × Aggression:** **AGGRESSION WINS.** Rage is more "active" than tiredness.
*   **Aggression × Dominance:** **DOMINANCE WINS.** The jaw shape sets the "class" of the character, which modifies the "type" of aggression.
*   **Dominance × Maturity:** **MATURITY WINS.** Texture/Wrinkles provide more context than jaw width.
*   **Alarm × Maturity:** **MATURITY WINS.** An old face "carries" the alarm expression more effectively.

---

## D. Shape + Expression Interaction
*   **Bone Structure vs. Expression:** Changing the "Identity" (Maturity/Dominance) fundamentally changes the "Emotional" read.
*   **The "Old Alarm" Effect:** An old face (`mat_1.5`) looks **MORE alarmed** than a young face. The existing forehead wrinkles act as "trackers" for the brow pinch, amplifying the visual depth.
*   **The "Dominant Rage" Effect:** A dominant face (`dom_1.5`) looks **MORE aggressive**. The wider jaw (ψ15) prevents the snarl from looking "pinched," giving it a more predatory, "wide-track" appearance.

---

## E. Dashboard Scenario: The "Glance-ability" Test
Imagine 25 of these on a wall.

1.  **Can we see Crisis?** Yes. The ALARM (brow) and AGGRESSION (mouth) signals are loud enough.
2.  **Can we see *Kind* of Crisis?** **Difficult.** The overlap between "Alarmed-Wired" and "Aggressive-Wired" is a major hurdle. A trader might see "High Intensity" but miss whether it's Fear-driven (Liquidity crisis) or Rage-driven (Competitive attack).
3.  **Biggest Obstacle:** **Brow Overlap.** We are asking the brow to do too much: Alarmed (pinch), Wired (lower/narrow), Yielding (worry), and Exhausted (droop).

**Art Direction Steering for Wave 8:**
- Move **ALARM** further into the **Lower Face** (more chin retraction/neck tension).
- Move **FATIGUE** further into **Color/Texture** (darker eye circles) to free up the brow for emotional signaling.
- Keep **DOMINANCE** and **MATURITY** as they are; they are providing excellent "Identity" anchoring.
