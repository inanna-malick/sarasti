try:
    import torch
    import clip
    from PIL import Image
except ImportError as e:
    raise ImportError("Missing required dependencies for scorer. Please install them with: pip install torch openai-clip Pillow") from e

import os

# Scenario-matched prompts: each describes what the face SHOULD depict at this
# crisis level. The target is exaggerated-but-well-rendered data-viz caricature,
# not photorealism. CLIP rewards expressive faces that match the intended state.
SCENARIO_PROMPTS = {
    "neutral": "a well-rendered 3D face with a calm composed expression",
    "mild_crisis": "a well-rendered 3D face showing visible concern and tension",
    "extreme_crisis": "a dramatic expressive 3D face showing intense anguish and distress",
    "shock_spike": "a dramatic expressive 3D face with wide eyes and open mouth in shock",
    "calm_recovery": "a well-rendered 3D face with cautious hopeful relief",
}

# Negative prompts — penalty for mesh artifacts and uncanny valley.
NEGATIVE_PROMPTS = [
    "a broken distorted 3D mesh with artifacts and holes",
    "a face with self-intersecting geometry and clipping",
    "a blurry low-quality render with aliasing artifacts",
]

NEGATIVE_WEIGHT = 0.3

# Structural quality prompts (scenario-independent)
STRUCTURAL_PROMPTS = {
    "eyes": (
        "expressive eyes with visible colored iris and clear pupil",
        "tiny dot pupils with no visible iris on a flat face",
    ),
}

DEFAULT_SCENARIO = "neutral"


class QualityScorer:
    def __init__(self, device=None):
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device

        self.model, self.preprocess = clip.load("ViT-L/14", device=self.device)

        # Pre-encode scenario-matched positive prompts
        self.scenario_features = {}
        for scenario, prompt in SCENARIO_PROMPTS.items():
            tokens = clip.tokenize([prompt]).to(self.device)
            with torch.no_grad():
                features = self.model.encode_text(tokens)
                features /= features.norm(dim=-1, keepdim=True)
            self.scenario_features[scenario] = features

        # Pre-encode negative prompts
        neg_tokens = clip.tokenize(NEGATIVE_PROMPTS).to(self.device)
        with torch.no_grad():
            self.negative_features = self.model.encode_text(neg_tokens)
            self.negative_features /= self.negative_features.norm(dim=-1, keepdim=True)

        # Pre-encode structural quality prompts
        self.structural_features = {}
        for key, (pos, neg) in STRUCTURAL_PROMPTS.items():
            tokens = clip.tokenize([pos, neg]).to(self.device)
            with torch.no_grad():
                features = self.model.encode_text(tokens)
                features /= features.norm(dim=-1, keepdim=True)
            self.structural_features[key] = features

    def score(self, image_path: str, scenario: str = DEFAULT_SCENARIO) -> dict[str, float]:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        try:
            img = Image.open(image_path).convert("RGB")
        except Exception as e:
            raise RuntimeError(f"Error loading image {image_path}: {e}")

        img_input = self.preprocess(img).unsqueeze(0).to(self.device)

        scores = {}
        with torch.no_grad():
            img_features = self.model.encode_image(img_input)
            img_features /= img_features.norm(dim=-1, keepdim=True)

            # State-appropriate score: does the render match the intended expression?
            scenario_key = scenario if scenario in self.scenario_features else DEFAULT_SCENARIO
            state_sim = float(img_features @ self.scenario_features[scenario_key].T)
            scores["state"] = state_sim

            # Artifact penalty: average similarity to negative prompts
            neg_sims = (img_features @ self.negative_features.T).squeeze(0)
            artifact_penalty = float(neg_sims.mean())
            scores["artifact_penalty"] = artifact_penalty

            # Net quality: state-appropriate expression minus artifact penalty
            scores["quality"] = state_sim - NEGATIVE_WEIGHT * artifact_penalty

            # Structural: eyes quality (scenario-independent)
            for key, text_features in self.structural_features.items():
                probs = (100.0 * img_features @ text_features.T).softmax(dim=-1)
                scores[key] = float(probs[0, 0] - probs[0, 1])

        return scores
