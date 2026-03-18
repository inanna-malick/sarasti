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
        # We use shell=True to ensure proper signal handling and pipe setup.
        # The harness needs Playwright's remote-debugging-pipe FDs to not
        # conflict with our stdin/stdout pipes, so we close_fds=False.
        stderr_log = open(os.path.join(os.path.dirname(__file__), 'data', 'harness-stderr.log'), 'w')
        self._stderr_log = stderr_log
        self.process = subprocess.Popen(
            f"exec npx tsx {harness_path}",
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=stderr_log,
            text=True,
            bufsize=1,  # Line buffered
            shell=True,
        )
        
        # Wait for the process to be ready — Vite+Playwright startup takes ~15s
        time.sleep(20)
        if self.process.poll() is not None:
            log_path = os.path.join(os.path.dirname(__file__), 'data', 'harness-stderr.log')
            stderr_output = open(log_path).read() if os.path.exists(log_path) else ""
            raise RuntimeError(f"RenderBridge failed to start (exit code {self.process.returncode})\nstderr: {stderr_output}")

    def render(self, config: Dict[str, Any]) -> str:
        """
        writes JSON line to stdin, reads screenshot path from stdout
        """
        if self.process.poll() is not None:
            log_path = os.path.join(os.path.dirname(__file__), 'data', 'harness-stderr.log')
            stderr_output = open(log_path).read()[-2000:] if os.path.exists(log_path) else ""
            raise RuntimeError(f"RenderBridge process has terminated unexpectedly (exit code {self.process.returncode})\nstderr: {stderr_output}")
            
        try:
            # Send config
            json_str = json.dumps(config)
            self.process.stdin.write(json_str + "\n")
            self.process.stdin.flush()
            
            # Read response (blocking with 30s timeout)
            # We use select to check if stdout is ready within 30 seconds
            ready, _, _ = select.select([self.process.stdout], [], [], 30.0)
            if ready:
                # Read lines until we get a valid render path.
                # Vite HMR or other noise can appear on stdout; skip it.
                for _ in range(20):
                    line = self.process.stdout.readline()
                    if not line:
                        raise RuntimeError("EOF reached while reading from RenderBridge")

                    result = line.strip()
                    if result.startswith('/') and result.endswith('.png'):
                        return result
                    if result.startswith('{'):
                        try:
                            parsed = json.loads(result)
                            return parsed.get("path", result)
                        except json.JSONDecodeError:
                            pass
                    # Skip non-path lines (e.g. Vite HMR messages)
                raise RuntimeError(f"No valid render path received after 20 lines")
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
