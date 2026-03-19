import os
import sys
import json
import argparse
from typing import Dict, Any
from urllib.parse import parse_qs

# Imports from tools/eval/gemini.py and tools/eval/bestiary.py
# These are being created in parallel and will exist at runtime.
try:
    from tools.eval.gemini import compare_ab
    from tools.eval.bestiary import Bestiary
except ImportError:
    # Fallback/placeholder logic for local development
    def compare_ab(*args, **kwargs): return "Comparison result placeholder."
    class Bestiary:
        def __init__(self, path): self.path = path
        def update_observation(self, *args, **kwargs): pass

# Try to import EvalRenderBridge from orchestrate.py
try:
    from tools.eval.orchestrate import EvalRenderBridge
except ImportError:
    try:
        from orchestrate import EvalRenderBridge
    except ImportError:
        class EvalRenderBridge:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def render(self, *args): return "placeholder.png"

def parse_param_string(s: str) -> Dict[str, str]:
    """Parses 'alarm=0.8&fatigue=0' style strings."""
    # Handle both & and spaces
    s = s.replace(' ', '&')
    qs = parse_qs(s)
    return {k: v[0] for k, v in qs.items()}

def main():
    parser = argparse.ArgumentParser(description="A/B comparison CLI tool for FLAME refinement.")
    parser.add_argument("--param", help="Single parameter to sweep (e.g. alarm)")
    parser.add_argument("--values", help="Comma-separated values for the sweep (e.g. 0.5,0.8)")
    parser.add_argument("--baseline", help="Baseline parameter string (e.g. 'alarm=0.8')")
    parser.add_argument("--delta", help="Delta parameter string (e.g. 'psi3=1.5')")
    parser.add_argument("--question", help="Question to ask Gemini (for --baseline/--delta mode)")
    parser.add_argument("--a", help="Full parameter string for variant A")
    parser.add_argument("--b", help="Full parameter string for variant B")
    args = parser.parse_args()

    bestiary_dir = "tools/eval/data/bestiary"
    os.makedirs(bestiary_dir, exist_ok=True)
    bestiary = Bestiary(bestiary_dir)

    with EvalRenderBridge() as bridge:
        path_a, path_b = None, None
        params_a, params_b = {}, {}
        question = args.question or "Compare these two variants. What are the key differences?"

        if args.param and args.values:
            vals = args.values.split(",")
            if len(vals) < 2:
                print("Error: --values must have at least two comma-separated values.")
                return
            v1, v2 = vals[0], vals[1]
            params_a = {args.param: v1}
            params_b = {args.param: v2}
            path_a = bridge.render(params_a, f"tools/eval/data/renders/diff_{args.param}_{v1}.png")
            path_b = bridge.render(params_b, f"tools/eval/data/renders/diff_{args.param}_{v2}.png")
            question = f"Compare {args.param} at {v1} vs {v2}."
            
        elif args.baseline and args.delta:
            params_a = parse_param_string(args.baseline)
            params_b = params_a.copy()
            params_b.update(parse_param_string(args.delta))
            path_a = bridge.render(params_a, "tools/eval/data/renders/diff_baseline.png")
            path_b = bridge.render(params_b, "tools/eval/data/renders/diff_delta.png")
            
        elif args.a and args.b:
            params_a = parse_param_string(args.a)
            params_b = parse_param_string(args.b)
            path_a = bridge.render(params_a, "tools/eval/data/renders/diff_A.png")
            path_b = bridge.render(params_b, "tools/eval/data/renders/diff_B.png")
            
        else:
            parser.print_help()
            return

        print(f"Variant A: {params_a} -> {path_a}")
        print(f"Variant B: {params_b} -> {path_b}")
        
        # 2. Sends to Gemini compare_ab() with appropriate brief
        result = compare_ab(path_a, path_b, question=question)
        print("\n--- GEMINI COMPARISON ---\n")
        print(result)
        
        # 3. Updates bestiary with observations
        bestiary.update_observation("diff", f"{params_a} vs {params_b}", result)

if __name__ == "__main__":
    main()
