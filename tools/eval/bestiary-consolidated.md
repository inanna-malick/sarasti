# FLAME Bestiary — Consolidated Reference

## Sources
- ψ0-ψ12 visual reads: MEMORY.md (from explorer testing)
- ψ13-ψ29 census: `tools/eval/data/renders/census/psi-midfreq-census.md`
- β0-β29 census: `tools/eval/data/renders/census/beta-shape-census.md`
- Wave 1-5 critique reports: `tools/eval/data/renders/wave*/crit-*.md`

## Expression Components (ψ) — Currently Used

### In Alarm Recipes
| ψ | Weight (alarmed) | Weight (euphoric) | Visual Read |
|---|---|---|---|
| 0 | +0.5 | +0.9 | mouth aperture: pursed↔warm grin |
| 2 | +1.0 | — | confrontational mouth opening |
| 5 | +1.0 | — | frown/jaw tightening |
| 6 | -1.2 | — | surprise (neg) → brows up + eyes widen |
| 7 | — | +2.5 | happy eyes, Duchenne crinkling |
| 8 | +2.5 | +0.5 | PRIMARY startle / nose crinkle |
| 9 | — | +2.5 | smile — cheek lift |
| 11 | — | +2.5 | left mouth corner (bilateral smile pair) |
| 12 | — | +2.5 | right mouth corner (bilateral smile pair) |

### In Fatigue Recipes
| ψ | Weight (wired) | Weight (exhausted) | Visual Read |
|---|---|---|---|
| 0 | +0.4 | +0.6 | mouth: breathing(wired) / slack(exhausted) |
| 3 | -1.0 | -0.6 | disgust/brow pinch (cognitive load) |
| 4 | +2.5 | -1.5 | engagement↔boredom (lip parting, jaw) |
| 5 | +1.8 | -0.8 | frown/tight↔uninterested/slack |
| 7 | — | -2.8 | PRIMARY exhaustion (heavy eyelid droop) |
| 8 | +0.6 | — | alert edge |
| 9 | -0.6 | — | frown (cheek anchoring) |

### In Aggression Recipes
| ψ | Weight (aggressive) | Weight (yielding) | Visual Read |
|---|---|---|---|
| 0 | — | -0.5 | pursed/flinching |
| 2 | +1.2 | — | bared-teeth confrontation |
| 3 | -1.8 | — | snarl, nostril flare, nasolabial depth |
| 4 | — | -0.6 | disengagement |
| 5 | +1.2 | — | jaw clench, lip tension |
| 6 | +2.5 | -1.0 | PRIMARY: angry stare / vulnerable soft brows |
| 9 | -1.0 | -0.4 | frown / slight frown |

### Channel Overlap Concerns
- ψ3: used in fatigue(-1.0) AND aggression(-1.8) — stacks to -2.8 when wired+aggressive
- ψ5: used in alarm(+1.0), fatigue(+1.8), AND aggression(+1.2) — stacks to 4.0 at triple max
- ψ0: used in all 3 axes — different signs prevent worst-case stacking
- ψ8: alarm(+2.5) + fatigue(+0.6) + euphoric(+0.5) — max stack ~3.1, safe
- ψ9: euphoric(+2.5) vs wired(-0.6) vs aggressive(-1.0) — partial cancellation

### Unused ψ0-ψ12
- ψ1: BANNED (antisymmetric) — but could be relaxed for contempt?
- ψ10: mid-face tension modulator (in bestiary-axes PR, not yet merged)

### High-Value Mid-Frequency Components (ψ13-ψ29)
From census — rated 4-5/5 usefulness:

| ψ | Rating | Neg pole | Pos pole | Best use |
|---|---|---|---|---|
| 16 | 5/5 | raised brows, wide eyes, curious | lowered brows, squinted, intense | AGGRESSION: add focus/intensity to rage |
| 20 | 5/5 | lip pulled up, sneering, pain | stoic, suppressed | AGGRESSION: visceral snarl/disgust |
| 15 | 4/5 | wide jaw, tough, determined | narrow, delicate, anxious | YIELDING: vulnerability vs toughness |
| 19 | 4/5 | sunken cheeks, emaciated, sick | full cheeks, healthy, calm | FATIGUE: physical toll of crisis |
| 24 | 4/5 | brows down at outer corners, concerned | brows up outer, confident/arrogant | ALARM: concern vs confidence brow tilt |
| 26 | 4/5 | retracted chin, uncertain, afraid | prominent chin, decisive, resolve | AGGRESSION: resolve vs uncertainty |

### Integration Plan
- Aggressive recipe: add ψ16(+1.5) focus + ψ20(-1.0) snarl + ψ26(+0.8) resolve
- Yielding recipe: add ψ15(+0.8) vulnerability + ψ26(-0.6) uncertainty
- Exhausted recipe: add ψ19(-0.6) physical depletion
- Wired recipe: add ψ16(+0.8) focus intensity
- Euphoric recipe: add ψ24(+0.5) confident brow tilt
- Alarmed recipe: add ψ24(-0.6) concerned brow tilt

## Shape Components (β) — Currently Used

### Dominance Axis
β0(+2.5), β2(+2.5), β3(+3.75), β4(+1.9), β7(+1.25), β13(+3.1), β16(+1.9), β18(+3.75), β19(-1.9), β23(+3.75), β48(+3.1)

### Proposed New Shape Axes (from β census)

**1. Asset Maturity (young↔weathered)**
- β1, β4, β15, β17, β24
- Young = round, smooth, naive. Old = elongated, bony, weathered.
- Maps to instrument maturity/tenor.
- Zero overlap with dominance ✓

**2. Market Sentiment (bullish↔bearish)**
- β5, β12, β26, β27
- Bullish = upturned canthal tilt, open brow. Bearish = downturned, melancholic.
- Maps to prevailing trend.
- β5 overlaps with stature proposal — pick one.

**3. Institutional Rigidity (aristocratic↔speculative)**
- β2, β6, β13, β21
- Sharp/refined = sovereign debt. Thick/rough = crypto/junk.
- β2 and β13 overlap with dominance — CONFLICT. Needs different components.

**4. Liquidity Risk (liquid↔distressed)**
- β0, β4, β8, β19
- Healthy/full = liquid. Gaunt/hollow = illiquid.
- β0 and β19 overlap with dominance — CONFLICT.

### Overlap Analysis for Proposed Axes
- Maturity (β1,β4,β15,β17,β24): β4 overlaps dominance. Drop β4, use β24+β17+β1+β15.
- Sentiment (β5,β12,β26,β27): CLEAN — no dominance overlap ✓
- Rigidity: HEAVY dominance overlap. Needs redesign.
- Liquidity: HEAVY dominance overlap. Needs redesign.

**Best candidates with zero dominance overlap:**
1. **Maturity**: β1, β15, β17, β24 — young↔old
2. **Sentiment**: β5, β12, β26, β27 — bullish↔bearish structural mood
