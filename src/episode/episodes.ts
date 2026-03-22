import type { Episode } from './types';
import type { TickerConfig } from '../types';

// ─── Common tickers available across all episodes (since 2018) ───

const COMMON_TICKERS: TickerConfig[] = [
  { id: 'CL=F',  name: 'WTI Crude',    class: 'energy',    family: 'oil',      age: 35 },
  { id: 'NG=F',  name: 'Natural Gas',   class: 'energy',    family: 'gas',      age: 30 },
  { id: '^VIX',  name: 'VIX',           class: 'fear',      family: 'vol',      age: 20 },
  { id: 'GC=F',  name: 'Gold',          class: 'commodity', family: 'metals',   age: 55 },
  { id: '^TNX',  name: '10Y Treasury',  class: 'currency',  family: 'rates',    age: 50 },
  { id: 'SPY',   name: 'S&P 500',       class: 'equity',    family: 'index',    age: 40 },
  { id: 'XLE',   name: 'Energy ETF',    class: 'equity',    family: 'energy',   age: 35 },
  { id: 'QQQ',   name: 'Nasdaq 100',    class: 'equity',    family: 'tech',     age: 25 },
  { id: 'TLT',   name: 'Long Bonds',    class: 'currency',  family: 'rates',    age: 60 },
];

// ─── Episode definitions ────────────────────────────

export const COVID_CRASH: Episode = {
  id: 'covid-crash',
  title: 'COVID Crash',
  subtitle: 'S&P 500 drops 34% in 23 trading days. VIX hits 82. Gold and bonds spike as equities crater. Feb\u2013Apr 2020.',
  dataUrl: '/data/episodes/covid-crash.json',
  tickers: COMMON_TICKERS,
};

export const OIL_NEGATIVE: Episode = {
  id: 'oil-negative',
  title: 'Oil Goes Negative',
  subtitle: 'WTI front-month futures go negative for the first time in history. USO collapses. Energy stocks diverge from broader market. April 2020.',
  dataUrl: '/data/episodes/oil-negative.json',
  tickers: [
    ...COMMON_TICKERS,
    { id: 'USO', name: 'US Oil Fund', class: 'energy', family: 'oil', age: 28 },
  ],
};

export const VOLMAGEDDON: Episode = {
  id: 'volmageddon',
  title: 'Volmageddon',
  subtitle: 'VIX doubles in a single day, blowing up short-volatility ETPs. S&P 500 drops 10% in 9 days after a year of calm. Feb 2018.',
  dataUrl: '/data/episodes/volmageddon.json',
  tickers: COMMON_TICKERS,
};

export const SVB_COLLAPSE: Episode = {
  id: 'svb-collapse',
  title: 'SVB Collapse',
  subtitle: 'Silicon Valley Bank fails in 48 hours. Regional bank ETF (KRE) drops 30%. Treasuries and gold rally as deposits flee to safety. March 2023.',
  dataUrl: '/data/episodes/svb-collapse.json',
  tickers: [
    ...COMMON_TICKERS,
    { id: 'KRE', name: 'Regional Banks', class: 'equity', family: 'banks', age: 32 },
  ],
};

export const EPISODES: Episode[] = [
  COVID_CRASH,
  OIL_NEGATIVE,
  VOLMAGEDDON,
  SVB_COLLAPSE,
];

export const EPISODE_MAP: Record<string, Episode> = Object.fromEntries(
  EPISODES.map(e => [e.id, e]),
);
