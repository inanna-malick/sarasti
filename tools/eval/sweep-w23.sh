#!/usr/bin/env bash
# w23 recipe sweep — render frames 03+04 for each variant
set -euo pipefail

CHORDS="src/binding/chords.ts"
RESOLVE="src/binding/resolve.ts"
OUTDIR="tools/eval/data/renders/sweep-w23"
BACKUP_CHORDS=$(mktemp)
BACKUP_RESOLVE=$(mktemp)

cp "$CHORDS" "$BACKUP_CHORDS"
cp "$RESOLVE" "$BACKUP_RESOLVE"

restore() {
  cp "$BACKUP_CHORDS" "$CHORDS"
  cp "$BACKUP_RESOLVE" "$RESOLVE"
}
trap restore EXIT

render_variant() {
  local name="$1"
  echo "=== Rendering variant: $name ==="

  # Create config for just frames 03+04
  cat > /tmp/sweep-config.json << 'HEREDOC'
[
  {"params":{"hormuz":"true","t":"2026-03-04T04:00:00Z"},"output":"OUTDIR/VARIANT_03_crisis_peak.png"},
  {"params":{"hormuz":"true","t":"2026-03-10T15:00:00Z"},"output":"OUTDIR/VARIANT_04_max_drawdown.png"}
]
HEREDOC
  sed -i "s|OUTDIR|$OUTDIR|g; s|VARIANT|$name|g" /tmp/sweep-config.json

  npx tsx tools/eval/render.ts /tmp/sweep-config.json 2>&1 | grep -E '\.png$|Error' || true
  echo "=== Done: $name ==="
}

# --- VARIANT A: current (baseline after today's changes) ---
# Already rendered as storyboard-w23, but render here too for A/B comparison
render_variant "A-baseline"

# --- VARIANT B: deeper pallor on valence bad ---
restore
sed -i "s/texture: { flush: -0.25 }/texture: { flush: -0.45 }/" "$CHORDS"
render_variant "B-deeper-pallor"

# --- VARIANT C: earlier tension onset (power 0.3 on eyes) ---
restore
sed -i "s/texture: { flush: -0.25 }/texture: { flush: -0.45 }/" "$CHORDS"
sed -i 's/\[9, 3.5, 0.5\]/[9, 3.5, 0.3]/' "$CHORDS"
sed -i 's/\[21, 3.5, 0.5\]/[21, 3.5, 0.3]/' "$CHORDS"
render_variant "C-early-tension-pallor"

# --- VARIANT D: wider stature (shape weights ×1.5) ---
restore
sed -i "s/texture: { flush: -0.25 }/texture: { flush: -0.45 }/" "$CHORDS"
sed -i 's/\[9, 3.5, 0.5\]/[9, 3.5, 0.3]/' "$CHORDS"
sed -i 's/\[21, 3.5, 0.5\]/[21, 3.5, 0.3]/' "$CHORDS"
# Boost stature weights ×1.5
sed -i 's/\[3, 2.0\]/[3, 3.0]/' "$CHORDS"
sed -i 's/\[2, 1.5\],   \/\/ β2: chin/[2, 2.25],   \/\/ β2: chin/' "$CHORDS"
sed -i 's/\[0, 1.0\],   \/\/ β0: neck/[0, 1.5],   \/\/ β0: neck/' "$CHORDS"
sed -i 's/\[28, -2.0\]/[28, -3.0]/' "$CHORDS"
sed -i 's/\[27, -1.5\]/[27, -2.25]/' "$CHORDS"
sed -i 's/\[10, -1.5\]/[10, -2.25]/' "$CHORDS"
sed -i 's/\[22, 1.5\]/[22, 2.25]/' "$CHORDS"
render_variant "D-wide-stature"

# --- VARIANT E: aggressive jaw + heavy frown on valence bad ---
restore
sed -i "s/texture: { flush: -0.25 }/texture: { flush: -0.45 }/" "$CHORDS"
sed -i 's/\[9, 3.5, 0.5\]/[9, 3.5, 0.3]/' "$CHORDS"
sed -i 's/\[21, 3.5, 0.5\]/[21, 3.5, 0.3]/' "$CHORDS"
# Heavier jaw sag + deeper frown
sed -i 's/\[7, -2.5\]/[7, -3.5]/' "$CHORDS"
sed -i 's/\[2, 1.5, 1.5\]/[2, 2.5, 1.0]/' "$CHORDS"
sed -i 's/\[0, 0.5, 2.0\]/[0, 1.0, 1.5]/' "$CHORDS"
sed -i 's/\[26, -1.5\]/[26, -2.5]/' "$CHORDS"
render_variant "E-heavy-jaw-frown"

echo "=== All variants rendered ==="
ls -la "$OUTDIR"/*.png
