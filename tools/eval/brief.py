from typing import List, Dict, Optional, Any
import json

AXIS_DESCRIPTIONS = {
    "alarm": {
        "positive": "alarmed/startled — wide eyes, tense brows, heightened alertness",
        "negative": "euphoric — warm, expansive, pleased"
    },
    "fatigue": {
        "positive": "wired — alert, evaluating, engaged",
        "negative": "exhausted — droopy, checked out, depleted"
    },
    "dominance": {
        "positive": "dominant/chad — strong jaw, forward chin, broad",
        "negative": "submissive/soyboi — receding chin, narrow"
    }
}

def axis_brief(axis: str, value: float, description: str) -> str:
    """Brief for axis sweep evaluation"""
    return f"Evaluate the 3D face for axis '{axis}' with value {value}. Expected expression: {description}"

def component_brief(component: str, value: float, bestiary_entry: Optional[Dict] = None) -> str:
    """Brief for A/B probing — describes baseline + delta"""
    desc = f"Testing component '{component}' at value {value}."
    if bestiary_entry:
        desc += f" Existing knowledge: {bestiary_entry.get('prose', '')}"
    return desc

def composite_brief(axes: Dict[str, float], descriptions: Dict[str, str]) -> str:
    """Brief for multi-axis validation"""
    desc_list = [f"{axis}({val}): {descriptions.get(axis, '')}" for axis, val in axes.items()]
    return f"Evaluate this composite face blending multiple axes:\n" + "\n".join(desc_list)

def census_brief(component: str, value: float) -> str:
    """Census brief — asks Gemini to DESCRIBE what it sees, not score it"""
    return f"""You are examining a 3D face with expression parameter {component} set to {value}.
All other parameters are at zero (neutral baseline).
Describe what you see in detail:
1. What emotion or state does this face convey?
2. Which parts of the face are most affected? (eyes, brows, mouth, nose, jaw, cheeks)
3. Is the expression symmetric left-to-right? Note any asymmetry.
4. Does the face look natural or distorted? At what point would you call it an artifact?
5. What real-world emotional state does this most resemble?
6. If you were casting this face in a scene, what role would it play?"""

def enrich_brief(brief: str, findings: List[Dict], bestiary_summary: str) -> str:
    """Add accumulated context to any brief"""
    enriched = brief + f"\n\nContext from Bestiary:\n{bestiary_summary}"
    if findings:
        enriched += f"\n\nPrevious findings: {json.dumps(findings)}"
    return enriched

def probe_brief(axis: str, component: str, bestiary_entry: Dict) -> str:
    """Brief for probing whether a component improves an axis"""
    return f"Evaluate if component '{component}' improves the axis '{axis}'. Bestiary entry for component: {bestiary_entry.get('prose', '')}"

def dose_brief(axis: str, component: str) -> str:
    """Brief for finding optimal weight of a component"""
    return f"Find the optimal dose (weight) for component '{component}' to maximize the '{axis}' effect without introducing artifacts."

def ingredient_brief(axis: str, recipe: List[Any], component: str, bestiary: Dict) -> str:
    """Brief for multi-ingredient composite testing"""
    return f"Evaluate component '{component}' as an ingredient in a recipe for '{axis}'. Recipe: {recipe}. Bestiary info: {json.dumps(bestiary)}"
