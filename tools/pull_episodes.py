"""
Pull historical market episodes from yfinance.

Each episode is a curated window of real market data with daily candles
cubic-interpolated to 4 frames/day for smooth playback.

Output format matches the existing market-data.json schema (RawMarketHistory):
  { baseline_timestamp, frames: [{ timestamp, values: { ticker_id: { close, volume, ... } } }] }

Usage:
  python3 tools/pull_episodes.py              # pull all episodes
  python3 tools/pull_episodes.py covid-crash   # pull single episode
"""

import json
import math
import os
import sys
from datetime import datetime, timedelta, timezone

try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
    from scipy.interpolate import CubicSpline
    HAS_LIBS = True
except ImportError:
    HAS_LIBS = False


# ─── Episode definitions ───────────────────────────────

COMMON_TICKERS = [
    'CL=F', 'NG=F', '^VIX', 'GC=F', 'DX=F', '^TNX', 'SPY', 'XLE', 'QQQ', 'TLT',
]

EPISODES = {
    'covid-crash': {
        'title': 'COVID Crash',
        'start': '2020-02-14',
        'end': '2020-04-01',
        'baseline_start': '2020-02-14',
        'baseline_end': '2020-02-19',
        'tickers': COMMON_TICKERS,
    },
    'oil-negative': {
        'title': 'Oil Goes Negative',
        'start': '2020-04-01',
        'end': '2020-04-30',
        'baseline_start': '2020-04-01',
        'baseline_end': '2020-04-03',
        'tickers': COMMON_TICKERS + ['USO'],
    },
    'volmageddon': {
        'title': 'Volmageddon',
        'start': '2018-01-26',
        'end': '2018-02-20',
        'baseline_start': '2018-01-26',
        'baseline_end': '2018-01-31',
        'tickers': COMMON_TICKERS,
    },
    'svb-collapse': {
        'title': 'SVB Collapse',
        'start': '2023-03-01',
        'end': '2023-03-24',
        'baseline_start': '2023-03-01',
        'baseline_end': '2023-03-07',
        'tickers': COMMON_TICKERS + ['KRE'],
    },
}

OUTPUT_DIR = 'public/data/episodes'
INTERP_FACTOR = 4  # 4 frames per trading day


def sanitize_nans(obj):
    """Replace NaN/Infinity with 0.0 recursively for valid JSON output."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return 0.0
    if isinstance(obj, dict):
        return {k: sanitize_nans(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_nans(v) for v in obj]
    return obj


def pull_episode(episode_id: str, config: dict) -> dict:
    """Pull and process a single episode."""
    print(f"\n{'='*60}")
    print(f"Pulling episode: {config['title']} ({episode_id})")
    print(f"  Window: {config['start']} -> {config['end']}")
    print(f"  Tickers: {len(config['tickers'])}")
    print(f"{'='*60}")

    tickers = config['tickers']

    # Fetch daily candles (more reliable for historical data)
    # Pad start by 10 days for baseline/rolling calcs
    pad_start = (pd.Timestamp(config['start']) - pd.Timedelta(days=10)).strftime('%Y-%m-%d')
    end_plus = (pd.Timestamp(config['end']) + pd.Timedelta(days=1)).strftime('%Y-%m-%d')

    print(f"  Fetching from {pad_start} to {end_plus}...")
    data = yf.download(tickers, start=pad_start, end=end_plus, interval='1d', group_by='ticker')

    if data.empty:
        print(f"  ERROR: No data returned for {episode_id}")
        return None

    # Process each ticker
    window_start = pd.Timestamp(config['start'])
    window_end = pd.Timestamp(config['end'])
    baseline_start = pd.Timestamp(config['baseline_start'])
    baseline_end = pd.Timestamp(config['baseline_end'])

    ticker_series = {}  # tid -> DataFrame with derived fields

    for tid in tickers:
        try:
            if len(tickers) == 1:
                ticker_df = data.copy()
            elif tid in data.columns.get_level_values(0):
                ticker_df = data[tid].copy()
            else:
                print(f"  Warning: {tid} missing from batch download, trying individual...")
                ticker_df = yf.download(tid, start=pad_start, end=end_plus, interval='1d')
                if ticker_df.empty:
                    print(f"  Skipping {tid} — no data")
                    continue
        except Exception as e:
            print(f"  Skipping {tid}: {e}")
            continue

        # Handle multi-level columns from yfinance
        if isinstance(ticker_df.columns, pd.MultiIndex):
            ticker_df.columns = ticker_df.columns.get_level_values(0)

        if 'Close' not in ticker_df.columns:
            print(f"  Skipping {tid} — no Close column")
            continue

        ticker_df = ticker_df.dropna(subset=['Close'])
        if len(ticker_df) < 3:
            print(f"  Skipping {tid} — too few data points ({len(ticker_df)})")
            continue

        # Baseline stats
        bl_mask = (ticker_df.index >= baseline_start) & (ticker_df.index <= baseline_end)
        baseline = ticker_df.loc[bl_mask]
        if baseline.empty:
            # Fallback: first 3 days
            baseline = ticker_df.iloc[:3]

        baseline_close = float(baseline['Close'].mean())
        if baseline_close == 0:
            baseline_close = float(ticker_df['Close'].iloc[0])

        pre_crisis_std = float(baseline['Close'].std())
        if pre_crisis_std == 0 or np.isnan(pre_crisis_std):
            pre_crisis_std = baseline_close * 0.01

        # Compute derived fields
        df = ticker_df.copy()
        df['deviation'] = (df['Close'] - baseline_close) / baseline_close

        rolling_std = df['Close'].rolling(window=5, min_periods=1).std().fillna(pre_crisis_std)
        rolling_std = rolling_std.replace(0, pre_crisis_std)

        df['velocity'] = (df['Close'].diff() / rolling_std).fillna(0)
        df['volatility'] = (rolling_std / pre_crisis_std).fillna(1.0)

        rolling_max = df['Close'].expanding().max()
        df['drawdown'] = ((df['Close'] - rolling_max) / rolling_max).fillna(0)

        df['momentum'] = df['velocity'].ewm(span=5).mean().fillna(0)
        df['mean_reversion_z'] = (df['deviation'] / df['volatility'].replace(0, 1)).fillna(0)
        df['beta'] = 1.0

        if 'Volume' not in df.columns:
            df['Volume'] = 0.0
        df['Volume'] = df['Volume'].fillna(0)

        # Trim to episode window
        mask = (df.index >= window_start) & (df.index <= window_end)
        df = df.loc[mask]

        if len(df) < 2:
            print(f"  Skipping {tid} — not enough data in window")
            continue

        ticker_series[tid] = df
        print(f"  {tid}: {len(df)} daily points, baseline_close={baseline_close:.2f}")

    if not ticker_series:
        print(f"  ERROR: No tickers survived for {episode_id}")
        return None

    # ─── Cubic interpolation to INTERP_FACTOR × density ───

    # Build common date index from all tickers
    all_dates = sorted(set().union(*(set(df.index) for df in ticker_series.values())))
    n_daily = len(all_dates)
    n_interp = (n_daily - 1) * INTERP_FACTOR + 1

    # Numeric x-axis: days from start
    x_daily = np.array([(d - all_dates[0]).total_seconds() / 86400 for d in all_dates])
    x_interp = np.linspace(x_daily[0], x_daily[-1], n_interp)

    # Generate interpolated timestamps (6-hour intervals)
    ts_start = all_dates[0]
    interp_timestamps = []
    for i in range(n_interp):
        days_offset = x_interp[i] - x_daily[0]
        ts = ts_start + pd.Timedelta(days=days_offset)
        interp_timestamps.append(ts.strftime('%Y-%m-%dT%H:%M:%SZ'))

    # Interpolate each ticker's fields
    FIELDS = ['close', 'volume', 'deviation', 'velocity', 'volatility',
              'drawdown', 'momentum', 'mean_reversion_z', 'beta']
    FIELD_MAP = {
        'close': 'Close', 'volume': 'Volume', 'deviation': 'deviation',
        'velocity': 'velocity', 'volatility': 'volatility',
        'drawdown': 'drawdown', 'momentum': 'momentum',
        'mean_reversion_z': 'mean_reversion_z', 'beta': 'beta',
    }

    interp_data = {}  # tid -> { field -> np.array of length n_interp }

    for tid, df in ticker_series.items():
        # Reindex to common dates, forward-fill gaps
        df_aligned = df.reindex(all_dates).ffill().bfill()

        tid_data = {}
        for field, col in FIELD_MAP.items():
            y = df_aligned[col].values.astype(float)
            y = np.nan_to_num(y, nan=0.0, posinf=0.0, neginf=0.0)

            if len(y) >= 4:
                cs = CubicSpline(x_daily, y, bc_type='natural')
                tid_data[field] = cs(x_interp)
            else:
                # Linear fallback for very short series
                tid_data[field] = np.interp(x_interp, x_daily, y)

        interp_data[tid] = tid_data

    # ─── Build output frames ───

    frames = []
    for i in range(n_interp):
        values = {}
        for tid in interp_data:
            values[tid] = {
                field: float(interp_data[tid][field][i])
                for field in FIELDS
            }
        frames.append({
            'timestamp': interp_timestamps[i],
            'values': values,
        })

    baseline_ts = f"{config['baseline_start']}T00:00:00Z"

    result = {
        'baseline_timestamp': baseline_ts,
        'frames': frames,
    }

    print(f"  Output: {len(frames)} frames, {len(interp_data)} tickers")
    return result


def main():
    if not HAS_LIBS:
        print("ERROR: Required libraries not found.")
        print("Install with: pip install yfinance pandas numpy scipy")
        sys.exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Allow pulling a single episode by name
    if len(sys.argv) > 1:
        episode_id = sys.argv[1]
        if episode_id not in EPISODES:
            print(f"Unknown episode: {episode_id}")
            print(f"Available: {', '.join(EPISODES.keys())}")
            sys.exit(1)
        episodes_to_pull = {episode_id: EPISODES[episode_id]}
    else:
        episodes_to_pull = EPISODES

    for episode_id, config in episodes_to_pull.items():
        result = pull_episode(episode_id, config)
        if result is None:
            print(f"  FAILED: {episode_id}")
            continue

        result = sanitize_nans(result)
        out_path = os.path.join(OUTPUT_DIR, f'{episode_id}.json')
        with open(out_path, 'w') as f:
            json.dump(result, f)

        size_mb = os.path.getsize(out_path) / (1024 * 1024)
        print(f"  Wrote {out_path} ({size_mb:.1f} MB)")

    print("\nDone.")


if __name__ == '__main__':
    main()
