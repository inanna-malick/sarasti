# Face Thumbnail Evaluation Report (48-64px)

## Overview
This report evaluates the visibility and distinguishability of facial expressions at thumbnail sizes (48-64px) for use in a dashboard grid. At this resolution, high-frequency details (individual wrinkles, eye texture) are lost, leaving only "Macro-Signals": mouth shape, head silhouette, and overall contrast.

## Expression Analysis

| Expression | Distinctness (1-5) | Key Surviving Feature | Thumbnail Distinguishability |
| :--- | :---: | :--- | :--- |
| **Neutral** | 1 | Baseline silhouette | Reference point. |
| **Alarmed** | 5 | Vertical oval mouth | **Excellent.** The large dark cavity is unmistakable. |
| **Euphoric** | 4 | Horizontal white bar (teeth) | **Good.** Wide mouth changes the lower face width. |
| **Wired** | 2 | Slight eye widening | **Poor.** Looks almost identical to Neutral at 48px. |
| **Exhausted** | 3 | Droopy mouth corners | **Fair.** The "sad" curve is visible if exaggerated. |
| **Aggressive** | 5 | Tense jaw + teeth bar | **Excellent.** Sharp contrast in the mouth area. |
| **Yielding** | 2 | Softened mouth line | **Poor.** Easily confused with Neutral or Exhausted. |
| **Smirk** | 3 | Asymmetrical mouth | **Fair.** The "lopsided" look is a great signal but needs more scale. |

## Combo & Character Analysis

- **combo_crisis_front.png**: High visibility (4/5). The combination of tense jaw and wide eyes creates a high-contrast "alert" state.
- **combo_calm_front.png**: Low visibility (2/5). Too similar to neutral; needs a more distinct "relaxed" signal like a slight head tilt.
- **full_sharp-chad-crisis_front.png**: Extreme visibility (5/5). The angular jaw silhouette combined with the crisis expression creates a unique "V" shape that survives even at 32px.
- **full_puffy-soyboi-calm_front.png**: High visibility (4/5). The rounded silhouette contrasts strongly with the "sharp" characters, making identity more visible than expression.

## Confusion Matrix (Thumbnail Size)

Potential for confusion between expressions at 48px:

| | Neutral | Alarmed | Euphoric | Wired | Exhausted | Aggressive | Yielding | Smirk |
|---|---|---|---|---|---|---|---|---|
| **Neutral** | - | | | **High** | Med | | **High** | Med |
| **Alarmed** | | - | | | | | | |
| **Euphoric**| | | - | | | Med | | **High** |
| **Wired** | **High** | | | - | | Med | | |
| **Exhausted**| Med | | | | - | | Med | |
| **Aggressive**| | | Med | Med | | - | | |
| **Yielding** | **High** | | | | Med | | - | |
| **Smirk** | Med | | **High** | | | | | - |

## Recommendations for Thumbnail Optimization

1. **Exaggerate Asymmetry**: For **Smirk**, the height difference between mouth corners should be increased by 50%.
2. **Leverage Head Tilt**: 
   - **Wired**: Tilt head slightly forward (aggressive/intense).
   - **Yielding**: Tilt head slightly back or to the side (submissive).
   - **Exhausted**: Tilt head slightly down.
3. **Mouth "Cavity" Contrast**: Ensure the interior of the mouth in **Alarmed** and **Aggressive** is significantly darker than the skin to create a "black hole" effect that survives downsampling.
4. **Eye-White Visibility**: For **Wired/Alarmed**, increasing the vertical scale of the eye whites (sclera) will help signal high arousal.

## Conclusion
The "Crisis" and "Aggressive" expressions are dashboard-ready. "Wired" and "Yielding" are currently too subtle for 48px and require secondary signals (like head tilt) to be distinct from "Neutral".
