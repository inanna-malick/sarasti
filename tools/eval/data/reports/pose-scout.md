# Pose Scout: Evaluating Expression-Pose Synergy in 3D Financial Avatars

## 1. Introduction: The Expressive Power of Pose

In the development of the Sarasti 3D face expression system, the primary focus has often been on the geometry of the face itself—the subtle shifts in the brow, the tightening of the lips, and the expansion of the nostrils. However, character animation theory teaches us that the "silhouette" and "line of action" of a character are often more communicative at a distance than the internal details of the face. In our system, this "line of action" is primarily driven by the **Pose Channels**: Pitch, Yaw, Roll, Jaw, and Gaze.

This report evaluates a suite of 16 renders designed to probe the limits of our current pose budget and explore the synergy between skeletal rotation and blendshape-driven expression. The core hypothesis is that pose is not merely a "container" for an expression, but an active participant in the emotional signal—sometimes even the dominant one.

## 2. Channel-by-Channel Analysis

### 2.1 Pitch: The Axis of Power and Intent
**Emotional Information: 5/5**

Pitch is arguably the most powerful pose channel in our arsenal. It fundamentally alters the viewer's perspective of the character's status and intent.

**Technical Note on Inversion:** During the evaluation of the `explore` render suite, we observed that the file names `pose_pitch_up.png` and `pose_pitch_down.png` appear to be inverted relative to the visual result. `pose_pitch_up.png` consistently shows the head tilted **down** (chin down), while `pose_pitch_down.png` shows the head tilted **up** (chin up). This suggests that the current implementation in the `ExplorerPane` or the underlying `FlameFaceMesh` uses a coordinate system where positive pitch rotation results in a downward head tilt. For the remainder of this report, we will refer to the **visual result** (e.g., "Chin Down") to avoid confusion.

*   **Chin Down (Visual result of `pose_pitch_up.png`):** This creates what is known in cinema as the "Kubrick Stare." By tilting the chin down while keeping the gaze fixed on the viewer, the character's brow naturally shadows the eyes, and the whites of the eyes become visible below the iris. This suggests intense focus, predatory intent, or suppressed aggression. In a financial context, this translates to "Predatory Alpha"—a character who is hunting for an entry point or is intensely focused on a market anomaly.
*   **Chin Up (Visual result of `pose_pitch_down.png`):** Tilting the chin up and looking down at the viewer suggests superiority, arrogance, or dismissal. It creates a physical distance and a "high-status" silhouette. This is the "Superiority" pose, suggesting a character who is unbothered by market volatility because they believe they are above it.
*   **Combination with Geometry:** Pitch synergizes perfectly with brow geometry. A furrowed brow (ψ) combined with chin-down pitch (Kubrick stare) creates a much more threatening "Crisis" state than the brow alone. Conversely, a raised brow with chin-up pitch creates a look of "haughty surprise" or "disbelief."
*   **Readability:** Extremely high. The silhouette change of a head tilt is readable down to 64px. Even at low resolutions, the change in the visible area of the forehead vs. the chin provides a clear signal of the head's orientation.

### 2.2 Yaw: The Axis of Attention
**Emotional Information: 2/5 (Independent), 4/5 (Combined)**

Yaw (turning the head) is primarily a signal of attention rather than emotion, but it becomes emotionally charged when it interacts with the viewer's "camera."

*   **Left/Right Extremes:** Turning the head away from the camera suggests that the character is focused on something else—perhaps the "market" represented by the rest of the UI. This can signal evasiveness, distraction, or a shift in focus.
*   **Combination with Geometry:** Yaw is essential for the "Side-Eye." By turning the head away but keeping the gaze (GazeH) fixed on the viewer, the character signals suspicion or "watching you while pretending not to." This is a high-signal state for "Market Skepticism."
*   **Readability:** High. The asymmetry of a turned head is very clear at 120px.

### 2.3 Roll: The Axis of Personality and Affection
**Emotional Information: 3/5**

Roll (tilting the head to the shoulder) is often overlooked in robotic or lower-quality avatars, but it is the "secret sauce" of human-like warmth.

*   **Left/Right Extremes:** A head roll suggests curiosity, playfulness, or empathy. It breaks the rigid, "mugshot" symmetry of the front-facing view. It can also signal confusion (the "dog head tilt").
*   **Combination with Geometry:** Roll turns a generic "Smile" into a "Warm Smile" and a generic "Confusion" into "Puzzlement." It adds a layer of "personality" that makes the character feel like a reactive agent rather than a static chart.
*   **Readability:** Medium. At very low resolutions (64px), a slight roll can look like a rendering artifact or a tilted UI element. It requires at least 240px to be truly appreciated as a deliberate emotional choice.

### 2.4 Jaw: The Axis of Arousal
**Emotional Information: 5/5**

While technically a pose channel (rotation of the jaw bone), the jaw is functionally part of the expression system.

*   **Open/Wide:** The jaw is the primary indicator of high-arousal states. You cannot have a "Scream," a "Gasp," or an "Exultant Laugh" without significant jaw opening.
*   **Readability:** Very high. The dark cavity of the mouth creates a high-contrast shape that is visible even at 64px.

### 2.5 Gaze: The Intent Signal
**Emotional Information: 4/5**

Gaze is the most subtle but most "humanizing" channel. It tells the viewer *what* the character is thinking about.

*   **Horizontal (GazeH):** Direct gaze = Engagement. Averted gaze = Shame, distraction, or looking at data.
*   **Vertical (GazeV):** Looking up = Thinking, dreaming, searching. Looking down = Shame, dejection, or reading.
*   **Readability:** Low. In our current 512px renders, pupils are clearly visible. However, at a 120px avatar size, gaze direction becomes difficult to discern unless it is extreme (±0.40).

---

## 3. Case Studies: The Pose Combos

We evaluated four "Combo" poses that combine multiple pose channels with expression geometry.

### 3.1 `pose_combo_alert` (The "What was that?" look)
*   **Read:** Confrontational Alarm.
*   **Interaction:** The combination of Chin-Up (Pitch Down) and a slight Yaw/Roll makes the character look like they've just noticed a sudden, sharp move in the ticker and are "challenging" the data.
*   **Comparison:** Without the pose, an "Alert" expression (wide eyes, raised brows) looks like a deer in headlights—passive. With the pose, the character looks active and reactive.

### 3.2 `pose_combo_defeated` (The "Margin Call" look)
*   **Read:** Heavy Dejection / Shame.
*   **Interaction:** Chin-Down (Pitch Up) combined with a slight slump and closed eyes. The pose is doing 70% of the work here. The "line of action" of the head hanging down is the universal signifier of defeat.
*   **Comparison:** A "sad" face on a straight-up neck looks like someone *pretending* to be sad for a photo. A "sad" face with a hung head looks like someone who is actually suffering.

### 3.3 `pose_combo_scream` (The "Black Swan" look)
*   **Read:** Visceral Shock.
*   **Interaction:** Chin-Up + Jaw Wide. This is the classic "reeling back" reaction. The pitch-down (chin up) suggests the character is physically pushed back by the news.
*   **Comparison:** Much more "dynamic" than a front-facing scream. It feels like a moment captured in time rather than a static emoji.

### 3.4 `pose_combo_serene` (The "Take Profit" look)
*   **Read:** Peaceful Satisfaction.
*   **Interaction:** Chin-Down + Roll + Smile. The Roll is the key here. It adds a "gentle" quality to the smile that makes it feel earned and calm.
*   **Comparison:** Without the roll, a symmetric smile can look "creepy" or "Stepford-ish." The pose breaks the symmetry and adds human warmth.

---

## 4. Technical Considerations: Readability and Scale

The effectiveness of a pose channel is heavily dependent on the scale at which the avatar is rendered. In the Hormuz explorer, avatars are typically displayed in a 120px to 240px range. 

*   **At 64px (Thumbnail/Dense Grid):** Only Pitch and Jaw are truly reliable. The dark cavity of an open mouth or the shift in the head's silhouette are high-contrast signals that survive heavy downsampling. Yaw is moderately readable as a shift in the face's center of mass, but Roll and Gaze are effectively lost. This is a critical threshold; if the character's status depends on a subtle head tilt, it will be invisible at this scale.
*   **At 120px (Standard Explorer View):** Yaw becomes a primary signal. The asymmetry of the face allows the viewer to see one ear while the other is hidden, which is a very strong depth cue. Roll is starting to become visible, but only at its extremes (±0.15). Gaze direction is still difficult to pin down unless the character is "side-eyeing" with extreme horizontal gaze. We must ensure that the "base" expression is readable here, and the pose is used to "amplify" the signal.
*   **At 240px (Detail Panel/Focus):** All channels are fully active. Gaze direction becomes a "humanizing" detail that makes the character feel like they are looking *at* something. Roll adds a layer of "charm" or "personality" that is essential for user engagement. This is where the character's "performance" truly shines.

**Recommendation for Low-Res Rendering:** If we ever implement a "mini-map" or very dense view, we should consider a "Pose LOD" (Level of Detail) system that exaggerates Pitch and Jaw while zeroing out Roll and Gaze to prevent the face from looking "mushy" or "broken" due to aliasing.

## 5. The Key Question: Should we be bolder?

**Current Practice:** Pitch ±0.10-0.20, Gaze ±0.20-0.40.
**Budget Limits:** Pitch ±0.537, Yaw ±0.256, Roll ±0.15.

**The Verdict: YES. We are absolutely leaving expressive range on the table.**

Our current "safe" ranges (±0.10 pitch) are barely noticeable to the casual observer. They maintain the "mugshot" look that we should be trying to escape. The evaluation of the `explore` suite proves that the full range of the budget is not only safe (no mesh tearing or extreme artifacts were observed in the tested range) but essential for high-signal communication.

### Why we should expand:
1.  **Silhouette is King:** At 120px (our target avatar size in the Hormuz explorer), internal face details like ψ22 (brow furrow) are hard to see. A Pitch-Up (Chin Down) pose of 0.40 rad is unmistakable.
2.  **Breaking Symmetry:** Symmetry is the enemy of "life." By utilizing the full range of Roll (±0.15) and Yaw (±0.25), we can create a much more organic, "thinking" feel for the avatars.
3.  **High-Status vs. Low-Status:** The distinction between a "Superior" (Chin Up) and "Defeated" (Chin Down) character is a core part of the financial narrative. We cannot achieve this with geometry alone.

### Proposed New "Standard" Ranges:
*   **Pitch:** Expand from ±0.20 to **±0.45**. This allows for the full "Kubrick" and "Superior" poses.
*   **Yaw:** Expand to **±0.25** (the full budget).
*   **Roll:** Expand to **±0.15** (the full budget).
*   **Gaze:** Maintain **±0.40** for Horizontal, but consider exaggerating Vertical gaze or linking it to Pitch.

## 6. Technical Implementation Details

As we move to these bolder ranges, we must ensure the following:
1.  **Gaze-Pitch Linking:** In humans, eyes usually move first, followed by the head. If we move the head down (Pitch Up), the eyes should naturally move slightly UP (GazeV) to maintain eye contact with the viewer. This "counter-rotation" is essential for the Kubrick stare.
2.  **Avatar Clipping:** At Pitch ±0.50, the top of the head or the chin might get close to the edges of the 512px viewport. We may need to slightly adjust the camera "z" or "y" offset based on pitch to keep the face centered.
3.  **Neck-Shoulder Transition:** While the FLAME model handles neck rotation well, we should monitor for "candy-wrapper" twisting at the base of the neck when combining max Yaw and max Roll.

## 7. Conclusion

The "Pose Scout" evaluation confirms that the skeletal pose of the avatar is as important as the facial geometry. By using our pose budget sparingly, we have been muting the emotional resonance of the Sarasti system. Moving forward, we should embrace the "Bold Pose" strategy, utilizing the full ±0.537 pitch range to create avatars that don't just "show" an expression, but "live" it through their entire posture.

---
*Report compiled by Sarasti Character Animation Unit*
*Date: 2026-03-20*
