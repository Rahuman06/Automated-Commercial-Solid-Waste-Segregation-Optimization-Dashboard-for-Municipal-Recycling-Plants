import os
import sys
import time
from PIL import Image

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.model_inference import inference_service

def test_inference():
    print("Testing Model Inference Service v5.0...")
    print(f"Active Version: {inference_service.active_version}")
    print(f"Model Path: {inference_service.model_path}")
    print(f"Device: {inference_service.device}")
    print(f"Class Names: {inference_service.class_names}")

    test_dir = os.path.join(backend_dir, "data", "processed_v5", "test")
    if not os.path.exists(test_dir):
        print(f"Test directory not found: {test_dir}")
        return

    print("\nRunning test predictions on sample images from each class:")
    for cat in inference_service.class_names:
        cat_dir = os.path.join(test_dir, cat)
        if not os.path.exists(cat_dir):
            continue
        files = [f for f in os.listdir(cat_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
        if not files:
            continue
        sample_img_path = os.path.join(cat_dir, files[0])
        img = Image.open(sample_img_path).convert("RGB")
        t0 = time.time()
        res = inference_service.predict(img)
        latency = (time.time() - t0) * 1000
        pred_cls = res["predicted_category"]
        conf = res["confidence"]
        status = "MATCH" if pred_cls == cat else "MISMATCH"
        print(f"  [{status}] True: {cat:<15} -> Pred: {pred_cls:<15} (Conf: {conf*100:.1f}%) | Latency: {latency:.1f}ms")

if __name__ == "__main__":
    test_inference()
