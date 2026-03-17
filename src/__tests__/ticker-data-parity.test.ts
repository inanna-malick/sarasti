import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TICKERS } from '../tickers';

describe('Ticker ID parity', () => {
  it('every ticker ID in TICKERS must exist as a key in market-data.json', () => {
    // Read raw market-data.json
    // Note: in vitest/node context, we need to find the file relative to project root
    const dataPath = path.resolve(__dirname, '../../public/data/market-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    // market-data.json is expected to have 'ticker_ids' array and data keyed by ID
    // based on my previous read_file output:
    // {
    //   "ticker_ids": [...],
    //   "ALI=F": [...],
    //   ...
    // }
    
    for (const ticker of TICKERS) {
      expect(data, `Ticker ${ticker.id} from src/tickers.ts should exist as a key in market-data.json`).toHaveProperty(ticker.id);
    }
  });
});
