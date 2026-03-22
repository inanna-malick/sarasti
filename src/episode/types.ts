import type { TickerConfig } from '../types';

/** A curated historical market episode with real data. */
export interface Episode {
  id: string;
  title: string;
  subtitle: string;
  /** URL to fetch episode data from, e.g. '/data/episodes/covid-crash.json' */
  dataUrl: string;
  /** Episode-specific ticker configs (class, family, age for EMA wave propagation) */
  tickers: TickerConfig[];
}
