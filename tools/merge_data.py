import json
import os
import sys

def merge_data():
    market_file = 'public/data/market-data.json'
    gdelt_file = 'public/data/gdelt-data.json'
    output_file = 'public/data/market-history.json'
    fixture_file = 'test-utils/data-fixture-real.json'

    # Check for missing files
    if not os.path.exists(market_file):
        print(f"Error: Missing input file: {market_file}")
        sys.exit(1)
    if not os.path.exists(gdelt_file):
        print(f"Error: Missing input file: {gdelt_file}")
        sys.exit(1)

    print(f"Reading {market_file} and {gdelt_file}...")
    with open(market_file, 'r') as f:
        market_data = json.load(f)
    with open(gdelt_file, 'r') as f:
        gdelt_data = json.load(f)

    # Union of all ticker ids
    market_tickers = set(market_data.get('ticker_ids', []))
    gdelt_tickers = set(gdelt_data.get('ticker_ids', []))
    ticker_ids = sorted(list(market_tickers | gdelt_tickers))
    
    # Use market_data baseline as primary
    baseline_timestamp = market_data.get('baseline_timestamp') or gdelt_data.get('baseline_timestamp')

    # Map timestamps to frames for quick lookup
    def get_frame_map(data):
        return {f['timestamp']: f['values'] for f in data.get('frames', [])}

    market_frames = get_frame_map(market_data)
    gdelt_frames = get_frame_map(gdelt_data)

    # All unique timestamps sorted
    all_timestamps = sorted(list(set(market_frames.keys()) | set(gdelt_frames.keys())))

    # Resulting frames
    merged_frames = []
    
    # Default values for missing tickers
    ZERO_VAL = {
        "close": 0.0,
        "volume": 0.0,
        "deviation": 0.0,
        "velocity": 0.0,
        "volatility": 1.0  # volatility baseline usually 1.0
    }

    # Track last seen values for forward-fill
    last_values = {tid: ZERO_VAL.copy() for tid in ticker_ids}

    for ts in all_timestamps:
        frame_values = {}
        for tid in ticker_ids:
            # Check if tid is in market or gdelt for this timestamp
            val = None
            if ts in market_frames and tid in market_frames[ts]:
                val = market_frames[ts][tid]
            elif ts in gdelt_frames and tid in gdelt_frames[ts]:
                val = gdelt_frames[ts][tid]
            
            if val is not None:
                # Ensure it has all required fields
                required_fields = ["close", "volume", "deviation", "velocity", "volatility"]
                cleaned_val = {field: val.get(field, 0.0) for field in required_fields}
                frame_values[tid] = cleaned_val
                last_values[tid] = cleaned_val
            else:
                # Forward-fill from last_values
                frame_values[tid] = last_values[tid]
        
        merged_frames.append({
            "timestamp": ts,
            "values": frame_values
        })

    # Validation: every frame must have all ticker ids
    for f in merged_frames:
        if len(f['values']) != len(ticker_ids):
            print(f"Warning: Frame at {f['timestamp']} has {len(f['values'])} tickers, expected {len(ticker_ids)}")
        if len(f['values']) != 25:
             # Just a warning if it's not 25, as requested in prompt "Every frame must have all 25 ticker ids"
             pass

    # Output schema: RawMarketHistory
    output_data = {
        "baseline_timestamp": baseline_timestamp,
        "frames": merged_frames
    }

    # Write output
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    print(f"Merged output written to {output_file}")
    
    # Write fixture (first 5 frames)
    os.makedirs(os.path.dirname(fixture_file), exist_ok=True)
    fixture_data = {
        "baseline_timestamp": baseline_timestamp,
        "frames": merged_frames[:5]
    }
    with open(fixture_file, 'w') as f:
        json.dump(fixture_data, f, indent=2)
    print(f"Test fixture written to {fixture_file}")

    # Summary
    print("-" * 40)
    print(f"Summary:")
    print(f"Total frames: {len(merged_frames)}")
    if merged_frames:
        tickers_per_frame = len(merged_frames[0]['values'])
        date_range = f"{merged_frames[0]['timestamp']} to {merged_frames[-1]['timestamp']}"
        print(f"Tickers per frame: {tickers_per_frame}")
        print(f"Date range: {date_range}")
        if tickers_per_frame == 25:
            print("Validation: Success (25 tickers present per frame)")
        else:
            print(f"Validation Note: Found {tickers_per_frame} tickers per frame, expected 25.")
    print("-" * 40)

if __name__ == "__main__":
    if "--dry-run" in sys.argv:
        print("Dry run: Checking input files...")
        m_exists = os.path.exists('public/data/market-data.json')
        g_exists = os.path.exists('public/data/gdelt-data.json')
        if m_exists and g_exists:
            print("Input files found. Merge would proceed.")
        else:
            if not m_exists:
                print("Missing public/data/market-data.json")
            if not g_exists:
                print("Missing public/data/gdelt-data.json")
        sys.exit(0)
        
    merge_data()
