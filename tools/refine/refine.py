import json
import os
from scipy.optimize import minimize
from config_space import PARAMETER_GROUPS
from objective import evaluate

try:
    from ipc import RenderBridge
    from scorer import QualityScorer
except ImportError:
    # Use mock implementations if not available
    from objective import RenderBridge, QualityScorer

def main():
    bridge = RenderBridge()
    scorer = QualityScorer()
    
    current_overrides = {}
    
    print("Starting optimization...")
    
    for group in PARAMETER_GROUPS:
        name = group["name"]
        keys = group["keys"]
        bounds = group["bounds"]
        defaults = group["defaults"]
        
        print(f"\\nOptimizing group: {name}")
        
        def objective_wrapper(x):
            # Clamp to bounds since Nelder-Mead can step outside
            clamped_x = [max(min(val, b[1]), b[0]) for val, b in zip(x, bounds)]
            
            overrides = dict(current_overrides)
            for k, v in zip(keys, clamped_x):
                overrides[k] = v
                
            return evaluate(overrides, bridge, scorer)
            
        res = minimize(
            objective_wrapper,
            x0=defaults,
            method='Nelder-Mead',
            options={'maxiter': 50, 'xatol': 0.01, 'fatol': 0.005}
        )
        
        # Clamp final best x
        best_x = [max(min(val, b[1]), b[0]) for val, b in zip(res.x, bounds)]
        for k, v in zip(keys, best_x):
            current_overrides[k] = v
            
        print(f"Group {name} finished. Best score: {-res.fun:.4f}")
        for k, v in zip(keys, best_x):
            print(f"  {k} = {v:.4f}")

    if hasattr(bridge, 'close'):
        bridge.close()

    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "optimal_config_result.json")
    
    with open(output_path, "w") as f:
        json.dump(current_overrides, f, indent=2)
        
    print(f"\\nOptimization complete. Saved results to {output_path}")

if __name__ == "__main__":
    main()
