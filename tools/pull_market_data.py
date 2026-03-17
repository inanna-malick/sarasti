import json
from datetime import datetime, timedelta, timezone
import os
import sys
import random
import math


def sanitize_nans(obj):
    """Replace NaN/Infinity with 0.0 recursively for valid JSON output."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return 0.0
    if isinstance(obj, dict):
        return {k: sanitize_nans(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_nans(v) for v in obj]
    return obj

# Try to import requested libraries
try:
    import yfinance as yf
    import pandas as pd
    import numpy as np
    HAS_LIBS = True
except ImportError:
    HAS_LIBS = False

# Configuration
MARKET_TICKERS = [
    'BZ=F', 'BZV26.NYM', 'BZZ26.NYM',
    'CL=F', 'CLU26.NYM', 'CLZ26.NYM',
    'NG=F', 'HO=F', 'RB=F',
    'ALI=F',
    '^VIX', 'GC=F', 'DX=F', '^TNX',
    'XLE', 'SPY', 'CF'
]

FAMILIES = {
    'brent': {
        'tickers': ['BZ=F', 'BZV26.NYM', 'BZZ26.NYM'],
        'tenors': [0, 8, 12]
    },
    'wti': {
        'tickers': ['CL=F', 'CLU26.NYM', 'CLZ26.NYM'],
        'tenors': [0, 6, 12]
    }
}

# Ticker to family mapping for quick lookup
TICKER_TO_FAMILY = {}
for fam, config in FAMILIES.items():
    for t in config['tickers']:
        TICKER_TO_FAMILY[t] = fam

# Asset classes for cross-contagion
TICKER_CLASSES = {
    'BZ=F': 'energy', 'BZV26.NYM': 'energy', 'BZZ26.NYM': 'energy',
    'CL=F': 'energy', 'CLU26.NYM': 'energy', 'CLZ26.NYM': 'energy',
    'BRENT': 'energy', 'WTI': 'energy',
    'NG=F': 'energy', 'HO=F': 'energy', 'RB=F': 'energy',
    'ALI=F': 'commodity',
    '^VIX': 'fear', 'GC=F': 'metal', 'DX=F': 'currency', '^TNX': 'rates',
    'XLE': 'equity', 'SPY': 'equity',
    'CF': 'equity'
}

BASELINE_ISO = '2026-02-25T00:00:00Z'
END_PULL = '2026-03-16T00:00:00Z'
OUTPUT_PATH = 'public/data/market-data.json'

def compute_pca_residuals(data_matrix, n_components):
    """Simple PCA using numpy. returns (n_samples, n_components)."""
    if not HAS_LIBS:
        return np.zeros((data_matrix.shape[0], n_components))
    
    import numpy as np
    
    # 1. Center the data
    mean = np.mean(data_matrix, axis=0)
    centered = data_matrix - mean
    
    # Check if we have enough samples/features
    n_samples, n_features = centered.shape
    actual_components = min(n_samples, n_features, n_components)
    
    if actual_components == 0:
        return np.zeros((n_samples, n_components))
        
    # 2. SVD is more stable than Eigen
    try:
        u, s, vh = np.linalg.svd(centered, full_matrices=False)
        # Transformed data = U * S
        transformed = u[:, :actual_components] * s[:actual_components]
        
        # Pad with zeros if we need more components
        if transformed.shape[1] < n_components:
            padding = np.zeros((n_samples, n_components - transformed.shape[1]))
            transformed = np.hstack([transformed, padding])
            
        return transformed
    except Exception as e:
        print(f"PCA error: {e}")
        return np.zeros((n_samples, n_components))

def process_ticker_df(df, baseline_window):
    """Core logic for computing derived fields using pandas."""
    import pandas as pd
    import numpy as np
    
    # Forward-fill gaps
    df = df.resample('1h').asfreq()
    df['Close'] = df['Close'].ffill()
    df['High'] = df['High'].ffill()
    df['Low'] = df['Low'].ffill()
    df['Volume'] = df['Volume'].fillna(0)
    
    # Baseline stats
    baseline_close = baseline_window['Close'].mean()
    baseline_vol = baseline_window['Volume'].mean()
    if baseline_vol == 0: baseline_vol = 1.0
    
    # Hist volatility (pct change stddev)
    hist_vol = baseline_window['Close'].pct_change().std()
    if np.isnan(hist_vol) or hist_vol == 0: hist_vol = 0.01
        
    # Derived fields
    df['deviation'] = (df['Close'] - baseline_close) / baseline_close
    
    # velocity = delta_close / delta_t normalized to rolling 6h stddev
    # We use baseline_volatility as a scaling factor
    pre_crisis_std = baseline_window['Close'].std()
    if pre_crisis_std == 0 or np.isnan(pre_crisis_std):
        pre_crisis_std = baseline_close * 0.01
        
    rolling_std_6h = df['Close'].rolling(window=6).std()
    rolling_std_6h = rolling_std_6h.fillna(pre_crisis_std).replace(0, pre_crisis_std)
    
    df['velocity'] = (df['Close'].diff() / rolling_std_6h).fillna(0)
    df['volatility'] = (rolling_std_6h / pre_crisis_std).fillna(1.0)
    
    # New Tier 2/3 fields
    df['volume_anomaly'] = (df['Volume'] / baseline_vol).fillna(1.0)
    df['high_low_ratio'] = ((df['High'] - df['Low']) / df['Close']).fillna(0)
    
    return df, {
        "avg_volume": float(baseline_vol),
        "hist_volatility": float(hist_vol),
        "skewness": float(baseline_window['Close'].pct_change().skew() or 0.0)
    }

def run_pull_with_libs():
    """Implementation using yfinance and pandas."""
    import yfinance as yf
    import pandas as pd
    import numpy as np
    
    all_tickers = MARKET_TICKERS
    print(f"Fetching data for {len(all_tickers)} tickers...")
    
    # Fetch 1h candles
    # We fetch a bit more to have pre-crisis data (Feb 25-27)
    # yfinance: start='2026-02-18' (Feb 18) to ensure we have baseline window
    data = yf.download(all_tickers, start='2026-02-18', end='2026-03-17', interval='1h', group_by='ticker')
    
    processed_tickers = {}
    baseline_start = pd.to_datetime('2026-02-25T00:00:00', utc=True)
    baseline_end = pd.to_datetime('2026-02-27T23:59:59', utc=True)
    
    # First pass: compute individual ticker metrics and collect dataframes
    ticker_statics = {}
    for tid in all_tickers:
        if tid in data.columns.levels[0]:
            ticker_df = data[tid].copy()
            if ticker_df.index.tz is None:
                ticker_df.index = ticker_df.index.tz_localize('UTC')
            else:
                ticker_df.index = ticker_df.index.tz_convert('UTC')
            
            baseline_window = ticker_df.loc[baseline_start:baseline_end]
            if baseline_window.empty:
                print(f"Warning: Empty baseline for {tid}, using first 72 hours")
                baseline_window = ticker_df.iloc[:72]
                
            processed_tickers[tid], statics = process_ticker_df(ticker_df, baseline_window)
            ticker_statics[tid] = statics
        else:
            print(f"Warning: {tid} missing from batch — trying daily fallback")
            try:
                single = yf.download(tid, start='2026-02-18', end='2026-03-17',
                                     interval='1d', auto_adjust=True)
                if single.empty: raise ValueError("empty")
                single.index = pd.to_datetime(single.index, utc=True)
                hourly_idx = pd.date_range('2026-02-18', '2026-03-17', freq='1h', tz='UTC')
                ticker_df = single.reindex(hourly_idx).ffill().bfill()
                for col in ['Close', 'High', 'Low', 'Volume']:
                    if col not in ticker_df.columns: ticker_df[col] = 0.0
            except Exception as e:
                print(f"  Fallback failed for {tid}: {e} — using zeros")
                hourly_idx = pd.date_range('2026-02-18', '2026-03-17', freq='1h', tz='UTC')
                ticker_df = pd.DataFrame({'Close': 0.0, 'Volume': 0.0, 'High': 0.0, 'Low': 0.0}, index=hourly_idx)
            baseline_window = ticker_df.loc[baseline_start:baseline_end]
            if baseline_window.empty: baseline_window = ticker_df.iloc[:72]
            processed_tickers[tid], statics = process_ticker_df(ticker_df, baseline_window)
            ticker_statics[tid] = statics

    # Second pass: compute cross-ticker metrics (correlation, spread, contagion)
    brent_baseline = processed_tickers['BZ=F'].loc[baseline_start:baseline_end]['Close']
    spy_baseline = processed_tickers['SPY'].loc[baseline_start:baseline_end]['Close']
    
    for tid in list(processed_tickers.keys()):
        df = processed_tickers[tid]
        baseline_window = df.loc[baseline_start:baseline_end]['Close']
        
        # Static cross-ticker fields
        ticker_statics[tid]['corr_to_brent'] = float(baseline_window.corr(brent_baseline) or 0.0)
        ticker_statics[tid]['corr_to_spy'] = float(baseline_window.corr(spy_baseline) or 0.0)
        
        # spread_from_family
        family_name = TICKER_TO_FAMILY.get(tid)
        if family_name:
            family_tickers = FAMILIES[family_name]['tickers']
            family_means = pd.concat([processed_tickers[t].loc[baseline_start:baseline_end]['Close'] for t in family_tickers if t in processed_tickers], axis=1).mean(axis=1)
            ticker_statics[tid]['spread_from_family'] = float(baseline_window.mean() - family_means.mean())
        else:
            ticker_statics[tid]['spread_from_family'] = 0.0

        # Per-frame cross-ticker fields
        # Rolling correlation to Brent (6h window)
        df['rolling_corr_brent'] = df['Close'].rolling(window=6).corr(processed_tickers['BZ=F']['Close']).fillna(ticker_statics[tid]['corr_to_brent'])
        df['corr_breakdown'] = (df['rolling_corr_brent'] - ticker_statics[tid]['corr_to_brent']).abs()
        
        # Cross-contagion: rolling corr to other classes
        my_class = TICKER_CLASSES.get(tid, 'energy')
        other_tickers = [t for t, c in TICKER_CLASSES.items() if c != my_class and t in processed_tickers]
        if other_tickers:
            other_prices = pd.concat([processed_tickers[t]['Close'] for t in other_tickers], axis=1).mean(axis=1)
            df['cross_contagion'] = df['Close'].rolling(window=6).corr(other_prices).fillna(0)
        else:
            df['cross_contagion'] = 0.0
            
        # Term slope for families
        if family_name:
            family_config = FAMILIES[family_name]
            tenors = family_config['tenors']
            family_tickers = family_config['tickers']
            
            slopes = []
            for ts in df.index:
                prices = [processed_tickers[t].loc[ts, 'Close'] if ts in processed_tickers[t].index else 0 for t in family_tickers]
                if all(p > 0 for p in prices):
                    slope, _ = np.polyfit(tenors, prices, 1)
                    slopes.append(slope)
                else:
                    slopes.append(0.0)
            df['term_slope'] = slopes
        else:
            df['term_slope'] = 0.0

    # Composite construction
    COMPOSITES = {
        'BRENT': {'spot': 'BZ=F', 'far': 'BZZ26.NYM', 'far_tenor': 12},
        'WTI':   {'spot': 'CL=F', 'far': 'CLZ26.NYM', 'far_tenor': 12},
    }
    for comp_id, cfg in COMPOSITES.items():
        spot_df = processed_tickers[cfg['spot']].copy()
        if cfg['far'] in processed_tickers:
            spot_df['term_slope'] = (
                processed_tickers[cfg['far']]['Close'] - spot_df['Close']
            ) / cfg['far_tenor']
        processed_tickers[comp_id] = spot_df
        ticker_statics[comp_id] = ticker_statics[cfg['spot']].copy()
        ticker_statics[comp_id]['spread_from_family'] = 0.0
        TICKER_CLASSES[comp_id] = 'energy'

    # Pop raw family members from output
    for tid in ['BZ=F','BZV26.NYM','BZZ26.NYM','CL=F','CLU26.NYM','CLZ26.NYM']:
        processed_tickers.pop(tid, None)
        ticker_statics.pop(tid, None)

    # Sarasti Residuals
    ref_idx = next(iter(processed_tickers.values())).index
    frames_idx = ref_idx[ref_idx >= baseline_start]
    n_frames = len(frames_idx)
    n_tickers = len(processed_tickers)
    
    # Shape residuals (static)
    shape_matrix = np.zeros((n_tickers, n_frames))
    sorted_tids = sorted(processed_tickers.keys())
    for i, tid in enumerate(sorted_tids):
        ticker_df = processed_tickers[tid].reindex(frames_idx).ffill().fillna(0)
        shape_matrix[i, :] = ticker_df['Close'].values
        
    shape_residuals = compute_pca_residuals(shape_matrix, 50)
    for i, tid in enumerate(sorted_tids):
        ticker_statics[tid]['shape_residuals'] = shape_residuals[i].tolist()

    # Dynamic residuals
    features = ['Close', 'deviation', 'velocity', 'volatility', 'volume_anomaly', 'corr_breakdown', 'cross_contagion', 'high_low_ratio']
    expr_matrix = np.zeros((n_tickers * n_frames, len(features)))
    for i, tid in enumerate(sorted_tids):
        ticker_df = processed_tickers[tid].reindex(frames_idx).ffill().fillna(0)
        for j, feat in enumerate(features):
            expr_matrix[i*n_frames:(i+1)*n_frames, j] = ticker_df[feat].values
            
    expr_residuals_all = compute_pca_residuals(expr_matrix, 60)
    
    # Pivot to frames
    frames = []
    for f_idx, ts in enumerate(frames_idx):
        values = {}
        for t_idx, tid in enumerate(sorted_tids):
            row = processed_tickers[tid].loc[ts] if ts in processed_tickers[tid].index else None
            expr_res = expr_residuals_all[t_idx * n_frames + f_idx].tolist()
            if row is not None:
                values[tid] = {
                    "close": float(row['Close']),
                    "volume": float(row['Volume']),
                    "deviation": float(row['deviation']),
                    "velocity": float(row['velocity']),
                    "volatility": float(row['volatility']),
                    "volume_anomaly": float(row['volume_anomaly']),
                    "corr_breakdown": float(row['corr_breakdown']),
                    "term_slope": float(row.get('term_slope', 0.0)),
                    "cross_contagion": float(row['cross_contagion']),
                    "high_low_ratio": float(row['high_low_ratio']),
                    "expr_residuals": expr_res
                }
            else:
                values[tid] = {
                    "close": 0.0, "volume": 0.0, "deviation": 0.0, "velocity": 0.0, "volatility": 1.0,
                    "volume_anomaly": 1.0, "corr_breakdown": 0.0, "term_slope": 0.0, "cross_contagion": 0.0, "high_low_ratio": 0.0,
                    "expr_residuals": expr_res
                }
        frames.append({
            "timestamp": ts.isoformat().replace('+00:00', 'Z'),
            "values": values
        })
    
    return {
        "ticker_ids": sorted_tids,
        "baseline_timestamp": BASELINE_ISO,
        "statics": ticker_statics,
        "frames": frames
    }

def generate_synthetic_fallback():
    """Fallback generator for environments without pandas/numpy."""
    random.seed(42)
    start_dt = datetime.strptime(BASELINE_ISO, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    end_dt = datetime.strptime(END_PULL, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    
    all_ticker_ids = sorted(MARKET_TICKERS)
    
    ticker_history = {}
    ticker_statics = {}
    for tid in all_ticker_ids:
        random.seed(hash(tid))
        base_price = 100.0
        if tid.startswith('^'): base_price = 20.0
        elif 'BZ' in tid or 'CL' in tid: base_price = 80.0

        ticker_statics[tid] = {
            "avg_volume": 100000.0,
            "hist_volatility": 0.02,
            "corr_to_brent": 0.8 if 'BZ' in tid or 'CL' in tid else 0.3,
            "corr_to_spy": 0.4,
            "skewness": -0.1,
            "spread_from_family": 0.0,
            "shape_residuals": [random.uniform(-1, 1) for _ in range(50)]
        }
        
        history = []
        curr = start_dt
        price = base_price
        while curr <= end_dt:
            change = random.normalvariate(0, 0.005) * price
            price += change
            history.append({
                "ts": curr,
                "close": price,
                "volume": random.randint(100, 1000),
                "deviation": (price - base_price) / base_price,
                "velocity": change / (base_price * 0.01),
                "volatility": 1.0 + 0.05 * math.sin(curr.timestamp() / 86400.0),
                "volume_anomaly": random.uniform(0.8, 1.2),
                "corr_breakdown": random.uniform(0, 0.1),
                "term_slope": random.uniform(-0.1, 0.1) if TICKER_TO_FAMILY.get(tid) else 0.0,
                "cross_contagion": random.uniform(0, 0.5),
                "high_low_ratio": random.uniform(0.005, 0.02),
                "expr_residuals": [random.uniform(-0.1, 0.1) for _ in range(60)]
            })
            curr += timedelta(hours=1)
        ticker_history[tid] = history
        
    # Composite construction
    COMPOSITES = {
        'BRENT': {'spot': 'BZ=F', 'far': 'BZZ26.NYM', 'far_tenor': 12},
        'WTI':   {'spot': 'CL=F', 'far': 'CLZ26.NYM', 'far_tenor': 12},
    }
    for comp_id, cfg in COMPOSITES.items():
        if cfg['spot'] in ticker_history:
            # Copy history from spot
            ticker_history[comp_id] = [h.copy() for h in ticker_history[cfg['spot']]]
            ticker_statics[comp_id] = ticker_statics[cfg['spot']].copy()
            ticker_statics[comp_id]['spread_from_family'] = 0.0
            
            # Compute term_slope if far future exists
            if cfg['far'] in ticker_history:
                for i in range(len(ticker_history[comp_id])):
                    spot_p = ticker_history[cfg['spot']][i]['close']
                    far_p = ticker_history[cfg['far']][i]['close']
                    ticker_history[comp_id][i]['term_slope'] = (far_p - spot_p) / cfg['far_tenor']
    
    # Pop raw family members
    raw_to_pop = ['BZ=F', 'BZV26.NYM', 'BZZ26.NYM', 'CL=F', 'CLU26.NYM', 'CLZ26.NYM']
    for tid in raw_to_pop:
        ticker_history.pop(tid, None)
        ticker_statics.pop(tid, None)
    
    # Update and re-sort all_ticker_ids
    all_ticker_ids = sorted(ticker_history.keys())
    
    frames = []
    steps = len(ticker_history[all_ticker_ids[0]])
    for i in range(steps):
        ts = ticker_history[all_ticker_ids[0]][i]["ts"]
        values = {}
        for tid in all_ticker_ids:
            h = ticker_history[tid][i]
            values[tid] = {
                "close": h["close"],
                "volume": h["volume"],
                "deviation": h["deviation"],
                "velocity": h["velocity"],
                "volatility": h["volatility"],
                "volume_anomaly": h["volume_anomaly"],
                "corr_breakdown": h["corr_breakdown"],
                "term_slope": h["term_slope"],
                "cross_contagion": h["cross_contagion"],
                "high_low_ratio": h["high_low_ratio"],
                "expr_residuals": h["expr_residuals"]
            }
        frames.append({
            "timestamp": ts.strftime('%Y-%m-%dT%H:00:00Z'),
            "values": values
        })
        
    return {
        "ticker_ids": all_ticker_ids,
        "baseline_timestamp": BASELINE_ISO,
        "statics": ticker_statics,
        "frames": frames
    }

def main():
    if HAS_LIBS:
        try:
            output = run_pull_with_libs()
        except Exception as e:
            print(f"Error in yfinance/pandas run: {e}")
            output = generate_synthetic_fallback()
    else:
        print("Libraries not found. Using synthetic fallback.")
        output = generate_synthetic_fallback()
        
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    output = sanitize_nans(output)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=2)
        
    print(f"\nSummary:")
    print(f"Tickers pulled: {len(output['ticker_ids'])}")
    print(f"Date range: {output['frames'][0]['timestamp']} to {output['frames'][-1]['timestamp']}")
    print(f"Frames: {len(output['frames'])}")
    print("Market data pull complete.")

if __name__ == "__main__":
    main()
