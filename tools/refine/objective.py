try:
    from scorer import QualityScorer
    from ipc import RenderBridge
except ImportError:
    class QualityScorer:
        def score(self, image_data, scenario="neutral"):
            return {"quality": 0.8, "eyes": 0.8, "state": 0.8, "artifact_penalty": 0.1}

    class RenderBridge:
        def render(self, config):
            return b"mock_image_data"
        def close(self):
            pass

def evaluate(overrides: dict, bridge, scorer, ticker_id: str = "BRENT") -> float:
    scenarios = {
        "neutral": {"deviation": 0.0, "velocity": 0.0, "volatility": 1.0},
        "mild_crisis": {"deviation": -0.1, "velocity": -0.05, "volatility": 1.5},
        "extreme_crisis": {"deviation": -0.2, "velocity": -0.15, "volatility": 2.5},
        "shock_spike": {"deviation": 0.15, "velocity": 0.1, "volatility": 2.0},
    }

    scores = {}
    for name, state in scenarios.items():
        config = {"tickerId": ticker_id, "overrides": overrides, "frame": state}
        image = bridge.render(config)
        if image:
            # Pass scenario name so scorer uses state-appropriate CLIP prompt
            s = scorer.score(image, scenario=name)
        else:
            s = {"quality": 0.0, "eyes": 0.0, "state": 0.0, "artifact_penalty": 0.0}
        scores[name] = s

    def quality(s):
        return s.get("quality", 0.0) + s.get("eyes", 0.0)

    neutral_q = quality(scores["neutral"])
    mild_q = quality(scores["mild_crisis"])
    extreme_q = quality(scores["extreme_crisis"])
    shock_q = quality(scores["shock_spike"])

    # Dynamic range: the visual DIFFERENCE between neutral and crisis states.
    # A face that looks the same at all crisis levels is useless for data-viz
    # regardless of absolute quality.
    dynamic_range = ((extreme_q - neutral_q) + (shock_q - neutral_q)) / 2.0

    # Weights: crisis states dominate because that's where the piece lives.
    # Neutral is baseline. Dynamic range is rewarded explicitly so the optimizer
    # can't collapse all states toward the same calm-face optimum.
    objective_value = (
        0.15 * neutral_q +
        0.25 * mild_q +
        0.35 * (extreme_q + shock_q) / 2.0 +
        0.25 * dynamic_range
    )

    return -objective_value
