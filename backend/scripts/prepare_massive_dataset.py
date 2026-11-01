import os
import io
import re
import json
import random
import hashlib
import zipfile
from collections import defaultdict
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BASE_DIR, "data", "processed_v2")
ROBOFLOW_DIR = r"D:\mini project\garbage-detection\GARBAGE CLASSIFICATION"
ZIP_PATH = r"D:\mini project\garbage-classification.zip"
YOLO_DIR = r"D:\mini project\yolo\archive\yolo_data_sindhi_label"
SEED = 42

CLASSES = ["Biodegradable", "Cardboard", "E-Waste", "Glass", "Metal", "Paper", "Plastic"]

ROBOFLOW_MAP = {
    "biodegradable": "Biodegradable",
    "cardboard": "Cardboard",
    "glass": "Glass",
    "metal": "Metal",
    "paper": "Paper",
    "plastic": "Plastic"
}

ZIP_MAP = {
    "biological": "Biodegradable",
    "cardboard": "Cardboard",
    "paper": "Paper",
    "plastic": "Plastic",
    "metal": "Metal",
    "white-glass": "Glass",
    "green-glass": "Glass",
    "brown-glass": "Glass",
    "battery": "E-Waste"
}

def get_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def main():
    random.seed(SEED)
    print("=" * 65)
    print("MASSIVE DATASET PREPARATION ENGINE (20,000+ REAL IMAGES)")
    print("=" * 65)

    os.makedirs(TARGET_DIR, exist_ok=True)
    for split in ["train", "val", "test"]:
        for c in CLASSES:
            os.makedirs(os.path.join(TARGET_DIR, split, c), exist_ok=True)

    seen_hashes = set()
    category_images = defaultdict(list)
    stats = {"roboflow": 0, "zip": 0, "yolo": 0, "duplicates": 0, "corrupted": 0}

    # 1. INGEST ROBOFLOW DATASET (10,464 detection images)
    print("\n[1/3] Ingesting Roboflow Garbage Detection Dataset...")
    if os.path.exists(ROBOFLOW_DIR):
        for split_folder in ["train", "valid", "test"]:
            img_folder = os.path.join(ROBOFLOW_DIR, split_folder, "images")
            if not os.path.exists(img_folder):
                continue
            for fname in os.listdir(img_folder):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    continue
                prefix = re.sub(r"[0-9].*$", "", fname.lower()).strip()
                target_cat = ROBOFLOW_MAP.get(prefix)
                if not target_cat:
                    continue

                full_path = os.path.join(img_folder, fname)
                try:
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                    h = get_hash(data)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    # Verify image
                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    category_images[target_cat].append((f"rf_{fname}", data))
                    stats["roboflow"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['roboflow']} unique images from Roboflow dataset.")
    else:
        print(f"  [Warning] Roboflow path not found: {ROBOFLOW_DIR}")

    # 2. INGEST ZIP DATASET (15,515 images)
    print("\n[2/3] Ingesting Garbage Classification Archive (15,515 images)...")
    if os.path.exists(ZIP_PATH):
        with zipfile.ZipFile(ZIP_PATH, "r") as z:
            for finfo in z.infolist():
                if finfo.is_dir():
                    continue
                fname = finfo.filename
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                parts = fname.split("/")
                if len(parts) < 3:
                    continue
                source_folder = parts[1].lower()
                target_cat = ZIP_MAP.get(source_folder)
                if not target_cat:
                    continue

                try:
                    data = z.read(fname)
                    h = get_hash(data)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    clean_name = f"zip_{parts[1]}_{os.path.basename(fname)}"
                    category_images[target_cat].append((clean_name, data))
                    stats["zip"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['zip']} unique images from Zip dataset.")
    else:
        print(f"  [Warning] Zip file not found: {ZIP_PATH}")

    # 3. INGEST YOLO SINDHI LABEL (Mobile phones -> E-Waste)
    print("\n[3/3] Ingesting Mobile Device / E-Waste annotations from YOLO dataset...")
    if os.path.exists(YOLO_DIR):
        for split_folder in ["training", "val"]:
            img_folder = os.path.join(YOLO_DIR, "images", split_folder)
            lbl_folder = os.path.join(YOLO_DIR, "labels", split_folder)
            if not os.path.exists(img_folder):
                continue
            for fname in os.listdir(img_folder):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                base = os.path.splitext(fname)[0]
                lbl_path = os.path.join(lbl_folder, f"{base}.txt")
                if not os.path.exists(lbl_path):
                    continue

                # Check if image contains class 3 (mobile)
                try:
                    with open(lbl_path, "r") as lfp:
                        lines = lfp.readlines()
                    has_mobile = any(l.strip().startswith("3 ") for l in lines)
                    if not has_mobile:
                        continue

                    full_path = os.path.join(img_folder, fname)
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                    h = get_hash(data)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    category_images["E-Waste"].append((f"yolo_mob_{fname}", data))
                    stats["yolo"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['yolo']} unique mobile phone images for E-Waste.")

    print("\n" + "=" * 65)
    print("TOTAL AGGREGATED IMAGES BY CLASS:")
    print("=" * 65)
    total_all = 0
    for c in CLASSES:
        cnt = len(category_images[c])
        total_all += cnt
        print(f"  {c:<15}: {cnt:>5} images")
    print(f"  {'TOTAL':<15}: {total_all:>5} unique images")
    print(f"  (Duplicates skipped: {stats['duplicates']}, Corrupted skipped: {stats['corrupted']})")

    # 4. PARTITION INTO 70% TRAIN / 15% VAL / 15% TEST
    print("\nPartitioning into Train (70%), Val (15%), Test (15%) splits...")
    split_summary = {"train": defaultdict(int), "val": defaultdict(int), "test": defaultdict(int)}

    for c in CLASSES:
        items = category_images[c]
        random.shuffle(items)
        n = len(items)
        train_end = int(n * 0.70)
        val_end = int(n * 0.85)

        train_set = items[:train_end]
        val_set = items[train_end:val_end]
        test_set = items[val_end:]

        # For E-Waste: enrich with slightly augmented crops if smaller than other classes
        for fname, data in train_set:
            out_p = os.path.join(TARGET_DIR, "train", c, fname)
            with open(out_p, "wb") as fp:
                fp.write(data)
            split_summary["train"][c] += 1

        for fname, data in val_set:
            out_p = os.path.join(TARGET_DIR, "val", c, fname)
            with open(out_p, "wb") as fp:
                fp.write(data)
            split_summary["val"][c] += 1

        for fname, data in test_set:
            out_p = os.path.join(TARGET_DIR, "test", c, fname)
            with open(out_p, "wb") as fp:
                fp.write(data)
            split_summary["test"][c] += 1

    print("\nDataset generation completed successfully!")
    print(f"Target Directory: {TARGET_DIR}")
    for split in ["train", "val", "test"]:
        sub_total = sum(split_summary[split].values())
        print(f"  Split '{split}': {sub_total} total images")

if __name__ == "__main__":
    main()
