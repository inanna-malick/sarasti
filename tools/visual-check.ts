/**
 * Visual verification tool.
 * Runs headless browser, takes screenshots at key timestamps,
 * generates filmstrips and comparison images.
 *
 * Usage: npx tsx tools/visual-check.ts [check-name]
 *
 * Check names:
 *   sweep-shape    — shape parameter sweep
 *   sweep-expr     — expression parameter sweep
 *   gallery-25     — all 25 faces at a single timestamp
 *   filmstrip      — 10 frames across timeline
 *   family-strip   — one family across all frames
 */

const checkName = process.argv[2] || 'gallery-25';
console.log(`Visual check: ${checkName} — not yet implemented`);
