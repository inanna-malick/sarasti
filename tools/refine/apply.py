import json
import os
import sys

def main():
    base_dir = os.path.join(os.path.dirname(__file__), "data")
    config_path = os.path.join(base_dir, "optimal_config_result.json")
    if not os.path.exists(config_path):
        config_path = os.path.join(base_dir, "optimal_config_baseline.json")
    if not os.path.exists(config_path):
        print(f"Error: Could not find config file at {config_path}")
        sys.exit(1)
        
    with open(config_path, "r") as f:
        config = json.load(f)
        
    print("Optimization Results Applicator")
    print("==============================\n")
    
    # 1. src/constants.ts
    print("--- src/constants.ts ---")
    keys_constants = {
        "maxJaw": "MAX_JAW_OPEN",
        "maxNeckPitch": "MAX_NECK_PITCH",
        "maxNeckYaw": "MAX_NECK_YAW",
        "maxEyeHorizontal": "MAX_EYE_HORIZONTAL",
        "maxEyeVertical": "MAX_EYE_VERTICAL",
        "expressionIntensity": "EXPRESSION_INTENSITY_DEFAULT"
    }
    for k, v in keys_constants.items():
        if k in config:
            print(f"Update: {keys_constants[k]} = {config[k]:.4f};")

    # 2. src/binding/config.ts
    print("\n--- src/binding/config.ts ---")
    keys_binding = {
        "deviationSteepness": "deviation_curve.steepness",
        "velocitySteepness": "velocity_curve.steepness",
        "expressionIntensity": "expression_intensity",
        "semantifyExprIntensity": "semantify_expr_intensity"
    }
    for k, v in keys_binding.items():
        if k in config:
            print(f"Update: {keys_binding[k]} = {config[k]:.4f}")
            
    # 3. src/renderer/flame/eyeMaterial.ts
    print("\n--- src/renderer/flame/eyeMaterial.ts ---")
    keys_material = {
        "irisRadius": "irisRadius",
        "pupilRadius": "pupilRadius"
    }
    for k, v in keys_material.items():
        if k in config:
            print(f"Update: {keys_material[k]} = {config[k]:.4f}")

if __name__ == "__main__":
    main()