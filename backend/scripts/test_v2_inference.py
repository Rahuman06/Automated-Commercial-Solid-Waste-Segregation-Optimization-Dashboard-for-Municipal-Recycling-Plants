import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from PIL import Image
from app.services.model_inference import AIModelInferenceService

inf = AIModelInferenceService()
loaded = inf.load_checkpoint("models/checkpoints/v2.0.pt", "v2.0")
print(f"Loaded v2.0 checkpoint: {loaded}")

test_base = "data/processed_v2/test"
for cat in ["Biodegradable", "Cardboard", "E-Waste", "Glass", "Metal", "Paper", "Plastic"]:
    cat_dir = os.path.join(test_base, cat)
    if os.path.exists(cat_dir):
        files = [f for f in os.listdir(cat_dir) if f.endswith((".jpg", ".png"))]
        if files:
            img = Image.open(os.path.join(cat_dir, files[0]))
            pred = inf.predict(img)
            p_cat = pred["predicted_category"]
            p_conf = pred["confidence_pct"]
            p_box = pred["bounding_box"]
            print(f"Actual: {cat:<15} --> Predicted: {p_cat:<15} ({p_conf:>5.1f}%) Box: {p_box}")
