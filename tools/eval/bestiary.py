from dataclasses import dataclass, field, asdict
import json
import os
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Tuple, Any

@dataclass
class BestiaryEntry:
    component: str               # "psi3" or "beta7"
    component_type: str          # "expression" or "shape"
    positive_description: str    # what positive values look like
    negative_description: str    # what negative values look like
    symmetry_score: float        # 0-1, 1.0 = perfectly bilateral
    symmetry_notes: str
    safe_range: Tuple[float, float]  # before artifacts
    artifact_notes: str
    primary_face_region: str     # "mid-face"/"upper-face"/"lower-face"/"jaw"/"full-face"
    useful_for: List[str]
    interactions: Dict[str, str]
    current_recipes: List[str]
    prose: str                   # full naturalist description
    renders_examined: int
    last_updated: str            # ISO timestamp
    confidence: str              # "low"/"medium"/"high"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BestiaryEntry":
        # Handle tuple conversion if needed
        if "safe_range" in data and isinstance(data["safe_range"], list):
            data["safe_range"] = tuple(data["safe_range"])
        return cls(**data)

class Bestiary:
    def __init__(self, data_dir: str = "tools/eval/data/bestiary"):
        self.data_dir = Path(data_dir)
        self.index_path = self.data_dir / "index.json"
        self.psi_dir = self.data_dir / "psi"
        self.beta_dir = self.data_dir / "beta"
        self.interactions_dir = self.data_dir / "interactions"

    def _get_path(self, component: str) -> Path:
        if component.startswith("psi"):
            return self.psi_dir / f"{component}.json"
        elif component.startswith("beta"):
            return self.beta_dir / f"{component}.json"
        else:
            raise ValueError(f"Unknown component type for {component}")

    def load_entry(self, component: str) -> Optional[BestiaryEntry]:
        path = self._get_path(component)
        if not path.exists():
            return None
        with open(path, "r") as f:
            return BestiaryEntry.from_dict(json.load(f))

    def save_entry(self, entry: BestiaryEntry):
        path = self._get_path(entry.component)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        data = asdict(entry)
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
        
        # Also write .md
        md_path = path.with_suffix(".md")
        with open(md_path, "w") as f:
            f.write(f"""# Bestiary Entry: {entry.component}

**Type:** {entry.component_type}
**Region:** {entry.primary_face_region}
**Confidence:** {entry.confidence}

## Description
{entry.prose}

**Positive:** {entry.positive_description}
**Negative:** {entry.negative_description}

**Symmetry:** {entry.symmetry_score} ({entry.symmetry_notes})
**Safe Range:** {entry.safe_range}
**Artifacts:** {entry.artifact_notes}

**Useful For:** {', '.join(entry.useful_for)}

**Interactions:** {entry.interactions}
**Recipes:** {entry.current_recipes}

**Updated:** {entry.last_updated} ({entry.renders_examined} renders)
""")
        
        self.rebuild_index()

    def update_entry(self, component: str, updates: Dict[str, Any]):
        entry = self.load_entry(component)
        if not entry:
            # Create a shell entry if it doesn't exist
            entry = BestiaryEntry(
                component=component,
                component_type="expression" if component.startswith("psi") else "shape",
                positive_description="",
                negative_description="",
                symmetry_score=1.0,
                symmetry_notes="",
                safe_range=(-5.0, 5.0),
                artifact_notes="",
                primary_face_region="unknown",
                useful_for=[],
                interactions={},
                current_recipes=[],
                prose="",
                renders_examined=0,
                last_updated="",
                confidence="low"
            )
        
        for key, value in updates.items():
            if hasattr(entry, key):
                setattr(entry, key, value)
        
        entry.renders_examined += 1
        entry.last_updated = datetime.now().isoformat()
        self.save_entry(entry)

    def update_from_description(self, component: str, desc: Any, value: float):
        # desc is an instance of Description from gemini.py
        updates = {
            "prose": desc.prose,
            "symmetry_score": desc.symmetry,
            "symmetry_notes": desc.symmetry_notes,
            "artifact_notes": desc.artifact_notes,
            "useful_for": desc.useful_for
        }
        if value > 0:
            updates["positive_description"] = desc.emotion_read
        else:
            updates["negative_description"] = desc.emotion_read
        
        # Infer region if possible
        if desc.affected_regions:
            # Simple heuristic
            regions = [r.lower() for r in desc.affected_regions]
            if any(r in ["brows", "eyes"] for r in regions):
                updates["primary_face_region"] = "upper-face"
            elif any(r in ["mouth", "lips", "cheeks"] for r in regions):
                updates["primary_face_region"] = "mid-face"
            elif any(r in ["jaw", "chin"] for r in regions):
                updates["primary_face_region"] = "jaw"

        self.update_entry(component, updates)

    def query(self, region=None, exclude=None, min_confidence=None, sort_by=None, limit=None) -> List[BestiaryEntry]:
        if not self.index_path.exists():
            self.rebuild_index()
        
        if not self.index_path.exists():
            return []
            
        with open(self.index_path, "r") as f:
            index_data = json.load(f)
            entries_summary = index_data.get("entries", [])
        
        results = []
        for summary in entries_summary:
            comp = summary["component"]
            entry = self.load_entry(comp)
            if not entry: continue
            
            if region and entry.primary_face_region != region: continue
            if exclude and comp in exclude: continue
            if min_confidence:
                conf_levels = {"low": 0, "medium": 1, "high": 2}
                if conf_levels.get(entry.confidence, 0) < conf_levels.get(min_confidence, 0):
                    continue
            
            results.append(entry)
        
        if sort_by:
            results.sort(key=lambda x: getattr(x, sort_by), reverse=True)
        
        if limit:
            results = results[:limit]
            
        return results

    def add_recipe_note(self, component: str, axis: str, note: str):
        self.update_entry(component, {"current_recipes": [f"{axis}: {note}"]})

    def add_dose_note(self, component: str, axis: str, optimal_weight: float):
        self.update_entry(component, {"useful_for": [f"optimal_{axis}_{optimal_weight}"]})

    def add_interaction(self, comp_a: str, comp_b: str, notes: str):
        entry_a = self.load_entry(comp_a)
        if entry_a:
            entry_a.interactions[comp_b] = notes
            self.save_entry(entry_a)
        
        entry_b = self.load_entry(comp_b)
        if entry_b:
            entry_b.interactions[comp_a] = notes
            self.save_entry(entry_b)
            
        # Also save to separate interactions file
        pair = sorted([comp_a, comp_b])
        filename = f"{pair[0]}_{pair[1]}.json"
        with open(self.interactions_dir / filename, "w") as f:
            json.dump({"pair": pair, "notes": notes, "updated": datetime.now().isoformat()}, f, indent=2)

    def get_summary(self) -> str:
        entries = self.query(limit=20)
        lines = ["# Bestiary Summary\n"]
        for e in entries:
            lines.append(f"- **{e.component}**: {e.prose[:100]}...")
        return "\n".join(lines)

    def rebuild_index(self):
        entries = []
        for d in [self.psi_dir, self.beta_dir]:
            if not d.exists(): continue
            for f in d.glob("*.json"):
                with open(f, "r") as j:
                    data = json.load(j)
                    entries.append({
                        "component": data["component"],
                        "type": data["component_type"],
                        "region": data["primary_face_region"],
                        "confidence": data["confidence"]
                    })
        
        index_data = {
            "entries": entries,
            "count": len(entries),
            "last_rebuild": datetime.now().isoformat()
        }
        with open(self.index_path, "w") as f:
            json.dump(index_data, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="FLAME Bestiary Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Query
    query_parser = subparsers.add_parser("query", help="Query bestiary")
    query_parser.add_argument("--region", help="Filter by region")
    query_parser.add_argument("--min-confidence", help="Minimum confidence level")
    query_parser.add_argument("--limit", type=int, default=10, help="Limit results")

    # Show
    show_parser = subparsers.add_parser("show", help="Show entry details")
    show_parser.add_argument("component", help="Component ID (e.g. psi3)")

    # Summary
    subparsers.add_parser("summary", help="Show summary")

    args = parser.parse_args()
    bestiary = Bestiary()

    if args.command == "query":
        results = bestiary.query(region=args.region, min_confidence=args.min_confidence, limit=args.limit)
        for r in results:
            print(f"{r.component} [{r.primary_face_region}]: {r.prose[:100]}...")
    elif args.command == "show":
        entry = bestiary.load_entry(args.component)
        if entry:
            print(json.dumps(asdict(entry), indent=2))
        else:
            print(f"Component {args.component} not found.")
    elif args.command == "summary":
        print(bestiary.get_summary())
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
