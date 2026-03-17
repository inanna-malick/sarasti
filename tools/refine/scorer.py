try:
    import torch
    import clip
    from PIL import Image
except ImportError as e:
    raise ImportError("Missing required dependencies for scorer. Please install them with: pip install torch openai-clip Pillow") from e

import os

class QualityScorer:
    def __init__(self, device=None):
        if device is None:
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        else:
            self.device = device
            
        self.model, self.preprocess = clip.load("ViT-L/14", device=self.device)
        
        self.prompts = {
            "realism": ("a realistic 3D rendered human face with natural skin", "a distorted deformed artificial face"),
            "mouth": ("natural closed or slightly parted lips on a face", "mouth gaping wide open on a face"),
            "eyes": ("natural eyes with visible colored iris and proportional pupil", "tiny dot pupils with no visible iris"),
            "expression_mild": ("a face showing subtle concern or worry", "an expressionless blank face"),
            "expression_extreme": ("a face showing intense distress or shock", "a face with only mild expression")
        }
        
        self.texts = {}
        for key, (pos, neg) in self.prompts.items():
            tokens = clip.tokenize([pos, neg]).to(self.device)
            with torch.no_grad():
                features = self.model.encode_text(tokens)
                features /= features.norm(dim=-1, keepdim=True)
            self.texts[key] = features

    def score(self, image_path: str) -> dict[str, float]:
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
            
            for key, text_features in self.texts.items():
                probs = (100.0 * img_features @ text_features.T).softmax(dim=-1)
                scores[key] = float(probs[0, 0] - probs[0, 1])
                
        return scores
