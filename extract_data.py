import json
import os

tickers = ["_TNX", "_VIX", "ALI_F", "BRENT", "CF", "DX_F", "GC_F", "HO_F", "NG_F", "RB_F", "SPY", "WTI", "XLE"]
dates = {"crisis": "2026-03-11", "calm": "2026-02-26"}
versions = ["w18", "w19"]

results = {}

for scenario, date in dates.items():
    results[scenario] = {}
    for ticker in tickers:
        results[scenario][ticker] = {}
        for version in versions:
            path = f"tools/eval/data/renders/{version}-{scenario}/{ticker}_{date}_front.json"
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    results[scenario][ticker][version] = {
                        "alarm": data["activations"].get("alarm"),
                        "distress": data["metaAxes"].get("distress"),
                        "fatigue": data["activations"].get("fatigue"),
                        "vitality": data["metaAxes"].get("vitality")
                    }
            else:
                results[scenario][ticker][version] = None

print(json.dumps(results, indent=2))
