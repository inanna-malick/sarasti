# FLAME Shape Census: β0-β29 Analysis & Proposed Dashboard Axes

This document evaluates the first 30 shape components of the FLAME model to determine their visual legibility and emotional utility for a financial crisis dashboard.

## Component Summaries (β0-β29)

| Component | Structural Change | Character Type |
| :--- | :--- | :--- |
| **β0** | Horizontal scaling of the face and neck. | **Gaunt/Refined (-)** vs. **Robust/Heavy (+)** |
| **β1** | Vertical scaling of the face and head length. | **Stately/Serious (-)** vs. **Youthful/Round (+)** |
| **β2** | Jaw and temple width; squareness of the face. | **Intellectual/Refined (-)** vs. **Brutish/Strongman (+)** |
| **β3** | Neck length and thickness relative to head. | **Graceful/Vulnerable (+)** vs. **Stubborn/Aggressive (-)** |
| **β4** | Cheek volume and malar fullness. | **Ascetic/Worn (-)** vs. **Prosperous/Soft (+)** |
| **β5** | Brow height and orbital openness. | **Menacing/Focused (-)** vs. **Open/Surprised (+)** |
| **β6** | Overall nose size and bulbousness. | **Refined/Aristocratic (-)** vs. **Common/Rustic (+)** |
| **β7** | Chin protrusion and jawline definition. | **Determined/Heroic (-)** vs. **Submissive/Ineffectual (+)** |
| **β8** | Interocular distance (eye spacing). | **Trustworthy/Naïve (-)** vs. **Shifty/Calculating (+)** |
| **β9** | Mouth width and lip fullness. | **Stern/Disciplined (-)** vs. **Sensual/Indulgent (+)** |
| **β10** | Cranial vs. Mandibular dominance (V-shape vs. Pear-shape). | **Idealist/Thinker (-)** vs. **Pragmatist/Laborer (+)** |
| **β11** | Nasal tip rotation (snub vs. hooked). | **Cheeky/Inquisitive (-)** vs. **Severe/Predatory (+)** |
| **β12** | Canthal tilt (eye corner height). | **Melancholic/Tired (-)** vs. **Alert/Exotic (+)** |
| **β13** | Specific neck width (bull-neck effect). | **Powerful/Stubborn (-)** vs. **Elegant/Fragile (+)** |
| **β14** | Mandibular projection (underbite vs. overbite). | **Defiant/Aggressive (-)** vs. **Timid/Weak (+)** |
| **β15** | Midface projection (sunken vs. prominent). | **Weathered/Haggard (-)** vs. **Vital/Prominent (+)** |
| **β16** | Lower face width (mandibular angles). | **Determined/Stubborn (-)** vs. **Delicate/Sensitive (+)** |
| **β17** | Nose length and vertical midface scale. | **Stubby/Youthful (-)** vs. **Long-nosed/Mature (+)** |
| **β18** | Temporal vs. Mandibular balance. | **Pragmatic/Grounded (-)** vs. **Thinking/Wide-browed (+)** |
| **β19** | Supraorbital ridge (brow bone) prominence. | **Intense/Suspicious (-)** vs. **Naive/Open (+)** |
| **β20** | Mouth vertical position (philtrum length). | **Alert/Tense (-)** vs. **Relaxed/Long-faced (+)** |
| **β21** | Alar width (nostril flare). | **Sharp/Discerning (-)** vs. **Sensual/Robust (+)** |
| **β22** | Chin shape (rounded vs. squared/split). | **Soft/Approachable (-)** vs. **Hard/Gritty (+)** |
| **β23** | Zygomatic (cheekbone) width. | **Exotic/Striking (-)** vs. **Conventional/Plain (+)** |
| **β24** | Philtrum length (aged appearance). | **Youthful/Innocent (-)** vs. **Aged/Sullen (+)** |
| **β25** | Forehead height. | **High-brow/Intellectual (-)** vs. **Low-brow/Primitive (+)** |
| **β26** | Mouth corner height (smile vs. frown). | **Optimistic/Amiable (-)** vs. **Cynical/Discontented (+)** |
| **β27** | Ocular projection vs. Brow ridge depth. | **Skeptical/Focused (-)** vs. **Astonished/Naïve (+)** |
| **β28** | Jaw definition (angularity). | **Strict/Relentless (-)** vs. **Lenient/Soft (+)** |
| **β29** | Midface vertical offset. | **Short-faced/Alert (-)** vs. **Long-faced/Melancholy (+)** |

---

## PROPOSED SHAPE AXES

### 1. ASSET MATURITY (The "Aging" Axis)
*   **Quality:** Communicates the "life stage" of a financial instrument. A "young" face looks smooth, round, and naive, representing newly issued or short-term assets. An "old" face looks weathered, elongated, and bony, representing legacy instruments or long-term debt.
*   **Components:** 
    *   **(+) Mature:** β1(-1.5), β4(-2.0), β15(-1.5), β17(+2.0), β24(+2.0)
    *   **(-) Juvenile:** β1(+1.5), β4(+2.0), β15(+1.5), β17(-2.0), β24(-2.0)
*   **Trader Utility:** Allows immediate visual sorting of a portfolio by maturity. Long-dated bonds look like "grandfathers," while overnight repos look like "infants."
*   **Vs. Dominance:** Dominance conveys power; Age conveys duration. A "Mature" face can be either dominant (a powerful legacy bank) or weak (a dying industry).

### 2. MARKET SENTIMENT (The "Disposition" Axis)
*   **Quality:** Encodes the prevailing "mood" or trend of an asset class. It moves from "Bullish" (upturned, open features) to "Bearish" (downturned, heavy, melancholic features).
*   **Components:**
    *   **(+) Bullish:** β5(+1.5), β12(+2.0), β26(-2.0), β27(+1.5)
    *   **(-) Bearish:** β5(-1.5), β12(-2.0), β26(+2.0), β27(-1.5)
*   **Trader Utility:** Provides an emotional "vibe check" of the market. A dashboard full of "frowning, tired" faces immediately signals a broad contraction without reading a single number.
*   **Vs. Dominance:** Sentiment is about *outlook*, not strength. A weak asset (low dominance) can still be "optimistic" if it's recovering.

### 3. INSTITUTIONAL RIGIDITY (The "Refinement" Axis)
*   **Quality:** Communicates the "pedigree" or regulatory status of an asset. "Aristocratic" features (sharp, thin, symmetrical) represent sovereign debt and highly regulated "Tier 1" assets. "Brutish" features (wide, thick, asymmetrical) represent speculative, shadow-banking, or "wild west" assets like crypto or high-yield junk.
*   **Components:**
    *   **(+) Aristocratic:** β2(-2.0), β6(-2.0), β13(+2.0), β21(-1.5)
    *   **(-) Speculative:** β2(+2.0), β6(+2.0), β13(-2.0), β21(+1.5)
*   **Trader Utility:** Helps traders distinguish between "Safe Havens" and "Alpha-seeking" risks. A portfolio that looks like a "royal court" is safe/boring; one that looks like a "fight club" is high-risk/high-reward.
*   **Vs. Dominance:** Refinement is about *precision and rules*, whereas dominance is about *raw mass*.

### 4. LIQUIDITY RISK (The "Vitality" Axis)
*   **Quality:** Encodes the health and "breathability" of an asset. A "Robust" face (wide-set eyes, full features, strong neck) looks healthy and liquid. A "Gaunt" face (sunken cheeks, close-set eyes, thin neck) looks like it's starving for capital—a liquidity crunch.
*   **Components:**
    *   **(+) Liquid:** β0(+2.0), β8(-1.5), β4(+1.5), β19(+1.5)
    *   **(-) Distressed:** β0(-2.0), β8(+1.5), β4(-1.5), β19(-1.5)
*   **Trader Utility:** Critical during a crisis. If an asset's face starts looking "gaunt and hollow," it indicates it's becoming hard to trade or exit.
*   **Vs. Dominance:** A dominant asset can still suffer a liquidity crunch (a "starving giant"), which this axis would uniquely capture.
