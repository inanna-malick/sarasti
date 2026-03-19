import type { TickerConfig } from '../../src/types';

export const TICKERS: TickerConfig[] = [
  { id: 'BRENT',      name: 'Brent Crude',          class: 'energy',    family: 'brent',      age: 20, exchange: 'NYMEX' },
  { id: 'WTI',        name: 'WTI Crude',             class: 'energy',    family: 'wti',        age: 20, exchange: 'NYMEX' },
  { id: 'NG=F',       name: 'Natural Gas',           class: 'energy',    family: 'natgas',     age: 25, exchange: 'NYMEX' },
  { id: 'HO=F',       name: 'Heating Oil',           class: 'energy',    family: 'distill',    age: 30, exchange: 'NYMEX' },
  { id: 'RB=F',       name: 'RBOB Gasoline',         class: 'energy',    family: 'distill',    age: 35, exchange: 'NYMEX' },
  { id: 'ALI=F',      name: 'Aluminum',              class: 'commodity', family: 'metals',     age: 30, exchange: 'COMEX' },
  { id: '^VIX',       name: 'VIX',                   class: 'fear',      family: 'vol',        age: 20, exchange: 'CBOE' },
  { id: 'GC=F',       name: 'Gold',                  class: 'fear',      family: 'haven',      age: 40, exchange: 'COMEX' },
  { id: 'DX=F',       name: 'US Dollar Index',       class: 'fear',      family: 'currency',   age: 35, exchange: 'NYSE' },
  { id: '^TNX',       name: '10Y Treasury Yield',    class: 'fear',      family: 'rates',      age: 55, exchange: 'NYSE' },
  { id: 'XLE',        name: 'Energy Select SPDR',    class: 'equity',    family: 'sector',     age: 30, exchange: 'NYSE' },
  { id: 'SPY',        name: 'S&P 500',               class: 'equity',    family: 'broad',      age: 40, exchange: 'NYSE' },
  { id: 'CF',         name: 'CF Industries',         class: 'equity',    family: 'fertilizer', age: 35, exchange: 'NYSE' },
  // GDELT:iran cut — no data in current market-data.json bake
];

export const TICKER_MAP = new Map(TICKERS.map(t => [t.id, t]));
