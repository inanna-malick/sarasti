import json
import os
import time

# We will need to set up the path to import from tools.refine
import sys
# Ensure the root project directory is in sys.path so 'tools.refine' is resolvable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from tools.refine.scorer import QualityScorer
from tools.refine.ipc import RenderBridge

SCENARIOS = {
    "neutral": {"dev": 0, "vel": 0, "vol": 1},
    "mild_crisis": {"dev": -0.1, "vel": -0.05, "vol": 1.5},
    "extreme_crisis": {"dev": -0.2, "vel": -0.15, "vol": 2.5},
    "shock_spike": {"dev": 0.15, "vel": 0.1, "vol": 2.0},
    "calm_recovery": {"dev": 0.05, "vel": 0.03, "vol": 0.8},
}

class MockRenderBridge:
    def __init__(self):
        print("Using MockRenderBridge for testing")
        
    def render(self, config):
        # Return a placeholder image path
        placeholder = "tools/refine/data/mock_render.png"
        if not os.path.exists(placeholder):
            from PIL import Image
            img = Image.new('RGB', (512, 512), color=(128, 128, 128))
            os.makedirs(os.path.dirname(placeholder), exist_ok=True)
            img.save(placeholder)
        return placeholder

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

def main():
    use_mock = not os.path.exists("tools/refine/harness.ts")
    if use_mock:
        print("Warning: tools/refine/harness.ts not found. Falling back to MockRenderBridge.")
        
    print("Initializing QualityScorer (loading CLIP ViT-L/14)...")
    scorer = QualityScorer()
    
    results = {}
    BridgeClass = MockRenderBridge if use_mock else RenderBridge
    
    with BridgeClass() as bridge:
        for name, params in SCENARIOS.items():
            print(f"\\nRunning scenario: {name} {params}")
            config = {
                "tickerId": "BRENT",
                "dev": params["dev"],
                "vel": params["vel"],
                "vol": params["vol"]
            }
            
            try:
                # Render
                t0 = time.time()
                image_path = bridge.render(config)
                render_time = time.time() - t0
                print(f"  Rendered in {render_time:.2f}s: {image_path}")
                
                # Score
                t0 = time.time()
                scores = scorer.score(image_path)
                score_time = time.time() - t0
                print(f"  Scored in {score_time:.2f}s")
                
                results[name] = scores
                
            except Exception as e:
                print(f"  Error in scenario {name}: {e}")
                results[name] = {"error": str(e)}

    # Save diagnostics
    os.makedirs("tools/refine/data", exist_ok=True)
    out_path = "tools/refine/data/diagnostic.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\\nSaved results to {out_path}\\n")
    
    # Print human-readable summary table
    metrics = ["realism", "mouth", "eyes", "expression_mild", "expression_extreme"]
    
    print("=" * 80)
    print(f"{'Scenario':<18} | " + " | ".join(f"{m[:8]:>8}" for m in metrics))
    print("-" * 80)
    for name in SCENARIOS.keys():
        scores = results.get(name, {})
        if "error" in scores:
            print(f"{name:<18} | ERROR: {scores['error']}")
        else:
            row = " | ".join(f"{scores.get(m, 0.0):>8.2f}" for m in metrics)
            print(f"{name:<18} | {row}")
    print("=" * 80)

if __name__ == "__main__":
    main()
