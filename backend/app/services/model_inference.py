import os
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from typing import Dict, Any, List, Optional
import threading

class AIModelInferenceService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(AIModelInferenceService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model: Optional[nn.Module] = None
        self.class_names: List[str] = [
            "Biodegradable", "Cardboard", "E-Waste", "Glass", "Metal", "Paper", "Plastic"
        ]
        self.active_version = "v2.0"
        self.model_path = ""
        
        # Preprocessing normalization
        self.tensor_normalize = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        self.center_crop_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        # Load default model checkpoint (prefer v5.0, then v4.0, v3.0, v2.0, fallback to v1.0)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        v5_checkpoint = os.path.join(base_dir, "models", "checkpoints", "v5.0.pt")
        v4_checkpoint = os.path.join(base_dir, "models", "checkpoints", "v4.0.pt")
        v3_checkpoint = os.path.join(base_dir, "models", "checkpoints", "v3.0.pt")
        v2_checkpoint = os.path.join(base_dir, "models", "checkpoints", "v2.0.pt")
        v1_checkpoint = os.path.join(base_dir, "models", "checkpoints", "v1.0.pt")
        if os.path.exists(v5_checkpoint):
            target_checkpoint, target_ver = v5_checkpoint, "v5.0"
        elif os.path.exists(v4_checkpoint):
            target_checkpoint, target_ver = v4_checkpoint, "v4.0"
        elif os.path.exists(v3_checkpoint):
            target_checkpoint, target_ver = v3_checkpoint, "v3.0"
        elif os.path.exists(v2_checkpoint):
            target_checkpoint, target_ver = v2_checkpoint, "v2.0"
        else:
            target_checkpoint, target_ver = v1_checkpoint, "v1.0"
        self.load_checkpoint(target_checkpoint, version_name=target_ver)
        self._initialized = True

    @staticmethod
    def letterbox_image(image: Image.Image, target_size: int = 224) -> Image.Image:
        """
        Resizes image preserving original aspect ratio with neutral edge padding.
        Completely eliminates edge-cropping on 16:9 mobile and webcam video feeds.
        """
        w, h = image.size
        scale = target_size / max(w, h)
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        resized = image.resize((nw, nh), Image.BILINEAR)
        new_im = Image.new("RGB", (target_size, target_size), (128, 128, 128))
        new_im.paste(resized, ((target_size - nw) // 2, (target_size - nh) // 2))
        return new_im

    @staticmethod
    def estimate_saliency_bbox(image: Image.Image) -> List[float]:
        """
        Calculates foreground bounding box [ymin, xmin, ymax, xmax]
        using color/edge variance against camera background borders.
        """
        try:
            thumb = image.resize((64, 64)).convert("L")
            pixels = list(thumb.getdata())
            border_vals = []
            for x in range(64):
                border_vals.append(pixels[x])
                border_vals.append(pixels[63 * 64 + x])
            for y in range(64):
                border_vals.append(pixels[y * 64])
                border_vals.append(pixels[y * 64 + 63])
            bg = sum(border_vals) / len(border_vals)

            xs = []
            ys = []
            for y in range(64):
                for x in range(64):
                    if abs(pixels[y * 64 + x] - bg) > 22:
                        xs.append(x)
                        ys.append(y)

            if len(xs) > 40:
                xmin = max(0.05, min(xs) / 64.0 - 0.04)
                xmax = min(0.95, max(xs) / 64.0 + 0.04)
                ymin = max(0.05, min(ys) / 64.0 - 0.04)
                ymax = min(0.95, max(ys) / 64.0 + 0.04)
                return [round(ymin, 3), round(xmin, 3), round(ymax, 3), round(xmax, 3)]
        except Exception:
            pass
        return [0.16, 0.18, 0.84, 0.82]

    def load_checkpoint(self, checkpoint_path: str, version_name: str = "v2.0") -> bool:
        """
        Loads PyTorch checkpoint weights into memory on device (GPU / CPU).
        Reuses single persistent memory allocation for zero-overhead inference.
        """
        with self._lock:
            if not os.path.exists(checkpoint_path):
                print(f"[AIModelInferenceService] Checkpoint not found at {checkpoint_path}. Will initialize architecture with random weights.")
                net = models.mobilenet_v3_large(weights=None)
                in_f = net.classifier[0].in_features
                net.classifier = nn.Sequential(
                    nn.Linear(in_f, 512),
                    nn.Hardswish(),
                    nn.Dropout(p=0.3),
                    nn.Linear(512, len(self.class_names))
                )
                self.model = net.to(self.device).eval()
                self.active_version = version_name
                self.model_path = checkpoint_path
                return False

            try:
                print(f"[AIModelInferenceService] Loading weights from {checkpoint_path} onto {self.device}...")
                ckpt = torch.load(checkpoint_path, map_location=self.device)
                
                if "class_names" in ckpt:
                    self.class_names = ckpt["class_names"]
                elif "classes" in ckpt:
                    self.class_names = ckpt["classes"]
                
                num_classes = len(self.class_names)
                net = models.mobilenet_v3_large(weights=None)
                in_f = net.classifier[0].in_features
                net.classifier = nn.Sequential(
                    nn.Linear(in_f, 512),
                    nn.Hardswish(),
                    nn.Dropout(p=0.3),
                    nn.Linear(512, num_classes)
                )
                
                # Load state dict
                if "model_state_dict" in ckpt:
                    net.load_state_dict(ckpt["model_state_dict"])
                else:
                    net.load_state_dict(ckpt)
                
                self.model = net.to(self.device).eval()
                self.active_version = ckpt.get("version", version_name)
                self.model_path = checkpoint_path
                print(f"[AIModelInferenceService] Model {self.active_version} loaded successfully on {self.device} ({num_classes} classes).")
                return True
            except Exception as e:
                print(f"[AIModelInferenceService] Error loading checkpoint: {e}")
                return False

    def predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Executes actual neural network forward pass using PyTorch.
        Uses Multi-Scale Test-Time Augmentation (TTA) with Letterbox + CenterCrop
        to deliver high accuracy on wide mobile and webcam video feeds.
        """
        if self.model is None:
            raise RuntimeError("AI Model is not loaded.")

        rgb_image = image.convert("RGB")

        # View 1: Aspect-preserving letterbox view (captures full widescreen object)
        v1 = self.letterbox_image(rgb_image, 224)
        t1 = self.tensor_normalize(v1).unsqueeze(0)

        # View 2: Center crop view (captures zoomed interior textures)
        t2 = self.center_crop_transform(rgb_image).unsqueeze(0)

        # Batch forward pass
        batch_input = torch.cat([t1, t2], dim=0).to(self.device)

        with torch.no_grad():
            if torch.cuda.is_available() and self.device.type == "cuda":
                with torch.amp.autocast('cuda'):
                    outputs = self.model(batch_input)
            else:
                outputs = self.model(batch_input)

            # Ensemble probabilities across wide and close-up views
            probabilities = torch.softmax(outputs, dim=1).mean(dim=0)
            top_prob, top_idx = torch.topk(probabilities, k=min(3, len(self.class_names)))

        predicted_class = self.class_names[top_idx[0].item()]
        confidence = float(top_prob[0].item())

        # Top 3 candidates
        candidates = []
        for i in range(len(top_idx)):
            candidates.append({
                "class_name": self.class_names[top_idx[i].item()],
                "confidence": round(float(top_prob[i].item()), 4),
                "confidence_pct": round(float(top_prob[i].item()) * 100, 1)
            })

        status = "High Confidence" if confidence >= 0.80 else ("Moderate Confidence" if confidence >= 0.55 else "Low Confidence - Flagged for Review")
        
        # Dynamic foreground saliency bounding box
        bbox = self.estimate_saliency_bbox(rgb_image)

        return {
            "predicted_category": predicted_class,
            "detected_item": predicted_class,
            "confidence": round(confidence, 4),
            "confidence_pct": round(confidence * 100, 1),
            "status": status,
            "candidates": candidates,
            "bounding_box": bbox,
            "model_version": self.active_version,
            "hardware_device": str(self.device),
            "is_low_confidence": confidence < 0.55
        }

# Global singleton accessor
inference_service = AIModelInferenceService()
