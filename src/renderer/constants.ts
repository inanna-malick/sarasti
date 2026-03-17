// ─── FLAME mesh constants ───────────────────────────
// These are populated after extract_flame.py runs.
// Hardcoded from FLAME 2023 Open model specs.
export const FLAME_N_VERTICES = 5023;
export const FLAME_N_FACES = 9976;

// ─── Matcap material ────────────────────────────────
// Neutral base color — tinted warm/cool by crisis intensity
export const MATCAP_BASE_COLOR = 0xc8b8a8;  // warm neutral skin tone
export const MATCAP_WARM_TINT = 0xff4444;    // crisis → warm red
export const MATCAP_COOL_TINT = 0x4488cc;    // calm → cool blue

// ─── Scene defaults ─────────────────────────────────
export const DEFAULT_CAMERA_FOV = 45;
export const DEFAULT_CAMERA_NEAR = 0.1;
export const DEFAULT_CAMERA_FAR = 1000;
export const DEFAULT_CAMERA_DISTANCE = 30;

// ─── Face mesh scale ───────────────────────────────
// FLAME vertices are in meters (~0.3 unit tall face).
// Layout spacing is 2.5 units. Scale up so faces fill the grid.
export const FACE_MESH_SCALE = 8;

// ─── Picking / highlight ────────────────────────────
export const HIGHLIGHT_EMISSIVE_BOOST = 0.3;
export const DIM_OPACITY = 0.35;

// ─── Visual check defaults ──────────────────────────
export const SCREENSHOT_WIDTH = 1280;
export const SCREENSHOT_HEIGHT = 720;

// ─── Data file paths (relative to public/) ──────────
export const FLAME_DATA_BASE = '/data/';
export const FLAME_META_FILE = 'flame_meta.json';
