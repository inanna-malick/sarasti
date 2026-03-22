
import { parseDataset, getFrameAtTime } from './src/data/loader';
import { TICKERS } from './examples/demo/tickers';
import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('./public/data/market-data.json', 'utf8'));
const dataset = parseDataset(raw, TICKERS);

const testTimes = [
  "2026-02-25T00:00:00Z",
  "2026-03-05T08:00:00Z",
  "2026-03-11T14:00:00Z",
  "2026-03-15T14:00:00Z",
  "2026-03-16T00:00:00Z"
];

testTimes.forEach(t => {
  const frame = getFrameAtTime(dataset, t);
  const index = dataset.frames.indexOf(frame);
  console.log(`t: ${t} -> index: ${index} (timestamp: ${frame.timestamp})`);
});
