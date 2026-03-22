# Facial Expression System: 2-Axis Design Proposal

## 1. Current State Assessment

The current system employs a classic circumplex model: **Tension** (Upper Face) and **Valence** (Lower Face).

*   **Tension (Upper Face)**: Primarily utilizes ψ9 (eyes wide), ψ21 (alert), and ψ4 (brow raise/lower). 
*   **Valence (Lower Face)**: Primarily utilizes ψ0 (smile), ψ7 (mouth corners), and ψ2 (jaw drop).

**Information Bandwidth:**
*   **Valence** has high bandwidth. The mouth is the most mobile and high-contrast feature on the face. In a 25-face grid, the difference between a smile and a frown is distinguishable even at low resolutions.
*   **Tension** has significantly lower bandwidth. Eye and brow movements are smaller in terms of total vertex displacement. At a distance, "tense" eyes can be easily confused with "alert" or "focused" eyes unless the activation is extreme.

**Independence:**
While the ψ components are mathematically orthogonal (zero overlap), they are not perceptually independent. The facial "gestalt" is dominated by the mouth. Because the current Tension axis is confined to the upper face, it lacks the physical scale to compete with the Valence signal from the lower face.

---

## 2. The Dominance Problem

The "Mouth Wins" problem is the primary failure mode of the current design. When a trader glances at the 25-face wall:
1.  They see **Valence** immediately (Happy/Sad).
2.  They must "zoom in" mentally to see **Tension** (Calm/Tense).

In market terms, this means the **direction** of the market (Up/Down) is clear, but the **velocity/risk** (Urgency) is obscured. For a trader, missing a "Tense + Bad" (Panic) signal because they only saw the "Bad" (Frown) is potentially fatal. The current upper/lower split is "leaky" because the lower face can express both sentiment and intensity (via jaw drop), but we are currently only using it for sentiment.

---

## 3. Alternative Axis Decompositions

We should move away from the anatomical split (Upper/Lower) and toward a **Functional Split**:

### Option A: Activation (Global) vs. Sentiment (Modulation)
*   **Activation (The "How Much"):** A global "volume" knob. High activation widens everything: eyes, mouth (jaw drop), and nostrils. Low activation narrows/relaxes everything.
*   **Sentiment (The "Which Way"):** A modulation of the active state. A smile or a frown applied *onto* the current activation level.
*   **Benefit:** Intensity is visible in every part of the face simultaneously.

### Option B: Threat Response (Psychological) vs. Outcome (Economic)
*   **Threat Response (Fight/Flight):** Focuses on aggression vs. fear. Uses chin projection (ψ26), snarls (ψ5), and neck pitch.
*   **Outcome (Profit/Loss):** Focuses on satisfaction vs. distress. Uses smile/frown and skin flush.

---

## 4. Channel Inventory

Beyond the basic ψ geometry, we have several "free" or underutilized channels:

1.  **Pose (Neck Pitch/Roll)**: 
    *   *Pitch forward*: Aggression, focus, urgency.
    *   *Pitch back*: Surprise, avoidance, relief.
    *   *Roll (Tilt)*: Confusion, distress, empathy.
2.  **Jaw**: Currently bound to Valence, but better suited for Activation/Urgency.
3.  **Gaze (Vertical)**: 
    *   *Gaze up*: Submission, hope, "looking for an exit."
    *   *Gaze down*: Predatory focus, shame, "looking at the floor."
4.  **Texture (Flush/Pallor)**: 
    *   *Flush*: Warm/Red. High arousal or success.
    *   *Pallor/Fatigue*: Cold/Blue/Sallow. Stress, exhaustion, or failure.
5.  **Pupil Dilation**: (If available) A subtle but powerful cue for arousal.

---

## 5. The Proposal: "Urgency" and "Sentiment"

I propose a system that splits the face by **Functional Role** rather than region.

### Axis 1: Urgency (Calm ↔ High Alert)
*   **Market Mapping**: Volatility, Velocity, and Drawdown.
*   **Face Regions**: Eyes (Wide/Narrow), Brow (Raised/Relaxed), **Jaw (Dropped/Closed)**, Neck (Pitch Forward/Back).
*   **Secondary Channels**: Gaze focus (fixed vs. wandering), Texture (Fatigue).
*   **Extremes**:
    *   *Calm*: Droopy "sleepy" eyes, relaxed jaw, head slightly back. The "Nothing to see here" look.
    *   *High Alert*: "The Deer in Headlights." Maximum eye aperture, raised brows, jaw dropped in a gasp, head pitched forward.

### Axis 2: Sentiment (Toxic ↔ Euphoric)
*   **Market Mapping**: Deviation from mean, Momentum.
*   **Face Regions**: Mouth (Smile/Frown), Cheeks (Lifted/Hollow), **Neck (Roll/Tilt)**.
*   **Secondary Channels**: Texture (Flush/Pallor), Gaze (Vertical up/down).
*   **Extremes**:
    *   *Toxic*: Deep frown, pale skin, head tilted in distress/disgust, looking downward.
    *   *Euphoric*: Broad Duchenne smile (crinkled eyes), warm flush, head upright and proud, looking upward.

### Composition at the Corners
1.  **MANIC (Urgent + Euphoric)**: A celebratory shout. Jaw dropped wide, but the mouth corners are pulled high into a smile. Eyes wide. Leaning forward. "The Short Squeeze."
2.  **PANICKED (Urgent + Toxic)**: A horror scream. Jaw dropped wide, but mouth corners are pulled down/wide. Head tilted in distress. Eyes wide. "The Flash Crash."
3.  **CONTENT (Calm + Euphoric)**: A serene smile. Mouth closed or slightly parted in a gentle smile. Soft eyes. Relaxed posture. "The Bull Market."
4.  **DEPRESSED (Calm + Toxic)**: The slow bleed. Slight frown, droopy eyes, pale/fatigued skin, looking down. "The Long Tail Risk."

### Channel Ownership Matrix

| Channel | Urgency Axis | Sentiment Axis |
| :--- | :--- | :--- |
| **Eyes (ψ9, ψ21)** | **Primary** (Aperture) | - |
| **Brows (ψ4, ψ24)** | **Primary** (Position) | - |
| **Mouth (ψ0, ψ7)** | - | **Primary** (Shape/Sentiment) |
| **Jaw (ψ2, Pose.jaw)** | **Primary** (Open/Closed) | - |
| **Neck Pitch** | **Primary** (Startle/Relax) | Secondary (Pride/Shame) |
| **Neck Roll** | - | **Primary** (Distress/Tilt) |
| **Gaze Vertical** | Secondary (Alertness) | **Primary** (Optimism/Pessimism) |
| **Skin Flush** | - | **Primary** (Success/Failure) |
| **Skin Fatigue** | **Primary** (Exhaustion) | - |

---

## 6. Risk Assessment

1.  **The "Screamer" Risk**: Combining high Urgency (jaw drop) with high Sentiment (smile or frown) can easily cross into the Uncanny Valley or look like a cartoon. We must use `softClip` and `power` curves to ensure the jaw only drops significantly at extreme market states.
2.  **Neck Pitch Interference**: Pitching the head forward for Urgency might obscure the mouth in a tight grid. We must calibrate the maximum pitch to ensure the mouth remains visible for Sentiment.
3.  **Texture Readability**: Flush/Pallor is highly dependent on lighting. If the "wall" has dramatic shadows, the texture signal might be lost. We should consider using a "glow" or "rim light" that ties to these texture states.
