# w17-crisis Visual Expression Analysis: A/B Comparison Report (w16 vs w17)

## Overview
This report compares the 3D face renders of financial instruments from wave 16 (census-multiangle) and wave 17 (w17-crisis). The analysis focuses on visual expression clarity, fidelity to underlying data signals, and the persistence of the "universal gape" issue.

---

## Instrument Comparisons

### BRENT
- **Old read (w16)**: Expressions of mild, passive sadness or gloom with slightly downturned lips and a fixed, neutral gaze.
- **New read (w17)**: Shows more defined distress with subtle tension in the brow and a more pronounced downturn of the mouth corners, though visually very similar to w16.
- **Change grade**: Same
- **Data match**: **B** (Distress: 0.66, Vitality: 0.98). The face captures distress well, but the extremely high vitality (0.98) is not reflected in the eyes, which still look sleepy/fatigued.
- **Remaining issues**: High vitality signals are being overridden by fatigue/distress in the facial mapping, resulting in a lack of alertness.

### _VIX
- **Old read (w16)**: Shocked, slack-jawed expression with wide eyes and a gaping mouth, suggesting high-intensity alarm.
- **New read (w17)**: Similar "gaping" expression, but the mouth aperture is slightly reduced, looking more like "numbed shock" than cartoonish alarm.
- **Change grade**: Better
- **Data match**: **B-** (Alarm: 0.99, Vitality: -0.88). The extreme alarm is captured, but the extremely low vitality should ideally produce a more sunken/lethargic look rather than a wide-eyed shock.
- **Remaining issues**: The "gape" is still too dominant; needs more nuanced muscle tension in the cheeks and eyes to convey a "crisis" state realistically.

### _TNX
- **Old read (w16)**: A middle-aged, somber face with a heavy brow and a flat, weary expression, conveying stoicism.
- **New read (w17)**: Identical expression to w16, though shading around the mouth appears slightly refined.
- **Change grade**: Same
- **Data match**: **B+** (Maturity: 0.99, Distress: 0.43, Vitality: 0.73). Maturity is perfectly captured. However, the high vitality (0.73) is again suppressed by moderate fatigue/distress.
- **Remaining issues**: Vitality signals need to translate more effectively into eye-opening and posture to prevent "weary" from being the only possible state for mature faces.

### SPY
- **Old read (w16)**: Slight "gape" with eyes that look somewhat dazed or confused, reflecting mild, uncertain distress.
- **New read (w17)**: Virtually unchanged from w16.
- **Change grade**: Same
- **Data match**: **A-** (Alarm: 0.47, Distress: 0.49). Matches moderate alarm and distress well. Neutral vitality is correctly reflected in the lack of extreme tension.
- **Remaining issues**: The mouth being open for "moderate alarm" (0.47) feels like an over-reaction; a closed-mouth "tense" look would be more appropriate.

### GC_F
- **Old read (w16)**: Dazed, open-mouthed expression with a look of mild surprise or disorientation.
- **New read (w17)**: Identical to w16.
- **Change grade**: Same
- **Data match**: **B+** (Alarm: 0.53, Vitality: -0.47). Captures alarm and low vitality reasonably well.
- **Remaining issues**: The "gape" remains the default for any alarm signal above 0.3. It lacks the subtlety required for moderate market movements.

### DX_F
- **Old read (w16)**: A fairly neutral, young-looking face with a subtle hint of melancholy in the eyes.
- **New read (w17)**: Identical to w16.
- **Change grade**: Same
- **Data match**: **A** (Distress: 0.50, Vitality: 0.70, Alarm: 0.27). The low alarm is correctly reflected by the closed mouth, and the vitality/distress blend is well-balanced.
- **Remaining issues**: Distress could be more evident in the brow; currently, the expression is a bit too close to "contemplative."

### CF
- **Old read (w16)**: A young face with a pouting/grimacing expression, showing physical discomfort or annoyance.
- **New read (w17)**: Identical to w16.
- **Change grade**: Same
- **Data match**: **B** (Aggression: 0.77, Fatigue: 0.80, Vitality: 0.88). The "aggression" comes through as a sullen pout, but high vitality (0.88) is completely invisible behind the high fatigue.
- **Remaining issues**: Severe conflict between vitality and fatigue signals; the mapping logic needs a better way to blend high-energy aggression with high-physical fatigue.

### NG_F
- **Old read (w16)**: A young, somewhat vacant face with a slightly open mouth, suggesting mild surprise.
- **New read (w17)**: Identical to w16.
- **Change grade**: Same
- **Data match**: **A-** (Alarm: 0.30, Distress: 0.08). Captures low distress and moderate alarm reasonably well.
- **Remaining issues**: The mouth opening at alarm 0.3 makes the face look "slack" rather than "alarmed." The threshold for the gape needs to be raised.

---

## SUMMARY

- **Improvements**: 1 (_VIX)
- **Regressions**: 0
- **Unchanged**: 7
- **"Universal Gape" Status**: **Not Fixed.** While slightly attenuated in _VIX, the open-mouthed "shock" remains the primary and often only response to alarm signals > 0.3 across all tickers.
- **#1 Remaining Problem**: **Binary Expression Logic.** The system lacks a "tense but closed" state for moderate alarm/distress. It jumps from neutral/melancholic directly to slack-jawed shock.
- **Recipe Suggestion for Next Wave**:
  - Increase the `alarm` threshold for mouth opening from ~0.3 to ~0.6.
  - Introduce a `tension` mapper that uses `alarm` and `aggression` to tighten the `lip_press` and `eye_squint` parameters for values between 0.3 and 0.6.
  - Improve the blending of `vitality` and `fatigue`; high vitality should prevent the "vacant/droopy eye" look even if fatigue is present.
