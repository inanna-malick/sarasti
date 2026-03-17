try:
    from scorer import QualityScorer
    from ipc import RenderBridge
except ImportError:
    class QualityScorer:
        def score(self, image_data):
            return {"realism": 0.8, "mouth": 0.8, "eyes": 0.8, "overall": 0.8}

    class RenderBridge:
        def render(self, overrides, state):
            return b"mock_image_data"
        def close(self):
            pass

def evaluate(overrides: dict, bridge, scorer) -> float:
    scenarios = {
        "neutral": {"deviation": 0.0, "velocity": 0.0, "volatility": 1.0},
        "mild_crisis": {"deviation": -0.1, "velocity": -0.05, "volatility": 1.5},
        "extreme_crisis": {"deviation": -0.2, "velocity": -0.15, "volatility": 2.5},
        "shock_spike": {"deviation": 0.15, "velocity": 0.1, "volatility": 2.0},
    }

    scores = {}
    for name, state in scenarios.items():
        image = bridge.render(overrides, state)
        if image:
            s = scorer.score(image)
        else:
            s = {"realism": 0.0, "mouth": 0.0, "eyes": 0.0, "overall": 0.0}
        scores[name] = s
        
    def get_q(s):
        return s.get("realism", 0.0) + s.get("mouth", 0.0) + s.get("eyes", 0.0)
        
    neutral_quality = get_q(scores["neutral"])
    extreme_quality = get_q(scores["extreme_crisis"])
    shock_quality = get_q(scores["shock_spike"])
    mild_quality = get_q(scores["mild_crisis"])
    
    crisis_quality = (extreme_quality + shock_quality) / 2.0
    dynamic_range = get_q(scores["extreme_crisis"]) - get_q(scores["neutral"])
    mild_expression_at_mild_crisis = mild_quality
    
    objective_value = (
        3.0 * neutral_quality +
        2.0 * crisis_quality +
        1.5 * dynamic_range +
        1.0 * mild_expression_at_mild_crisis
    )
    
    return -objective_value
