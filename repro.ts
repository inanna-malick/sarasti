import { parseDataset } from './src/data/loader';
import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('public/data/market-history.json', 'utf8'));
const dataset = parseDataset(raw, []);

const firstFrame = dataset.frames[0];
const firstTicker = Object.keys(firstFrame.values)[0];
const v = firstFrame.values[firstTicker];

console.log('Ticker:', firstTicker);
console.log('Momentum:', v.momentum);
console.log('Drawdown:', v.drawdown);
console.log('Mean Reversion Z:', v.mean_reversion_z);
console.log('Beta:', v.beta);
