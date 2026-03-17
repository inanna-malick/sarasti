import type { FaceParams } from '../../types';

/**
 * Generate SVG face from FaceParams.
 * 30+ controllable dimensions mapping shape/expression to SVG paths.
 */
export function generateFaceSvg(params: FaceParams): string {
  const { shape, expression } = params;

  // Helper to get param or 0 if out of bounds
  const s = (idx: number) => (shape && shape.length > idx ? shape[idx] : 0);
  const e = (idx: number) => (expression && expression.length > idx ? expression[idx] : 0);

  // ─── Dimensions & Base Positions ───────────────────
  const centerX = 60;
  const centerY = 80;

  // ─── Shape Mapping ────────────────────────────────
  // shape[0]: head width (-2 to +2 -> 40 to 55)
  const headRx = 48 + s(0) * 4;
  // shape[1]: head height (-2 to +2 -> 55 to 75)
  const headRy = 65 + s(1) * 5;
  // shape[2]: jawline/width (-2 to +2 -> affects bottom curve)
  const jawWidth = headRx * (0.7 + s(2) * 0.1);
  // shape[9]: chin shape (-2 to +2 -> affects chin pointiness)
  const chinY = centerY + headRy + s(9) * 5;

  // ─── Expression Mapping ───────────────────────────
  // expression[9]: overall tension (subtle multiplier)
  const tension = 1.0 + e(9) * 0.1;

  // ─── Face Path ────────────────────────────────────
  // Simple face shape using bezier curves
  // Top-left, Top-right, Bottom-right, Bottom-left
  const facePath = `
    M ${centerX - headRx} ${centerY}
    C ${centerX - headRx} ${centerY - headRy}, ${centerX + headRx} ${centerY - headRy}, ${centerX + headRx} ${centerY}
    C ${centerX + headRx} ${centerY + headRy * 0.5}, ${centerX + jawWidth} ${chinY}, ${centerX} ${chinY}
    C ${centerX - jawWidth} ${chinY}, ${centerX - headRx} ${centerY + headRy * 0.5}, ${centerX - headRx} ${centerY}
  `.replace(/\s+/g, ' ').trim();

  // ─── Brows ────────────────────────────────────────
  // shape[3]: brow prominence (y offset)
  const browBaseY = centerY - headRy * 0.35 + s(3) * 3;
  // expression[0]: brow furrow (tilt and y offset)
  const browFurrow = e(0);
  // expression[5-6]: brow asymmetry
  const browLTilt = (browFurrow * -10) + (e(5) * 15);
  const browRTilt = (browFurrow * 10) + (e(6) * 15);
  const browLY = browBaseY - (browFurrow * 5);
  const browRY = browBaseY - (browFurrow * 5);

  const browW = headRx * 0.35;
  const browH = 2;

  // ─── Eyes ─────────────────────────────────────────
  // shape[6]: eye size
  const eyeSize = 6 + s(6) * 2;
  // shape[7]: eye spacing
  const eyeSpacing = headRx * 0.45 + s(7) * 5;
  // expression[1]: eye openness
  const eyeOpenness = Math.max(0.1, 1.0 + e(1) * 0.5) * tension;
  const eyeRy = eyeSize * 0.6 * eyeOpenness;

  const eyeLY = centerY - headRy * 0.1;
  const eyeRY = centerY - headRy * 0.1;

  // ─── Nose ─────────────────────────────────────────
  // shape[4]: nose width
  const noseW = 8 + s(4) * 3;
  // expression[4]: nostril flare
  const noseFlare = 1.0 + e(4) * 0.3;
  const actualNoseW = noseW * noseFlare;
  const noseH = headRy * 0.25;
  const noseY = centerY + headRy * 0.1;

  const nosePath = `
    M ${centerX - 2} ${eyeLY}
    Q ${centerX - 4} ${noseY}, ${centerX - actualNoseW/2} ${noseY + noseH}
    L ${centerX + actualNoseW/2} ${noseY + noseH}
    Q ${centerX + 4} ${noseY}, ${centerX + 2} ${eyeLY}
  `.replace(/\s+/g, ' ').trim();

  // ─── Mouth ────────────────────────────────────────
  // shape[8]: mouth width
  const mouthW = 25 + s(8) * 5;
  // expression[2]: mouth openness
  const mouthOpen = Math.max(0, e(2) * 15) * tension;
  // expression[3]: mouth curve (smile/frown)
  const mouthCurve = e(3) * 10;
  // expression[8]: lip tension
  const lipTension = 1.0 - Math.abs(e(8)) * 0.5;

  const mouthY = centerY + headRy * 0.5 + e(7) * 3; // expression[7] jaw clench
  const mouthControlY = mouthY + mouthCurve;

  const mouthPath = `
    M ${centerX - mouthW/2} ${mouthY}
    Q ${centerX} ${mouthControlY - mouthOpen}, ${centerX + mouthW/2} ${mouthY}
    Q ${centerX} ${mouthControlY + mouthOpen * 1.5}, ${centerX - mouthW/2} ${mouthY}
  `.replace(/\s+/g, ' ').trim();

  // ─── Cheekbones ───────────────────────────────────
  // shape[5]: cheekbone height
  const cheekY = centerY + headRy * 0.1 + s(5) * 5;
  const cheekW = headRx * 0.2;

  return `
    <path d="${facePath}" fill="#c8b8a8" stroke="#666" stroke-width="1.5" />
    <!-- Cheeks -->
    <ellipse cx="${centerX - headRx * 0.6}" cy="${cheekY}" rx="${cheekW}" ry="${cheekW * 0.5}" fill="#000" fill-opacity="0.05" />
    <ellipse cx="${centerX + headRx * 0.6}" cy="${cheekY}" rx="${cheekW}" ry="${cheekW * 0.5}" fill="#000" fill-opacity="0.05" />

    <!-- Eyes -->
    <ellipse cx="${centerX - eyeSpacing}" cy="${eyeLY}" rx="${eyeSize}" ry="${eyeRy}" fill="#fff" stroke="#333" stroke-width="1" />
    <ellipse cx="${centerX + eyeSpacing}" cy="${eyeRY}" rx="${eyeSize}" ry="${eyeRy}" fill="#fff" stroke="#333" stroke-width="1" />
    <circle cx="${centerX - eyeSpacing}" cy="${eyeLY}" r="${eyeSize * 0.4}" fill="#333" />
    <circle cx="${centerX + eyeSpacing}" cy="${eyeRY}" r="${eyeSize * 0.4}" fill="#333" />

    <!-- Brows -->
    <rect x="${centerX - eyeSpacing - browW/2}" y="${browLY}" width="${browW}" height="${browH}" fill="#444"
          transform="rotate(${browLTilt}, ${centerX - eyeSpacing}, ${browLY})" />
    <rect x="${centerX + eyeSpacing - browW/2}" y="${browRY}" width="${browW}" height="${browH}" fill="#444"
          transform="rotate(${browRTilt}, ${centerX + eyeSpacing}, ${browRY})" />

    <!-- Nose -->
    <path d="${nosePath}" fill="none" stroke="#864" stroke-width="1.2" stroke-linecap="round" />

    <!-- Mouth -->
    <path d="${mouthPath}" fill="${mouthOpen > 2 ? '#633' : 'none'}" stroke="#633" stroke-width="2" stroke-linejoin="round" />
  `.trim();
}
