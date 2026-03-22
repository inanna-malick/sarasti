// Demo-specific binding configuration
// Re-exports the market-tuned curves from the library
export { DEFAULT_BINDING_CONFIG } from '../../src/binding/config';
export type { BindingConfig } from '../../src/binding/types';

// Demo-specific types (already in src/types.ts for now)
export type { TickerConfig, TickerFrame, AssetClass, Frame, TimelineDataset } from '../../src/types';
