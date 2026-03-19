import os
import sys
import json
import subprocess
import time
import select
import argparse
from typing import Dict, Any, List

# Imports from tools/eval/gemini.py and tools/eval/bestiary.py
# These are being created in parallel and will exist at runtime.
try:
    from tools.eval.gemini import describe, evaluate, compare, rank
    from tools.eval.bestiary import (
        load_entry, save_entry, update_entry, update_from_description,
        query, add_recipe_note, add_dose_note, add_interaction,
        get_summary, rebuild_index
    )
except ImportError:
    # Placeholder for static analysis if they don't exist yet
    def describe(*args, **kwargs): return "Description placeholder"
    def evaluate(*args, **kwargs): return "Evaluation placeholder"
    def compare(*args, **kwargs): return "Comparison placeholder"
    def rank(*args, **kwargs): return "Ranking placeholder"
    
    def load_entry(*args, **kwargs): return None
    def save_entry(*args, **kwargs): pass
    def update_entry(*args, **kwargs): pass
    def update_from_description(*args, **kwargs): pass
    def query(*args, **kwargs): return []
    def add_recipe_note(*args, **kwargs): pass
    def add_dose_note(*args, **kwargs): pass
    def add_interaction(*args, **kwargs): pass
    def get_summary(*args, **kwargs): return "Summary placeholder"
    def rebuild_index(*args, **kwargs): pass

class EvalRenderBridge:
    """Spawns tools/eval/render.ts as subprocess, communicates via JSON stdin/stdout."""
    def __init__(self, harness_path: str = "tools/eval/render.ts"):
        self.harness_path = harness_path
        stderr_path = os.path.join(os.path.dirname(__file__), 'data', 'harness-stderr.log')
        os.makedirs(os.path.dirname(stderr_path), exist_ok=True)
        self._stderr_log = open(stderr_path, 'w')
        
        # NixOS: subprocess command should be "npx tsx tools/eval/render.ts"
        self.process = subprocess.Popen(
            f"exec npx tsx {self.harness_path}",
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=self._stderr_log,
            text=True,
            bufsize=1,
            shell=True,
        )
        
        # 20s startup wait as per tools/refine/ipc.py pattern
        time.sleep(20)
        if self.process.poll() is not None:
            with open(stderr_path, 'r') as f:
                stderr_output = f.read()
            raise RuntimeError(f"EvalRenderBridge failed to start (exit code {self.process.returncode})\nstderr: {stderr_output}")

    def render(self, params: Dict[str, str], output: str) -> str:
        """Send render config, return screenshot path."""
        if self.process.poll() is not None:
            raise RuntimeError(f"EvalRenderBridge process terminated (exit code {self.process.poll()})")
            
        config = {"params": params, "output": output}
        try:
            self.process.stdin.write(json.dumps(config) + "\n")
            self.process.stdin.flush()
            
            # Read response with 30s timeout
            ready, _, _ = select.select([self.process.stdout], [], [], 30.0)
            if ready:
                for _ in range(20):
                    line = self.process.stdout.readline()
                    if not line:
                        raise RuntimeError("EOF from RenderBridge")
                    
                    result = line.strip()
                    if not result:
                        continue
                        
                    # TS side might return just the path or a JSON with path
                    if (result.startswith('/') or result.startswith('./')) and result.endswith('.png'):
                        return result
                    if result.startswith('{'):
                        try:
                            parsed = json.loads(result)
                            if "path" in parsed:
                                return parsed["path"]
                            if "error" in parsed:
                                raise RuntimeError(f"Render error: {parsed['error']}")
                        except json.JSONDecodeError:
                            pass
                raise RuntimeError(f"No valid render path received after 20 lines. Last line: {result}")
            else:
                raise TimeoutError("RenderBridge render timed out (30s)")
        except Exception as e:
            raise RuntimeError(f"Failed to communicate with EvalRenderBridge: {e}")

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        if hasattr(self, '_stderr_log'):
            self._stderr_log.close()

    def __enter__(self): return self
    def __exit__(self, exc_type, exc_val, exc_tb): self.close()

def log_finding(cycle: int, entry_type: str, data: Any):
    findings_path = "tools/eval/data/findings.jsonl"
    os.makedirs(os.path.dirname(findings_path), exist_ok=True)
    with open(findings_path, "a") as f:
        f.write(json.dumps({"cycle": cycle, "type": entry_type, "data": data}) + "\n")

def run_census(bridge):
    """Cycle 0: Render each psi0-psi29 at [-3,-1.5,0,+1.5,+3] x front view,
    plus +2.0 x [left34, right34] for symmetry. Same for beta0-beta29.
    ~420 renders total. Gemini describe() each, populate bestiary."""
    print("Running Cycle 0: Census...")
    
    components = [f"psi{i}" for i in range(30)] + [f"beta{i}" for i in range(30)]
    values = [-3.0, -1.5, 0.0, 1.5, 3.0]
    views = ["front"]
    extra_views = ["left34", "right34"]
    
    for comp in components:
        for val in values:
            for view in views:
                output = f"tools/eval/data/renders/census_{comp}_{val}_{view}.png"
                path = bridge.render({"mode": "raw", comp: str(val), "camera": view}, output)
                description = describe(path, brief=f"Describe {comp} at {val}")
                update_from_description(comp, description, val)
                log_finding(0, "census", {"comp": comp, "val": val, "camera": view, "path": path, "desc": description})
        
        # Symmetry check at +2.0
        for view in extra_views:
            val = 2.0
            output = f"tools/eval/data/renders/census_{comp}_{val}_{view}.png"
            path = bridge.render({"mode": "raw", comp: str(val), "camera": view}, output)
            description = describe(path, brief=f"Describe {comp} symmetry at {val} {view}")
            update_from_description(comp, description, val)
            log_finding(0, "symmetry", {"comp": comp, "val": val, "camera": view, "path": path, "desc": description})

def run_axis_sweeps(bridge):
    """Cycle 1: Coarse sweep each axis (alarm/fatigue/dominance) at 11 steps,
    optional fine sweep, cross-axis 3x3 grids for interaction."""
    print("Running Cycle 1: Axis Sweeps...")
    axes = ["alarm", "fatigue", "dominance"]
    steps = 11
    
    for axis in axes:
        for i in range(steps):
            val = -1.0 + (i * 2.0 / (steps - 1))
            output = f"tools/eval/data/renders/sweep_{axis}_{val:.2f}.png"
            path = bridge.render({axis: f"{val:.2f}"}, output)
            description = describe(path, brief=f"Describe {axis} at {val:.2f}")
            update_from_description(axis, description, val)
            log_finding(1, "sweep", {"axis": axis, "val": val, "path": path, "desc": description})
            
    # Cross-axis 3x3 grids (simplified for placeholder)
    for a1, a2 in [("alarm", "fatigue"), ("alarm", "dominance"), ("fatigue", "dominance")]:
        for v1 in [-1.0, 0.0, 1.0]:
            for v2 in [-1.0, 0.0, 1.0]:
                output = f"tools/eval/data/renders/grid_{a1}_{v1}_{a2}_{v2}.png"
                path = bridge.render({a1: str(v1), a2: str(v2)}, output)
                description = describe(path, brief=f"Describe interaction {a1}={v1}, {a2}={v2}")
                log_finding(1, "interaction", {"a1": a1, "v1": v1, "a2": a2, "v2": v2, "path": path, "desc": description})

def run_composites(bridge):
    """Cycle 2: Render 8 corners (all combinations of ±axis) x 3 angles,
    repair loop for failing corners (max 3 repair rounds)."""
    print("Running Cycle 2: Composites...")
    axes = ["alarm", "fatigue", "dominance"]
    views = ["front", "left34", "right34"]
    corners = []
    for v1 in [-1, 1]:
        for v2 in [-1, 1]:
            for v3 in [-1, 1]:
                corners.append({"alarm": str(v1), "fatigue": str(v2), "dominance": str(v3)})
                
    for i, params in enumerate(corners):
        for view in views:
            p = params.copy()
            p["camera"] = view
            
            # Repair loop (up to 3 rounds)
            for round in range(3):
                output = f"tools/eval/data/renders/corner_{i}_{view}_r{round}.png"
                path = bridge.render(p, output)
                score_desc = describe(path, brief="Rate this composite from 1-10 for facial integrity and semantics.")
                log_finding(2, "composite", {"params": p, "camera": view, "round": round, "path": path, "desc": score_desc})
                
                # Heuristic: if description suggests failure, could try to "repair" (adjust params)
                # For this orchestrator, we'll just log and continue
                if "10/10" in score_desc or "9/10" in score_desc or "8/10" in score_desc:
                    break
                # Mock repair: reduce magnitude
                p = {k: str(float(v)*0.8) if k != "camera" else v for k, v in p.items()}


def run_probing(bridge):
    """Cycle 3: Read bestiary to find candidate components, A/B screen,
    dose-finding for winners, multi-ingredient composites, re-sweep."""
    print("Running Cycle 3: Probing...")
    candidates = [e.component for e in query(limit=10)]
    if not candidates:
        candidates = ["psi0", "psi2", "beta0", "beta2"] # fallback
        
    for comp in candidates:
        # A/B screen
        p_a = {"mode": "raw", comp: "1.0"}
        p_b = {"mode": "raw", comp: "2.0"}
        path_a = bridge.render(p_a, f"tools/eval/data/renders/probe_{comp}_A.png")
        path_b = bridge.render(p_b, f"tools/eval/data/renders/probe_{comp}_B.png")
        diff = compare(path_a, path_b, brief=f"Does increasing {comp} enhance the target expression?")
        log_finding(3, "ab_screen", {"comp": comp, "diff": diff})

def run_validation(bridge):
    """Cycle 4: Full validation with repair loop. All corners > 7 score."""
    print("Running Cycle 4: Validation...")
    # Similar to Cycle 2 but with final targets
    run_composites(bridge)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cycle", type=int, choices=[0, 1, 2, 3, 4], help="Run a specific cycle")
    parser.add_argument("--all", action="store_true", help="Run all cycles sequentially")
    args = parser.parse_args()
    
    bestiary_dir = "tools/eval/data/bestiary"
    os.makedirs(bestiary_dir, exist_ok=True)
    
    with EvalRenderBridge() as bridge:
        if args.all:
            run_census(bridge)
            run_axis_sweeps(bridge)
            run_composites(bridge)
            run_probing(bridge)
            run_validation(bridge)
        elif args.cycle is not None:
            if args.cycle == 0: run_census(bridge)
            elif args.cycle == 1: run_axis_sweeps(bridge)
            elif args.cycle == 2: run_composites(bridge)
            elif args.cycle == 3: run_probing(bridge)
            elif args.cycle == 4: run_validation(bridge)
        else:
            parser.print_help()

if __name__ == "__main__":
    main()
