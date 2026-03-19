2026-03-19T10:07Z

# Senior Art Director Report: CROSS-AXIS Interaction Evaluation (Wave 6)

## 1. Emotional Legibility of Cross-Axis Combos

*   **ALARM 2.0 x FATIGUE 2.0 (MANIC):** Reads perfectly as a hyper-charged, wide-eyed shock state.
*   **ALARM 2.0 x FATIGUE -2.0 (PANICKED):** Matches the label; the eyes remain wide while the lower face shows desperate strain.
*   **ALARM -2.0 x FATIGUE 2.0 (ELATED):** Reads as a maniacal, intense joy, bordering on the unsettling.
*   **ALARM -2.0 x FATIGUE -2.0 (CONTENT/BLISSFUL):** Matches well; the soft smile and half-closed eyes convey total serenity.
*   **ALARM 2.0 x AGGRESSION 2.0 (BERSERKER):** Reads as an insane, enraged scream with high physical intensity.
*   **ALARM 2.0 x AGGRESSION -2.0 (TERRIFIED):** Matches exactly; the wide-eyed, pulled-back mouth is the classic image of terror.
*   **ALARM -2.0 x AGGRESSION 2.0 (TRIUMPHANT):** Reads more as predatory or malicious glee due to the conflicting mouth/brow signals.
*   **ALARM -2.0 x AGGRESSION -2.0 (SERENE):** Matches; a very gentle and kindly expression.
*   **FATIGUE 2.0 x AGGRESSION 2.0 (HUNTING):** Matches; conveys a focused, predatory intent with narrowed eyes and tight mouth.
*   **FATIGUE 2.0 x AGGRESSION -2.0 (ANXIOUS):** Matches; reads as nervous, darting-eyed apprehension.
*   **FATIGUE -2.0 x AGGRESSION 2.0 (LAST STAND):** Matches; shows gritty determination and defiance through heavy-lidded exhaustion.
*   **FATIGUE -2.0 x AGGRESSION -2.0 (BROKEN):** Matches; total apathetic defeat with a slack, empty gaze.
*   **AGGRESSION 2.0 x DOMINANCE 2.0 (WARLORD):** Matches; the thick features combined with the scowl create an imposing threat.
*   **AGGRESSION 2.0 x DOMINANCE -2.0 (CORNERED RAT):** Matches; the narrow chin and wild eyes suggest a dangerous but feeble aggression.
*   **AGGRESSION -2.0 x DOMINANCE 2.0 (STOIC DEFEAT):** Reads more as paternal kindness or a graceful, strong patience.
*   **AGGRESSION -2.0 x DOMINANCE -2.0 (TOTAL SURRENDER):** Matches; the weak features and soft smile read as pitifully submissive.

## 2. Axis Independence

The **ALARM x FATIGUE** pair appears to be the most independent; combining these axes produces four very distinct emotional states (Manic, Panicked, Elated, Content) that feel like genuinely new categories of expression rather than just blends. Conversely, **AGGRESSION x ALARM (at the Euphoric pole)** tends to fight; the brow furrows (Aggression) and the wide grin (Euphoria) create a "mixed signal" that often reads as "insane" or "psychotic" because the upper and lower face are communicating contradictory social cues.

## 3. Component Stacking Artifacts

The most significant stacking artifact occurs at **DOMINANCE -2.0 (Soyboi)**. When combined with any high-magnitude expression at ±2.0, the neck becomes distractingly thin (a "pencil-neck" effect) and the lower face structure appears to collapse slightly, losing its anatomical grounding. Additionally, the **ALARM 2.0 x AGGRESSION 2.0** combo pushes the mouth opening to its limit, causing visible thinning of the lip mesh at the corners that feels slightly brittle.

## 4. Triple Combo Impressions

*   **alarmed-wired-aggressive:** A crazed predator caught in mid-lunge.
*   **alarmed-exhausted-aggressive:** A desperate survivor fighting through the last of their strength.
*   **euphoric-wired-aggressive:** A psychotic villain relishing a moment of total madness.
*   **alarmed-wired-yielding:** A startled animal frozen in a moment of pure shock.
*   **euphoric-exhausted-yielding:** A man finding profound, dream-like peace.
*   **alarmed-aggressive-chad:** A monstrous, physically overwhelming beast of pure rage.
*   **euphoric-yielding-soyboi:** A humble servant expressing meek and harmless adoration.

All seven remain recognizable as human, though the "chad" and "soyboi" extremes push the boundaries of caricature.

## 5. Top 3 Improvements

1.  **Lower Face/Neck Volume Compensation:** Implement a volume-preserving constraint for the neck when DOMINANCE is low, preventing the "pencil-neck" artifact during high-magnitude expressions.
2.  **Brow-Mouth Semantic Cohesion:** The brow furrow (Aggression) should slightly dampen the upward curve of the mouth corners when Euphoria is high to prevent the "Joker" effect and create a more coherent grimace.
3.  **Eyelid Tension for Fatigue:** When Fatigue is high (exhaustion), add volume-based "sag" to the lower eyelid rather than a linear blend to avoid a flat, unrealistic appearance around the orbital bone.
