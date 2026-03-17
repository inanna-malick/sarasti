import json
import subprocess
import time
import select
import os
from typing import Dict, Any

class RenderBridge:
    def __init__(self, harness_path: str = "tools/refine/harness.ts"):
        if not os.path.exists(harness_path):
            raise FileNotFoundError(f"Render harness not found at {harness_path}. Please ensure it exists or provide the correct path.")

        # Spawns TS harness as subprocess
        # nix-shell --run "npx tsx tools/refine/harness.ts"
        self.process = subprocess.Popen(
            ["nix-shell", "--run", f"npx tsx {harness_path}"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL, # Ignore stderr to prevent buffer filling and blocking
            text=True,
            bufsize=1 # Line buffered
        )
        
        # Wait for the process to be ready or handle immediate errors
        time.sleep(1)
        if self.process.poll() is not None:
            raise RuntimeError(f"RenderBridge failed to start (exit code {self.process.returncode})")

    def render(self, config: Dict[str, Any]) -> str:
        """
        writes JSON line to stdin, reads screenshot path from stdout
        """
        if self.process.poll() is not None:
            raise RuntimeError(f"RenderBridge process has terminated unexpectedly (exit code {self.process.returncode})")
            
        try:
            # Send config
            json_str = json.dumps(config)
            self.process.stdin.write(json_str + "\n")
            self.process.stdin.flush()
            
            # Read response (blocking with 30s timeout)
            # We use select to check if stdout is ready within 30 seconds
            ready, _, _ = select.select([self.process.stdout], [], [], 30.0)
            if ready:
                line = self.process.stdout.readline()
                if not line:
                    raise RuntimeError("EOF reached while reading from RenderBridge")
                
                # Assume the line is the screenshot path or a JSON containing it
                result = line.strip()
                if result.startswith('{'):
                    # Attempt to parse as JSON if it's formatted that way
                    try:
                        parsed = json.loads(result)
                        return parsed.get("path", result)
                    except json.JSONDecodeError:
                        return result
                return result
            else:
                raise TimeoutError("RenderBridge render timed out after 30 seconds")
                
        except Exception as e:
            raise RuntimeError(f"Failed to communicate with RenderBridge: {e}")

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
            
    def __enter__(self):
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
