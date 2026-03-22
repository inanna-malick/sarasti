# Trader Expression Audit: Market-to-Face Mapping (v2)
**Evaluator:** Senior Derivatives Trader (Pit/Floor/OTC Experience)
**Subject:** 5x5 Circumplex Grid & Diagnostic Pairs (Axes v2)

## 1. Market State Mapping

Glancing at the 5x5 grid, I see the trading floor. Not a textbook definition of emotions, but the raw reality of the P&L.

*   **grid_tn10_vn10 (The "Zombied" Desk):** This is the guy who has been underwater for three days and has stopped checking his terminal. He's lost so much that the adrenaline is gone. He's resigned. He's waiting for the risk manager to walk over and tap his shoulder.
*   **grid_tp10_vn10 (The Blow-Up):** This is a margin call in progress. Eyes wide, pupils probably dilated if I could see them. This is the moment a fat-finger trade happens or a black swan event hits. Total panic.
*   **grid_tp10_vp10 (The Manic Streak):** This is the pit during a massive rally. It's not just "winning"; it's winning in a way that feels dangerous. High volatility, high reward. This guy is high on his own supply.
*   **grid_tn10_vp10 (The Quiet Print):** This is the bond desk at 10 AM on a Tuesday. Everything is going according to the model. The carry is coming in. It's a "boring" win. The smile is smug but low-energy.
*   **grid_tp00_vp00 (The Flat Book):** Neutral. Just watching the tape. No skin in the game, or at least no delta.

## 2. The Money Axis (Valence)

Does it read as "money"? Mostly.
*   **Positive (vp):** The smiles are effective. They range from "content" (vp05) to "ecstatic/greedy" (vp10). On a trading floor, greed and winning are synonymous.
*   **Negative (vn):** This reads more as **frustration** and **aggression** than pure sadness. This is actually accurate for traders. We don't get "sad" when we lose; we get angry at the market, at the Fed, at the counterparty. The bared teeth in `vn10` captures that "market is trying to screw me" energy perfectly.

## 3. The Crisis Axis (Tension)

This is the most critical axis for a trader. Can I tell if the VIX is at 12 or 40 just by looking at the faces?
*   **Tension (tp):** The eyes are the giveaway. The wide-eyed stare in `tp10` across all valence levels is the hallmark of a high-arousal market. Even the winning faces (`tp10_vp10`) look "on edge."
*   **Calm (tn):** The eyelids are heavier. It looks like a low-volume, low-volatility environment.
*   **The Issue:** The distinction is subtle. If I'm looking at a wall of 25 faces, I want to see the "tension" more in the brow and the forehead. A volatile market creates a specific kind of headache that should be visible.

## 4. The Critical Failure Mode: Calm-Losing vs. Tense-Losing

I looked at the diagnostic pairs (v=-0.3, -0.6, -0.9). This is where the model needs to be bulletproof.

*   **v=-0.9 (The Deep Red):**
    *   `diag_calm_v-0.9`: He looks annoyed.
    *   `diag_tense_v-0.9`: He looks terrified.
*   **The Problem:** The "Calm-Losing" face still has too much "heat" in the mouth. When someone is losing badly but the market is calm (e.g., a slow bleed-out), they shouldn't look like they're snarling. They should look **hollow**. The mouth should be a flat, thin line of suppressed misery. The current `diag_calm_v-0.9` still looks like he's about to start an argument. 

In the pit, a guy who is "Calm-Losing" is more dangerous because you don't see the blow-up coming. He's "dead inside." The current renders don't quite hit that "numb" state.

## 5. What's Missing?

To truly read the "pit," we need a few more expressions that aren't just Tension/Valence:
1.  **Contempt/Skepticism:** One side of the mouth pulled up. This is the face you make when you think the price action is "fake" or the news is "priced in." It's an essential sentiment indicator.
2.  **Exhaustion:** The "3 AM Tokyo Open" face. Bags under the eyes, slightly open mouth, glassy stare. This is the state of most desks during a prolonged crisis.
3.  **The "Check-In":** A face that looks like it's asking a question. traders spend half their time looking at each other trying to figure out who knows what.

## 6. Recommendations (Brutal)

1.  **Kill the snarl on Calm-Losing:** For `tn10_vn10`, flatten the mouth. Stop the bared teeth. Give me "thousand-yard stare" instead of "angry dog."
2.  **Exaggerate the "Tense" Brow:** High tension should involve more than just wide eyes. I want to see the forehead muscles working. Volatility is a physical strain.
3.  **Differentiate the "Win":** A `tn10_vp10` win should look **smug**. A `tp10_vp10` win should look **relieved/manic**. Right now, they both just look like "guy smiling." The *context* of the win (calm vs. chaos) should change the *type* of smile.
4.  **The "Dead Neutral":** `tp00_vp00` is a bit too "pleasant." Give me the "professional blankness" of someone who is paid to have no opinion.

If I'm looking at these on a dashboard, I need to know *instantly* that the desk is in trouble before I even read the numbers. The eyes are doing 80% of the work right now; let's get the mouth and brow to do their fair share.
