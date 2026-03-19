#!/usr/bin/env python3
"""Gemini Vision scorer for FLAME face renders."""

import json
import os
import sys
import argparse
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import List, Optional, Union

# Lazy import to allow module import without the package installed
def _get_model():
    import google.generativeai as genai
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        print("Error: GEMINI_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)
    genai.configure(api_key=key)
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    return genai.GenerativeModel(model_name)

@dataclass
class EvalResult:
    overall_score: int       # 1-10
    expression_accuracy: int # 1-10
    mesh_quality: int        # 1-10
    primary_issue: str
    preserve: list[str]      # what's working
    suggestions: list[str]
    feedback: str

@dataclass
class CompareResult:
    winner: str              # "A" or "B"
    confidence: float        # 0-1
    what_changed: str
    why_winner_is_better: str
    regressions: list[str]

@dataclass
class RankResult:
    ranking: list[int]       # indices best→worst
    best_index: int
    best_reason: str
    per_image_notes: list[str]
    sweet_spot_description: str

@dataclass
class Description:
    emotion_read: str
    affected_regions: list[str]
    symmetry: float          # 0-1
    symmetry_notes: str
    artifact_level: str      # "none"/"minor"/"moderate"/"severe"
    artifact_notes: str
    resembles: str
    useful_for: list[str]
    prose: str               # 3-5 sentence naturalist description

def upload_image(path: Union[str, Path]):
    import google.generativeai as genai
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")
    return genai.upload_file(str(path))

def _call_gemini_with_json(prompt: str, images: list, schema_class, retries=1):
    model = _get_model()
    import google.generativeai as genai
    
    contents = images + [prompt]
    
    for attempt in range(retries + 1):
        try:
            response = model.generate_content(
                contents,
                generation_config={"response_mime_type": "application/json"}
            )
            text = response.text
            # Find JSON if it's wrapped in markdown
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            return schema_class(**data)
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
                continue
            raise e

def describe(image_path: str, brief: Optional[str] = None) -> Description:
    """Describes a single face render."""
    img = upload_image(image_path)
    prompt = "Describe this 3D face render."
    if brief:
        prompt += f"\nContext: {brief}"
    prompt += "\nOutput JSON matching the Description schema."
    return _call_gemini_with_json(prompt, [img], Description)

def evaluate(image_path: str, brief: Optional[str] = None) -> EvalResult:
    """Evaluates a single face render against a target brief."""
    img = upload_image(image_path)
    prompt = "Evaluate this 3D face render."
    if brief:
        prompt += f"\nTarget: {brief}"
    prompt += "\nOutput JSON matching the EvalResult schema."
    return _call_gemini_with_json(prompt, [img], EvalResult)

def compare(path_a: str, path_b: str, brief: Optional[str] = None) -> CompareResult:
    """Compares two face renders (A and B)."""
    img_a = upload_image(path_a)
    img_b = upload_image(path_b)
    prompt = "Compare these two 3D face renders (Image A and Image B)."
    if brief:
        prompt += f"\nContext: {brief}"
    prompt += "\nOutput JSON matching the CompareResult schema."
    return _call_gemini_with_json(prompt, [img_a, img_b], CompareResult)

def rank(image_paths: List[str], brief: Optional[str] = None) -> RankResult:
    """Ranks multiple face renders from best to worst."""
    imgs = [upload_image(p) for p in image_paths]
    prompt = f"Rank these {len(image_paths)} 3D face renders from best to worst."
    if brief:
        prompt += f"\nContext: {brief}"
    prompt += "\nOutput JSON matching the RankResult schema. 'ranking' should be indices 0 to N-1."
    return _call_gemini_with_json(prompt, imgs, RankResult)

def main():
    parser = argparse.ArgumentParser(description="Gemini Vision scorer for FLAME face renders.")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Describe
    p_describe = subparsers.add_parser("describe", help="Describe a single render")
    p_describe.add_argument("image", help="Path to image")
    p_describe.add_argument("--brief", help="Optional context brief")

    # Eval
    p_eval = subparsers.add_parser("eval", help="Evaluate a single render")
    p_eval.add_argument("image", help="Path to image")
    p_eval.add_argument("--brief", help="Target brief to evaluate against")

    # Compare
    p_compare = subparsers.add_parser("compare", help="Compare two renders")
    p_compare.add_argument("image_a", help="Path to image A")
    p_compare.add_argument("image_b", help="Path to image B")
    p_compare.add_argument("--brief", help="Optional context brief")

    # Rank
    p_rank = subparsers.add_parser("rank", help="Rank multiple renders")
    p_rank.add_argument("images", nargs="+", help="Paths to images")
    p_rank.add_argument("--brief", help="Optional context brief")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    try:
        if args.command == "describe":
            res = describe(args.image, args.brief)
        elif args.command == "eval":
            res = evaluate(args.image, args.brief)
        elif args.command == "compare":
            res = compare(args.image_a, args.image_b, args.brief)
        elif args.command == "rank":
            res = rank(args.images, args.brief)
        
        print(json.dumps(asdict(res), indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
