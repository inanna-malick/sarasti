import type { TickerConfig } from './types';

export const TICKERS: TickerConfig[] = [
  { id: 'BRENT',      name: 'Brent Crude',          class: 'energy',    family: 'brent',      age: 20 },
  { id: 'WTI',        name: 'WTI Crude',             class: 'energy',    family: 'wti',        age: 20 },
  { id: 'NG=F',       name: 'Natural Gas',           class: 'energy',    family: 'natgas',     age: 25 },
  { id: 'HO=F',       name: 'Heating Oil',           class: 'energy',    family: 'distill',    age: 30 },
  { id: 'RB=F',       name: 'RBOB Gasoline',         class: 'energy',    family: 'distill',    age: 35 },
  { id: 'ALI=F',      name: 'Aluminum',              class: 'commodity', family: 'metals',     age: 30 },
  { id: '^VIX',       name: 'VIX',                   class: 'fear',      family: 'vol',        age: 20 },
  { id: 'GC=F',       name: 'Gold',                  class: 'fear',      family: 'haven',      age: 40 },
  { id: 'DX=F',       name: 'US Dollar Index',       class: 'fear',      family: 'currency',   age: 35 },
  { id: '^TNX',       name: '10Y Treasury Yield',    class: 'fear',      family: 'rates',      age: 55 },
  { id: 'XLE',        name: 'Energy Select SPDR',    class: 'equity',    family: 'sector',     age: 30 },
  { id: 'SPY',        name: 'S&P 500',               class: 'equity',    family: 'broad',      age: 40 },
  { id: 'CF',         name: 'CF Industries',         class: 'equity',    family: 'fertilizer', age: 35 },
  { id: 'GDELT:iran', name: 'GDELT Iran',            class: 'media',     family: 'gdelt',      age: 20 },
];

export const TICKER_MAP = new Map(TICKERS.map(t => [t.id, t]));
