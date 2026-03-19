from dataclasses import dataclass, field, asdict
import google.generativeai as genai
import json
import os
import sys
import argparse
from pathlib import Path
from typing import List, Optional, Any, Type, TypeVar
import time

T = TypeVar('T')

@dataclass
class EvalResult:
    overall_score: int          # 1-10
    expression_accuracy: int    # 1-10
    mesh_quality: int           # 1-10
    primary_issue: str
    preserve: List[str]         # what's working
    suggestions: List[str]
    feedback: str               # free-form art direction

@dataclass
class CompareResult:
    winner: str                 # "A" or "B"
    confidence: float           # 0-1
    what_changed: str
    why_winner_is_better: str
    regressions: List[str]

@dataclass
class RankResult:
    ranking: List[int]          # indices sorted best→worst
    best_index: int
    best_reason: str
    per_image_notes: List[str]
    sweet_spot_description: str

@dataclass
class Description:
    emotion_read: str
    affected_regions: List[str]
    symmetry: float             # 0-1
    symmetry_notes: str
    artifact_level: str         # "none"/"minor"/"moderate"/"severe"
    artifact_notes: str
    resembles: str
    useful_for: List[str]
    prose: str                  # 3-5 sentence naturalist description

class GeminiEvaluator:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            # We don't sys.exit here to allow imports to work for help/docs
            pass
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
        self.model_name = os.environ.get("GEMINI_MODEL", model_name)
        self._model = None

    @property
    def model(self):
        if self._model is None:
            if not self.api_key:
                raise RuntimeError("GEMINI_API_KEY environment variable not set.")
            self._model = genai.GenerativeModel(self.model_name)
        return self._model

    def _call_with_retry(self, prompt: str, images: List[Path], result_class: Type[T]) -> T:
        uploaded_files = []
        try:
            for img_path in images:
                uploaded_files.append(genai.upload_file(str(img_path)))
            
            # Construct the full prompt with JSON instruction
            schema = {f.name: str(f.type) for f in result_class.__dataclass_fields__.values()}
            full_prompt = f"""{prompt}

Respond strictly with a JSON object that matches this schema:
{json.dumps(schema, indent=2)}
"""

            for attempt in range(2):
                try:
                    response = self.model.generate_content([full_prompt] + uploaded_files)
                    text = response.text
                    # Extract JSON if it's wrapped in markdown blocks
                    if "```json" in text:
                        text = text.split("```json")[1].split("```")[0]
                    elif "```" in text:
                        text = text.split("```")[1].split("```")[0]
                    
                    data = json.loads(text.strip())
                    # Basic validation and construction
                    return result_class(**data)
                except Exception as e:
                    if attempt == 0:
                        time.sleep(1)
                        continue
                    raise e
        finally:
            # Cleanup uploaded files? The API keeps them for a while. 
            pass

    def describe(self, image_path: Path, brief: str) -> Description:
        prompt = f"Describe this 3D face render.\nBrief: {brief}"
        return self._call_with_retry(prompt, [image_path], Description)

    def eval(self, image_path: Path, brief: str) -> EvalResult:
        prompt = f"Evaluate this 3D face render based on the provided brief.\nBrief: {brief}"
        return self._call_with_retry(prompt, [image_path], EvalResult)

    def compare(self, image_a: Path, image_b: Path, brief: str) -> CompareResult:
        prompt = f"Compare these two 3D face renders (Image A and Image B) based on the brief.\nBrief: {brief}"
        return self._call_with_retry(prompt, [image_a, image_b], CompareResult)

    def rank(self, images: List[Path], brief: str) -> RankResult:
        img_labels = ", ".join([f"Image {i}" for i in range(len(images))])
        prompt = f"Rank these {len(images)} 3D face renders ({img_labels}) from best to worst based on the brief.\nBrief: {brief}"
        return self._call_with_retry(prompt, images, RankResult)

def main():
    parser = argparse.ArgumentParser(description="Gemini-guided face evaluation")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Describe
    desc_parser = subparsers.add_parser("describe", help="Describe a face")
    desc_parser.add_argument("--image", required=True, type=Path, help="Path to image")
    desc_parser.add_argument("--brief", required=True, help="Description brief")

    # Eval
    eval_parser = subparsers.add_parser("eval", help="Evaluate a face")
    eval_parser.add_argument("--image", required=True, type=Path, help="Path to image")
    eval_parser.add_argument("--brief-file", type=Path, help="Path to brief file")
    eval_parser.add_argument("--brief", help="Brief text (used if --brief-file is not provided)")

    # Compare
    comp_parser = subparsers.add_parser("compare", help="Compare two faces")
    comp_parser.add_argument("--image-a", required=True, type=Path, help="Path to first image")
    comp_parser.add_argument("--image-b", required=True, type=Path, help="Path to second image")
    comp_parser.add_argument("--brief", required=True, help="Comparison brief")

    # Rank
    rank_parser = subparsers.add_parser("rank", help="Rank multiple faces")
    rank_parser.add_argument("--images", required=True, nargs="+", type=Path, help="Paths to images")
    rank_parser.add_argument("--brief", required=True, help="Ranking brief")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    evaluator = GeminiEvaluator()

    try:
        if args.command == "describe":
            result = evaluator.describe(args.image, args.brief)
        elif args.command == "eval":
            brief = args.brief
            if args.brief_file:
                brief = args.brief_file.read_text()
            if not brief:
                print("Error: Must provide --brief or --brief-file")
                return
            result = evaluator.eval(args.image, brief)
        elif args.command == "compare":
            result = evaluator.compare(args.image_a, args.image_b, args.brief)
        elif args.command == "rank":
            result = evaluator.rank(args.images, args.brief)
        
        print(json.dumps(asdict(result), indent=2))
    except Exception as e:
        print(f"Error during execution: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
