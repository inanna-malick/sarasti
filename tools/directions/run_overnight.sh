#!/usr/bin/env bash
# Overnight hybrid pipeline: extends Semantify 10-dim to 100-dim
# Run from repo root: bash tools/directions/run_overnight.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# NixOS: need libstdc++ and zlib for torch/numpy in venv
ZLIB_PATH=$(nix-build '<nixpkgs>' -A zlib --no-out-link 2>/dev/null)/lib
export LD_LIBRARY_PATH=/nix/store/xm08aqdd7pxcdhm0ak6aqb1v7hw5q6ri-gcc-14.3.0-lib/lib:$ZLIB_PATH:${LD_LIBRARY_PATH:-}
source .venv/bin/activate

DATA_DIR="$REPO_ROOT/tools/directions/data"
HYBRID_RENDERS="$DATA_DIR/hybrid_renders"
HYBRID_PARAMS="$DATA_DIR/hybrid_params.npz"
HYBRID_SCORES="$DATA_DIR/hybrid_scores.npz"

echo "=== Stage 0: Semantify distillation (if not already done) ==="
if [ ! -f "$REPO_ROOT/assets/directions/age.json" ] || [ "$(python3 -c "import json; d=json.load(open('$REPO_ROOT/assets/directions/age.json')); print(sum(1 for v in d['points'][0]['params'] if abs(v)>1e-6))")" -lt 5 ]; then
    echo "Running Semantify distillation..."
    python3 tools/directions/distill_semantify.py
else
    echo "Semantify tables already exist with non-trivial values. Skipping."
fi

echo ""
echo "=== Stage 1: Render hybrid corpus (10K samples) ==="
if [ -d "$HYBRID_RENDERS" ] && [ "$(ls "$HYBRID_RENDERS"/*.png 2>/dev/null | wc -l)" -ge 25000 ]; then
    echo "Hybrid renders already exist ($(ls "$HYBRID_RENDERS"/*.png | wc -l) files). Skipping."
else
    python3 tools/directions/render_corpus.py --mode hybrid --seed 42 --n-variants 125
fi

echo ""
echo "=== Stage 2: Score hybrid corpus with CLIP ==="
if [ -f "$HYBRID_SCORES" ]; then
    echo "Hybrid scores already exist. Skipping."
else
    python3 tools/directions/score_corpus.py \
        --renders-dir "$HYBRID_RENDERS" \
        --scores-file "$HYBRID_SCORES"
fi

echo ""
echo "=== Stage 3: Train hybrid mappers (dims 10-99) ==="
python3 tools/directions/train_mappers.py --mode hybrid --epochs 500

echo ""
echo "=== Stage 4: Sample hybrid tables (merge Semantify + learned) ==="
python3 tools/directions/sample_tables.py --mode hybrid

echo ""
echo "=== Done! ==="
echo "Hybrid tables written to: $DATA_DIR/hybrid_tables/"
echo "Compare with Semantify tables in: $REPO_ROOT/assets/directions/"
