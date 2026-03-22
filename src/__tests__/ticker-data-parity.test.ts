import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TICKERS } from '../../examples/demo/tickers';

describe('Ticker ID parity', () => {
  it.todo('every ticker ID in TICKERS must exist in market-data.json', () => {
    // Read raw market-data.json
    const dataPath = path.resolve(__dirname, '../../public/data/market-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    expect(data).toHaveProperty('ticker_ids');
    expect(Array.isArray(data.ticker_ids)).toBe(true);
    
    const tickerIdsInData = new Set(data.ticker_ids);
    
    for (const ticker of TICKERS) {
      expect(tickerIdsInData.has(ticker.id), `Ticker ${ticker.id} from src/tickers.ts should exist in market-data.json ticker_ids array`).toBe(true);
    }
  });
});
