export type Exchange = 'NYMEX' | 'NYSE' | 'CBOE' | 'ICE' | 'COMEX' | '24H';

interface ExchangeHours {
  peakStartUTC: number; // hour 0-23
  peakEndUTC: number;   // hour 0-23
}

const EXCHANGE_HOURS: Record<Exclude<Exchange, '24H'>, ExchangeHours> = {
  NYMEX: { peakStartUTC: 13, peakEndUTC: 17.5 },
  COMEX: { peakStartUTC: 13, peakEndUTC: 17.5 },
  NYSE:  { peakStartUTC: 13.5, peakEndUTC: 20 },
  CBOE:  { peakStartUTC: 13.5, peakEndUTC: 20 },
  ICE:   { peakStartUTC: 13, peakEndUTC: 17.5 },
};

/**
 * Compute exchange fatigue based on time of day.
 * Returns [-0.8, +0.6]:
 *   -0.8 during peak hours (alert, wide-eyed)
 *   +0.6 far from peak (fatigued, droopy)
 *   cosine ramp in 1-2 hour shoulder zones
 *   24H exchanges: always -0.3 (slightly alert)
 */
export function computeExchangeFatigue(exchange: Exchange, utcHour: number): number {
  if (exchange === '24H') return -0.3;

  const hours = EXCHANGE_HOURS[exchange];
  const peakMid = (hours.peakStartUTC + hours.peakEndUTC) / 2;
  const peakHalfWidth = (hours.peakEndUTC - hours.peakStartUTC) / 2;
  const shoulderWidth = 1.5; // hours of cosine ramp

  // Distance from peak center, wrapped to [-12, 12]
  let dist = utcHour - peakMid;
  if (dist > 12) dist -= 24;
  if (dist < -12) dist += 24;
  const absDist = Math.abs(dist);

  if (absDist <= peakHalfWidth) {
    // During peak: alert
    return -0.8;
  } else if (absDist <= peakHalfWidth + shoulderWidth) {
    // Shoulder: cosine ramp from -0.8 to +0.6
    const t = (absDist - peakHalfWidth) / shoulderWidth; // 0..1
    const cosT = (1 - Math.cos(t * Math.PI)) / 2; // smooth 0..1
    return -0.8 + cosT * 1.4; // -0.8 to +0.6
  } else {
    // Far from peak: fatigued
    return 0.6;
  }
}
