#!/usr/bin/env python3
"""FLAME parameter bestiary — encyclopedia of what each component does visually."""

import json
import os
import argparse
from dataclasses import dataclass, field, asdict
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple, Optional, Any

@dataclass 
class BestiaryEntry:
    component: str            # "psi3" or "beta7"
    component_type: str       # "expression" or "shape"
    positive_description: str
    negative_description: str
    symmetry_score: float     # 0-1
    symmetry_notes: str
    safe_range: Tuple[float, float]
    artifact_notes: str
    primary_face_region: str  # "mid-face"/"upper-face"/"lower-face"/"jaw"/"full-face"
    useful_for: List[str]
    interactions: Dict[str, str]
    current_recipes: List[str]
    prose: str
    renders_examined: int
    last_updated: str         # ISO timestamp
    confidence: str           # "low"/"medium"/"high"

BASE_DIR = Path("tools/eval/data/bestiary")

def get_path_for_component(component: str) -> Path:
    if component.startswith("psi"):
        subdir = BASE_DIR / "psi"
    elif component.startswith("beta"):
        subdir = BASE_DIR / "beta"
    else:
        subdir = BASE_DIR / "interactions"
    return subdir

def load_entry(component: str) -> Optional[BestiaryEntry]:
    path = get_path_for_component(component) / f"{component}.json"
    if not path.exists():
        return None
    with open(path, "r") as f:
        data = json.load(f)
        # Convert list back to tuple for safe_range
        data["safe_range"] = tuple(data["safe_range"])
        return BestiaryEntry(**data)

def save_entry(entry: BestiaryEntry):
    subdir = get_path_for_component(entry.component)
    subdir.mkdir(parents=True, exist_ok=True)
    
    json_path = subdir / f"{entry.component}.json"
    md_path = subdir / f"{entry.component}.md"
    
    entry.last_updated = datetime.now().isoformat()
    
    with open(json_path, "w") as f:
        json.dump(asdict(entry), f, indent=2)
    
    with open(md_path, "w") as f:
        f.write(f"# {entry.component} ({entry.component_type})\n\n")
        f.write(f"**Confidence:** {entry.confidence}  \n")
        f.write(f"**Region:** {entry.primary_face_region}  \n")
        f.write(f"**Symmetry:** {entry.symmetry_score} ({entry.symmetry_notes})  \n")
        f.write(f"**Safe Range:** {entry.safe_range[0]} to {entry.safe_range[1]}  \n\n")
        f.write(f"## Description\n{entry.prose}\n\n")
        f.write(f"### Positive (+): {entry.positive_description}\n")
        f.write(f"### Negative (-): {entry.negative_description}\n\n")
        f.write(f"## Artifacts\n{entry.artifact_notes}\n\n")
        f.write(f"## Useful For\n" + "\n".join(f"- {u}" for u in entry.useful_for) + "\n\n")
        f.write(f"## Interactions\n" + "\n".join(f"- **{k}:** {v}" for k, v in entry.interactions.items()) + "\n")

def update_entry(component: str, **kwargs):
    entry = load_entry(component)
    if not entry:
        raise ValueError(f"Entry {component} not found.")
    for k, v in kwargs.items():
        if hasattr(entry, k):
            setattr(entry, k, v)
    save_entry(entry)

def update_from_description(component: str, desc: Any):
    """Updates or creates an entry from a Gemini Description object."""
    entry = load_entry(component)
    if not entry:
        entry = BestiaryEntry(
            component=component,
            component_type="expression" if component.startswith("psi") else "shape",
            positive_description=desc.emotion_read,
            negative_description="",
            symmetry_score=desc.symmetry,
            symmetry_notes=desc.symmetry_notes,
            safe_range=(-3.0, 3.0),
            artifact_notes=desc.artifact_notes,
            primary_face_region=desc.affected_regions[0] if desc.affected_regions else "unknown",
            useful_for=desc.useful_for,
            interactions={},
            current_recipes=[],
            prose=desc.prose,
            renders_examined=1,
            last_updated="",
            confidence="medium"
        )
    else:
        entry.renders_examined += 1
        entry.prose = desc.prose
        entry.symmetry_score = (entry.symmetry_score + desc.symmetry) / 2
        # etc... (merging logic)
    save_entry(entry)

def query(region: str = None, exclude: List[str] = None, min_confidence: str = None, sort_by: str = None, limit: int = None) -> List[BestiaryEntry]:
    results = []
    for root, _, files in os.walk(BASE_DIR):
        for f in files:
            if f.endswith(".json"):
                comp = f.replace(".json", "")
                entry = load_entry(comp)
                if entry:
                    results.append(entry)
    
    if region:
        results = [r for r in results if r.primary_face_region == region]
    if exclude:
        results = [r for r in results if r.component not in exclude]
    if min_confidence:
        conf_levels = {"low": 0, "medium": 1, "high": 2}
        results = [r for r in results if conf_levels.get(r.confidence, 0) >= conf_levels.get(min_confidence, 0)]
    
    if sort_by:
        results.sort(key=lambda x: getattr(x, sort_by), reverse=True)
    if limit:
        results = results[:limit]
    
    return results

def add_recipe_note(component: str, recipe: str):
    entry = load_entry(component)
    if entry:
        if recipe not in entry.current_recipes:
            entry.current_recipes.append(recipe)
            save_entry(entry)

def add_dose_note(component: str, dose: float, note: str):
    entry = load_entry(component)
    if entry:
        entry.artifact_notes += f"\n- Dose {dose}: {note}"
        save_entry(entry)

def add_interaction(comp_a: str, comp_b: str, effect: str):
    entry_a = load_entry(comp_a)
    if entry_a:
        entry_a.interactions[comp_b] = effect
        save_entry(entry_a)
    entry_b = load_entry(comp_b)
    if entry_b:
        entry_b.interactions[comp_a] = effect
        save_entry(entry_b)

def get_summary() -> str:
    all_entries = query()
    psi_count = len([e for e in all_entries if e.component_type == "expression"])
    beta_count = len([e for e in all_entries if e.component_type == "shape"])
    return f"Bestiary: {len(all_entries)} entries ({psi_count} expression, {beta_count} shape)."

def rebuild_index():
    # Placeholder for indexing if needed
    pass

def main():
    parser = argparse.ArgumentParser(description="Bestiary CLI")
    subparsers = parser.add_subparsers(dest="command")

    p_query = subparsers.add_parser("query")
    p_query.add_argument("--region")
    p_query.add_argument("--min-confidence")

    p_show = subparsers.add_parser("show")
    p_show.add_argument("component")

    p_summary = subparsers.add_parser("summary")

    args = parser.parse_args()

    if args.command == "query":
        for entry in query(region=args.region, min_confidence=args.min_confidence):
            print(f"{entry.component}: {entry.prose[:100]}...")
    elif args.command == "show":
        entry = load_entry(args.component)
        if entry:
            print(json.dumps(asdict(entry), indent=2))
        else:
            print("Not found")
    elif args.command == "summary":
        print(get_summary())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
