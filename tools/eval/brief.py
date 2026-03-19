#!/usr/bin/env python3
"""Brief generation templates for Gemini evaluation."""

from typing import List, Dict, Optional, Any

AXIS_DESCRIPTIONS = {
    "alarm+": "alarmed/startled — wide eyes, tense brows, heightened alertness",
    "alarm-": "euphoric — warm, expansive, pleased",
    "fatigue+": "wired — alert, evaluating, engaged",
    "fatigue-": "exhausted — droopy, checked out, depleted",
    "dominance+": "dominant — strong jaw, forward chin, broad",
    "dominance-": "submissive — receding chin, narrow",
}

def axis_brief(axis: str, value: float, description: Optional[str] = None) -> str:
    """Brief for axis sweep evaluation."""
    desc = description or AXIS_DESCRIPTIONS.get(axis, f"Axis {axis}")
    return f"Evaluating 3D face on axis '{axis}' with magnitude {value}. Target state: {desc}"

def component_brief(component: str, value: float, bestiary_entry: Optional[Any] = None) -> str:
    """Brief for A/B probing of a single component."""
    entry_info = f" (Known as: {bestiary_entry.prose})" if bestiary_entry else ""
    return f"Probing component '{component}' at weight {value}{entry_info}."

def composite_brief(axes: List[str], descriptions: List[str]) -> str:
    """Brief for multi-axis validation."""
    items = [f"- {axis}: {desc}" for axis, desc in zip(axes, descriptions)]
    return "Validating composite expression with the following targets:\n" + "\n".join(items)

def census_brief(component: str, value: float) -> str:
    """Asks Gemini to DESCRIBE (not score)."""
    return (
        f"You are examining a 3D face with expression parameter {component} set to {value}. "
        "All other parameters are at zero (neutral baseline). Describe: "
        "1. emotion/state 2. affected face parts 3. symmetry 4. natural vs distorted "
        "5. real-world resemblance 6. casting role"
    )

def enrich_brief(brief: str, findings: List[str], bestiary_summary: Optional[str] = None) -> str:
    """Adds accumulated context to a brief."""
    context = []
    if bestiary_summary:
        context.append(f"Historical knowledge: {bestiary_summary}")
    if findings:
        context.append("Current findings:\n" + "\n".join(f"- {f}" for f in findings))
    
    return f"{brief}\n\nAdditional context:\n" + "\n".join(context)

def probe_brief(axis: str, component: str, bestiary_entry: Optional[Any] = None) -> str:
    """Brief for probing a component against a specific axis."""
    axis_desc = AXIS_DESCRIPTIONS.get(axis, axis)
    comp_desc = f" ({bestiary_entry.prose})" if bestiary_entry else ""
    return f"Probing how component '{component}'{comp_desc} contributes to the '{axis}' axis ({axis_desc})."

def dose_brief(axis: str, component: str) -> str:
    """Brief for finding optimal weight of a component for an axis."""
    axis_desc = AXIS_DESCRIPTIONS.get(axis, axis)
    return f"Finding the 'sweet spot' dose for component '{component}' to best represent axis '{axis}' ({axis_desc})."

def ingredient_brief(axis: str, recipe: List[str], component: str, bestiary: Optional[Any] = None) -> str:
    """Brief for multi-ingredient testing."""
    axis_desc = AXIS_DESCRIPTIONS.get(axis, axis)
    recipe_list = ", ".join(recipe)
    return (
        f"Testing ingredient '{component}' as part of a recipe [{recipe_list}] "
        f"to achieve the '{axis}' state ({axis_desc})."
    )
