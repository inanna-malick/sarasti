#!/usr/bin/env bash
# Smoke test for the refine pipeline harness.
# Usage: nix-shell --run "bash tools/refine/smoke-test.sh"

set -euo pipefail
cd "$(dirname "$0")/../.."

npx tsx tools/refine/harness.ts tools/refine/smoke-test-configs.json
