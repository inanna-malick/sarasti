# FLAME Axis Training — Iterative Critique Loop

## Method
1. **Tweak** recipes in `src/binding/chords.ts` based on prior round's critique
2. **Render** sweep configs via `npx tsx tools/eval/render.ts <config.json>`
3. **Spawn Gemini vision critics** — each sees N images + written context, writes report
4. **Synthesize** across critics, translate face-language → ψ/β component changes
5. **Repeat**

## Prompting Principles
- Critics speak FACE language ("the jaw needs to clench") not params ("increase ψ4")
- We translate. The bestiary (`tools/eval/data/census-configs.json` outputs) maps ψ/β → visual effect.
- Holistic > per-image. Give critics the full axis sweep + cross-axis combos.
- Ask "what would make this MORE X" not "rate this 1-10"
- Gestalt critic sees ALL images — tests dashboard-level readability

## Axis Architecture (current)
### Expression (2 axes, orthogonal)
- **Alarm** (alarmed ↔ euphoric): acute stress response ← vol×|vel| − deviation
- **Fatigue** (wired ↔ exhausted): sustained energy ← -(drawdown + exchFatigue) + mean_reversion

### Shape (1+ axes)
- **Dominance** (soyboi ↔ chad): bone structure ← momentum
- **Stature** (heavy ↔ gaunt): proportional mass ← |1-beta| × sign(deviation) [in bestiary-axes PR]

### Potential New Axes (from wave 2 gestalt critique)
- **Aggression**: narrowed eyes, furrowed brow, clamped jaw. Not just reactive alarm but ACTIVE attacking. Could be a 3rd expression axis or a modification to alarmed-wired quadrant.
- **Relief**: closed/soft eyes + peaceful smile. The "crisis passed" signal. Could be alarm→euphoric transition or distinct state.

## ψ Component Channel Ownership
Avoiding axis crosstalk — each ψ should be "owned" by at most one expression axis:
- **Alarm channel**: ψ0 (mouth), ψ2 (mouth intensity), ψ6 (surprise/anger), ψ8 (startle), ψ9 (smile), ψ11+ψ12 (bilateral smile)
- **Fatigue channel**: ψ3 (tension/curiosity), ψ4 (engagement/boredom), ψ5 (frown/slack), ψ7 (happy/disappointed eyes)
- **Shared concern**: critics want "brow knit" on alarmed (ψ3) but ψ3 is fatigue-owned. May need to relax strict ownership or find alarm-channel brow components.

## β Component Channel Ownership
- **Dominance**: β0,β2,β3,β4,β7,β13,β16,β18,β19,β23,β48
- **Stature**: β1,β5,β6,β8,β15
- **Identity noise**: β33-β41
- Zero overlap between axes ✓

## Wave History

### Wave 1 (baseline)
- Renders: `tools/eval/data/renders/sweep/`
- Crits: `tools/eval/data/sweep-wave1-{alarm,fatigue,dominance}-crit.md`
- Finding: per-image checklist format — low signal. Fatigue too subtle. Alarm mouth = dark hole.

### Wave 2 (post wave-1 tweaks)
- Tweaks applied: ψ1 removed from euphoric, ψ0+0.5 added to alarmed, ψ8→2.2/ψ6→-1.2 on alarmed, ψ4→2.0 on wired, ψ0→-0.3 on exhausted, ψ0→0.9 on euphoric
- Renders: `tools/eval/data/renders/wave2-20260319-023228/`
- Crits: `tools/eval/data/renders/wave2-20260319-023228/crit-{alarm,fatigue,gestalt}.md`
- Prompting: holistic face-language, "what would make this more X", gestalt dashboard test
- Key findings:
  - Fatigue STILL too subtle. Wired plateaus 0.7→1.0. Exhausted = "sleepy" not "broken"
  - Alarm over-relies on mouth aperture, needs brow/eye work
  - Euphoric = polite smile, needs Duchenne markers (cheek lift → lower eyelid push)
  - Alarmed = surprised not shocked, needs brow knit + sclera + gasp tension
  - Quadrants: euphoric+wired (manic) best corner, alarmed+exhausted (capitulation) worst
  - System gaps: missing aggression + relief states
  - Alarmed soyboi → uncanny "death's head"

### Wave 3
- Tweaks: ψ8→2.5/ψ5+1.0 on alarmed, ψ7→2.5/ψ8+0.5 on euphoric (Duchenne), ψ3 FLIPPED +1.5→-1.0 on wired (curiosity→tension), ψ4→2.5/ψ5→1.8/ψ0+0.4 on wired, ψ7→-2.8/ψ0 FLIPPED -0.3→+0.6 on exhausted
- Renders: `tools/eval/data/renders/wave3-20260319-023943/`
- Crits: `crit-compare.md`, `crit-fatigue-deep.md`, `crit-gestalt.md`
- Key findings:
  - FATIGUE AXIS FIXED: "invisible fatigue of previous rounds has been decisively killed"
  - Exhausted slack jaw = hero change. Wired brow pinch = massive upgrade.
  - Quadrants now compose into 4 distinct psychological states
  - 7 distinct emotional reads across the system (up from ~5)
  - Visual dynamic range 6/10 — "valley of subtlety" at 0.0-0.4 is THE biggest remaining problem
  - Missing emotion: AGGRESSION (rage, combative, bared teeth, narrowed hunting eyes)
  - Hollow Victory (euphoric+exhausted) still weakest quadrant
  - Rendering-level gaps: black mouth void, no micro-expression textures, no pupil response

### Wave 4 (in progress)
- Two major interventions:
  1. **Activation curve** (power=0.6): front-loads expression so 0.2→0.38, 0.4→0.57 magnitude. Fixes valley of subtlety.
  2. **Aggression axis** (3rd expression axis): ψ6+(angry stare), ψ2(confrontational mouth), ψ3-(snarl), ψ9-(frown). Signal: -momentum × velocity_sign.
- Also: ψ9×-0.6 added to wired (anchors cheeks, fixes fish-mouth)
