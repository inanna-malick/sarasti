# Uncanny Valley Audit — W20

## Per-Face Assessment

### Crisis Batch (tools/eval/data/renders/w20-crisis/)
- **_TNX_2026-03-11_front.png**: **FAIL**. Mouth is a flat line with zero volume. Visible mesh pinching at the corners. Eyes are glassy and disconnected from the expression.
- **_VIX_2026-03-11_front.png**: **FAIL**. Anatomical nightmare. Mouth is an "O" shape but the interior is a black void. Upper lids are raised but lower lids are slack, which never happens in a genuine surprise/fear response.
- **ALI_F_2026-03-11_front.png**: **FAIL**. Severe mouth corner pinching. Nostrils look collapsed. The "NPC stare" is strong here.
- **BRENT_2026-03-11_front.png**: **FAIL**. Neck-to-head transition is too sharp. Mouth lacks realistic lip borders (vermilion border is non-existent).
- **CF_2026-03-11_front.png**: **FAIL**. Repetition of the TNX failure. Mesh errors at the mouth corners. Eyes have no specular highlights, making them look like plastic beads.
- **DX_F_2026-03-11_front.png**: **FAIL**. Asymmetrical mouth looks like a deformation error rather than an expression. Shading on cheeks is blotchy/dirty.
- **GC_F_2026-03-11_front.png**: **FAIL**. Anatomically impossible jaw movement. The mouth is open but the mandible hasn't dropped, leading to weird skin stretching around the lips.
- **HO_F_2026-03-11_front.png**: **FAIL**. Repetition of GC_F. Stretched skin textures around the mouth are visible. Dead eyes.
- **NG_F_2026-03-11_front.png**: **FAIL**. Mesh intersection on the upper lip. Nasolabial folds are too sharp, looking like cuts rather than skin folds.
- **RB_F_2026-03-11_front.png**: **FAIL**. Eyebrow asymmetry feels like a parameter glitch. Forehead texture is unnaturally smooth compared to the rest of the face.
- **SPY_2026-03-11_front.png**: **FAIL**. Pure repetition. Mouth is a black void. Zero emotional connection between eyes and mouth.
- **WTI_2026-03-11_front.png**: **FAIL**. Mouth corners are receding into the head mesh. Philtrum definition is completely lost.
- **XLE_2026-03-11_front.png**: **FAIL**. Repetition of WTI. The eyes look sunken and "painted on."

### Calm Batch (tools/eval/data/renders/w20-calm/)
- **_TNX_2026-02-26_front.png**: **FAIL**. Slightly better mouth volume than crisis but still plastic-looking. Eyes remain completely lifeless.
- **_VIX_2026-02-26_front.png**: **FAIL**. Why is a "calm" face making a wide-mouthed scream expression? This is either a labeling error or a system failure.
- **ALI_F_2026-02-26_front.png**: **FAIL**. Mismatch between mouth (slight smile) and eyes (dead/vacant).
- **BRENT_2026-02-26_front.png**: **FAIL**. Mushy features. Lack of definition in the philtrum and lip borders. Shading is too uniform.
- **CF_2026-02-26_front.png**: **FAIL**. Blotchy shading on the neck. Repetitive expression.
- **DX_F_2026-02-26_front.png**: **FAIL**. Eyes are slightly misaligned (strabismus), likely a coordinate error in the eye tracking system.
- **GC_F_2026-02-26_front.png**: **FAIL**. Same jaw-drop failure as the crisis batch. Stretched mesh around the mouth.
- **HO_F_2026-02-26_front.png**: **FAIL**. Repetitive. Looking up while tilted down with no eyelid tension is anatomically wrong.
- **NG_F_2026-02-26_front.png**: **FAIL**. Expression is a frown, mismatching the "calm" label. Rough skin-age texture makes it look like a burn victim.
- **RB_F_2026-02-26_front.png**: **FAIL**. Repetition of NG_F. Mouth is a thin line with zero volume.
- **SPY_2026-02-26_front.png**: **FAIL**. Identical to crisis. System is failing to differentiate between states.
- **WTI_2026-02-26_front.png**: **FAIL**. Mouth opening is a black slit. Blurry textures on the nose.
- **XLE_2026-02-26_front.png**: **FAIL**. Sunken "dead eyes." Repetitive and low-quality mesh definition.

## Critical Failures
- **The "Mandible Glitch" (GC_F, HO_F)**: The mouth opens but the jaw doesn't move. This is a Tier 1 failure for any digital human. It breaks the illusion instantly.
- **Labeling/State Parity (_VIX, NG_F, SPY)**: Several "Calm" faces are making "Crisis" expressions (screaming, frowning). This suggests the underlying signal mapping is broken or the system is stuck in high-tension states.
- **The Black Void Mouth (_VIX, SPY, GC_F)**: No teeth, no tongue, no interior shading. It looks like a hole in a mask.

## Recurring Issues
1. **Dead Eyes**: No specular highlights, no eyelid-to-eye-movement correlation (look up/eyelid up), and zero tension in the lower lids.
2. **Lip Volume**: All faces suffer from "flat lips." The mesh does not reflect the complex anatomy of the orbicularis oris muscle.
3. **Repetition**: The "NPC Army" problem is rampant. CF, TNX, and ALI_F are basically clones. WTI and XLE are also interchangeable.
4. **Mesh Pinching**: Severe artifacts at the oral commissures (mouth corners).

## What Works
- **Skin Texture Base**: The fundamental skin diffuse maps (when not stretched or blotchy) have decent pore detail, especially on the forehead of the "older" variations (NG_F).
- **Lighting**: The three-point lighting setup is professional and helps reveal the flaws, which is good for an audit.

## Priority Fixes
1. **Fix the Eye Model**: Add specular highlights, moisture on the lower lid (meniscus), and proper eyelid tracking.
2. **Correct Jaw Kinematics**: Link the `jaw_open` parameter to a proper downward and slightly forward translation of the mandible mesh.
3. **Internal Mouth Geometry**: Add basic teeth/tongue placeholders or at least a realistic shadow gradient so the mouth isn't a black hole.
