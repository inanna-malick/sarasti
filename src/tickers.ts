import type { TickerConfig } from './types';

export const TICKERS: TickerConfig[] = [
  // ─── Brent family ─────────────────────────────────
  { id: 'BZ=F',        name: 'Brent Crude Spot',     class: 'energy', family: 'brent', age: 20, tenor_months: 0 },
  { id: 'BZV26.NYM',   name: 'Brent 8M Future',      class: 'energy', family: 'brent', age: 48, tenor_months: 8 },
  { id: 'BZZ26.NYM',   name: 'Brent 12M Future',     class: 'energy', family: 'brent', age: 60, tenor_months: 12 },

  // ─── WTI family ───────────────────────────────────
  { id: 'CL=F',        name: 'WTI Crude Spot',       class: 'energy', family: 'wti', age: 20, tenor_months: 0 },
  { id: 'CLU26.NYM',   name: 'WTI 6M Future',        class: 'energy', family: 'wti', age: 42, tenor_months: 6 },
  { id: 'CLZ26.NYM',   name: 'WTI 12M Future',       class: 'energy', family: 'wti', age: 60, tenor_months: 12 },

  // ─── Other energy ─────────────────────────────────
  { id: 'NG=F',        name: 'Natural Gas',           class: 'energy', family: 'natgas',   age: 25 },
  { id: 'HO=F',        name: 'Heating Oil',           class: 'energy', family: 'distill',  age: 30 },
  { id: 'RB=F',        name: 'RBOB Gasoline',         class: 'energy', family: 'distill',  age: 35 },

  // ─── Hormuz commodities ───────────────────────────
  { id: 'ALI=F',       name: 'Aluminum',              class: 'commodity', family: 'metals',     age: 30 },

  // ─── Fear instruments ─────────────────────────────
  { id: '^VIX',        name: 'VIX',                   class: 'fear', family: 'vol',      age: 20 },
  { id: 'GC=F',        name: 'Gold',                  class: 'fear', family: 'haven',    age: 40 },
  { id: 'DX=F',        name: 'US Dollar Index',       class: 'fear', family: 'currency', age: 35 },
  { id: '^TNX',        name: '10Y Treasury Yield',    class: 'fear', family: 'rates',    age: 55 },

  // ─── Equities ─────────────────────────────────────
  { id: 'XLE',         name: 'Energy Select SPDR',    class: 'equity', family: 'sector',     age: 30 },
  { id: 'ITA',         name: 'Aerospace & Defense',   class: 'equity', family: 'sector',     age: 25 },
  { id: 'SPY',         name: 'S&P 500',               class: 'equity', family: 'broad',      age: 40 },
  { id: 'CF',          name: 'CF Industries',         class: 'equity', family: 'fertilizer', age: 35 },
  { id: 'NTR',         name: 'Nutrien',               class: 'equity', family: 'fertilizer', age: 40 },

  // ─── Media/conflict ───────────────────────────────
  { id: 'GDELT:iran',       name: 'GDELT Iran Events',     class: 'media', family: 'gdelt', age: 20 },
  { id: 'GDELT:gulf',       name: 'GDELT Gulf Events',     class: 'media', family: 'gdelt', age: 22 },
  { id: 'GDELT:tone:iran',  name: 'GDELT Iran Tone',       class: 'media', family: 'gdelt', age: 28 },
];

export const TICKER_MAP = new Map(TICKERS.map(t => [t.id, t]));
