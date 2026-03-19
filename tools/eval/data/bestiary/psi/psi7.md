## psi7 -- Happiness / Disappointment (The Emotional Core)

At +3.0, the face radiates quiet, genuine contentment. The cheeks lift, the eyes soften and develop the subtle crinkling at the outer corners that marks a Duchenne (authentic) smile. The mouth settles into a pleased, satisfied shape -- not a broad grin but a deep, warm happiness. The brow smooths, the forehead relaxes, and the entire face seems to glow with wellbeing. At +1.5, this is a gentle, private satisfaction -- the face of someone who has received good news and is absorbing it quietly.

At -3.0, the face is a portrait of weary disappointment. Everything droops. The cheeks sag, the eyes lose their brightness and take on a heavy, lidded quality, the mouth turns down at the corners with a profound sadness. The forehead may furrow slightly with the effort of sustaining consciousness through dejection. The overall read is someone who has been repeatedly let down and is running out of reserves. At -1.5, this is the beginning of that decline -- hope starting to drain, the first signs of emotional depletion.

The transition through zero is smooth and emotionally coherent. The neutral face sits in a genuinely neutral emotional state, and psi7 moves it cleanly toward either contentment or dejection. This is not a geometric trick -- the emotional read tracks the parameter value faithfully.

Despite the FLAME label "eyelid close," psi7 does far more than modulate eyelids. It is a whole-face emotional state component. The periorbital region is most affected (the eye-crinkling of happiness, the heavy-lidded droop of disappointment), but the cheeks, mouth, brows, and overall facial tone all participate. This is one of those PCA components where the label picked up one salient feature ("the eyelids moved") and missed the forest for the trees.

The positive pole reads as: a grandparent watching grandchildren play. The moment after hearing "you got the job." Deep, unhurried satisfaction.
The negative pole reads as: a trader watching their portfolio bleed on a Friday afternoon. The fourth quarter of a lost game. Running on empty.

**Symmetry:** 0.96 -- Strong bilateral symmetry. Both happiness and disappointment are naturally symmetric, and the renders confirm consistent bilateral expression.

**Artifacts:** The primary artifact concern is eyelid-eyeball clipping at extreme negative values (heavy lids drooping through the eyeball mesh). This is documented in the codebase with a dedicated PSI7_CLAMP = 4.0 constant that enforces runtime clamping. Within the tested range of +/-3.0, geometry is clean. The clipping begins around +/-4.0 and becomes problematic by +/-5.0.

**Safe range:** [-4.0, 4.0] (enforced by PSI7_CLAMP in constants.ts)

**Currently used in:**
- alarm_euphoric recipe at weight 1.9 (happy eyes -- genuine joy)
- fatigue_exhausted recipe at weight -2.0 (disappointed -- PRIMARY exhaustion driver)
- NOTE: This is one of the most heavily-weighted components in the entire expression system, appearing in two recipes at high magnitude.

**Potential uses:** Psi7 is already heavily utilized and is the emotional center of gravity for both the euphoric and exhausted states. Its contentment pole could additionally serve a "content/placid" quadrant state. Its disappointment pole could contribute to grief or depression states. The main constraint is the eyelid clipping at extremes, which limits how far the exhaustion can be pushed. Given its whole-face nature and emotional potency, this component should probably remain at the weights it currently has rather than being pushed further.
