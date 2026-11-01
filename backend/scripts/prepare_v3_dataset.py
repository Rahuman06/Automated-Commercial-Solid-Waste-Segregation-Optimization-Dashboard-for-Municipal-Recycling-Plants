import os
import io
import re
import glob
import random
import hashlib
import zipfile
from collections import defaultdict
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BASE_DIR, "data", "processed_v3")
SEED = 42

CLASSES = ["Biodegradable", "Cardboard", "E-Waste", "Glass", "Metal", "Paper", "Plastic"]

# Dataset 1: mostafaabla/garbage-classification (zip)
ZIP_PATH = r"D:\mini project\garbage-classification.zip"
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

# Dataset 2: Roboflow detection dataset
ROBOFLOW_DIR = r"D:\mini project\garbage-detection\GARBAGE CLASSIFICATION"
ROBOFLOW_MAP = {
    "biodegradable": "Biodegradable",
    "cardboard": "Cardboard",
    "glass": "Glass",
    "metal": "Metal",
    "paper": "Paper",
    "plastic": "Plastic"
}

# Dataset 3: asdasdasasdas/garbage-classification (kagglehub cache)
ASDASDAS_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\asdasdasasdas\garbage-classification\versions\2\Garbage classification\Garbage classification"
ASDASDAS_MAP = {
    "cardboard": "Cardboard",
    "glass": "Glass",
    "metal": "Metal",
    "paper": "Paper",
    "plastic": "Plastic"
}

# Dataset 4: phenomsg/waste-classification (kagglehub cache)
PHENOMSG_BASE = r"C:\Users\tmpra\.cache\kagglehub\datasets\phenomsg\waste-classification"

# Dataset 5: yolo mobile dataset (phone labels -> E-Waste)
YOLO_DIR = r"D:\mini project\yolo\archive\yolo_data_sindhi_label"

def get_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def classify_phenomsg_path(path_str: str):
    """
    Map subfolder paths in phenomsg/waste-classification to target classes.
    """
    lower = path_str.lower().replace("\\", "/")
    if "batter" in lower or "e-waste" in lower or "electronic" in lower:
        return "E-Waste"
    if ("food" in lower or "green-waste" in lower or "organic" in lower 
        or "coffee" in lower or "egg" in lower or "kitchen" in lower or "yard" in lower):
        return "Biodegradable"
    if "cardboard" in lower or "carton" in lower:
        return "Cardboard"
    if "glass" in lower:
        return "Glass"
    if "metal" in lower or "can" in lower or "tin" in lower:
        return "Metal"
    if "paper" in lower:
        return "Paper"
    if ("plastic" in lower or "platic" in lower or "wrapper" in lower 
        or "stroform" in lower or "styrofoam" in lower or "food-cup" in lower):
        return "Plastic"
    return None

def main():
    random.seed(SEED)
    print("=" * 70)
    print("V3.0 MEGA-DATASET AGGREGATION & CURATION ENGINE (35,000+ REAL IMAGES)")
    print("=" * 70)

    os.makedirs(TARGET_DIR, exist_ok=True)
    for split in ["train", "val", "test"]:
        for c in CLASSES:
            os.makedirs(os.path.join(TARGET_DIR, split, c), exist_ok=True)

    seen_hashes = set()
    category_images = defaultdict(list)
    stats = defaultdict(int)

    # 1. INGEST ROBOFLOW GARBAGE DETECTION (10,464 images)
    print("\n[1/5] Ingesting Roboflow Garbage Detection Dataset...")
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

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    category_images[target_cat].append((f"rf_{fname}", data))
                    stats["roboflow"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['roboflow']} unique images from Roboflow.")
    else:
        print(f"  [Warning] Roboflow directory missing: {ROBOFLOW_DIR}")

    # 2. INGEST MOSTAFAABLA DATASET (Zip archive, 15,515 images)
    print("\n[2/5] Ingesting mostafaabla/garbage-classification archive...")
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

                    clean_name = f"mostafa_{parts[1]}_{os.path.basename(fname)}"
                    category_images[target_cat].append((clean_name, data))
                    stats["mostafaabla"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['mostafaabla']} unique images from mostafaabla zip.")
    else:
        print(f"  [Warning] Zip file missing: {ZIP_PATH}")

    # 3. INGEST ASDASDASASDAS DATASET (2,527 images)
    print("\n[3/5] Ingesting asdasdasasdas/garbage-classification...")
    if os.path.exists(ASDASDAS_DIR):
        for sub in os.listdir(ASDASDAS_DIR):
            sub_path = os.path.join(ASDASDAS_DIR, sub)
            if not os.path.isdir(sub_path):
                continue
            target_cat = ASDASDAS_MAP.get(sub.lower())
            if not target_cat:
                continue

            for fname in os.listdir(sub_path):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                    continue
                full_path = os.path.join(sub_path, fname)
                try:
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                    h = get_hash(data)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    clean_name = f"asdasdas_{sub}_{fname}"
                    category_images[target_cat].append((clean_name, data))
                    stats["asdasdasasdas"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['asdasdasasdas']} unique images from asdasdasasdas.")
    else:
        print(f"  [Warning] asdasdasasdas directory missing: {ASDASDAS_DIR}")

    # 4. INGEST PHENOMSG/WASTE-CLASSIFICATION (30,000+ images)
    print("\n[4/5] Ingesting phenomsg/waste-classification...")
    # Find versions directory in PHENOMSG_BASE
    phenomsg_dir = None
    if os.path.exists(PHENOMSG_BASE):
        v_dirs = glob.glob(os.path.join(PHENOMSG_BASE, "versions", "*"))
        if v_dirs:
            phenomsg_dir = sorted(v_dirs)[-1]
        else:
            # Check if extracted directly
            phenomsg_dir = PHENOMSG_BASE

    if phenomsg_dir and os.path.exists(phenomsg_dir):
        print(f"  Scanning: {phenomsg_dir}")
        for root, dirs, files in os.walk(phenomsg_dir):
            for fname in files:
                if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    continue
                full_path = os.path.join(root, fname)
                rel_path = os.path.relpath(full_path, phenomsg_dir)
                target_cat = classify_phenomsg_path(rel_path)
                if not target_cat:
                    continue

                try:
                    with open(full_path, "rb") as fp:
                        data = fp.read()
                    h = get_hash(data)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    sanitized_name = f"phenom_{re.sub(r'[^a-zA-Z0-9_.-]', '_', rel_path)}"
                    category_images[target_cat].append((sanitized_name, data))
                    stats["phenomsg"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['phenomsg']} unique images from phenomsg.")
    else:
        print(f"  [Info] phenomsg directory not yet extracted: {PHENOMSG_BASE}")

    # 5. INGEST MOBILE PHONE / E-WASTE ANNOTATIONS (23 high-res images)
    print("\n[5/5] Ingesting Mobile Phone annotations from YOLO dataset...")
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

    print("\n" + "=" * 70)
    print("V3.0 AGGREGATED CORPUS SUMMARY BY CLASS:")
    print("=" * 70)
    total_all = 0
    for c in CLASSES:
        cnt = len(category_images[c])
        total_all += cnt
        print(f"  {c:<15}: {cnt:>6} images")
    print(f"  {'TOTAL':<15}: {total_all:>6} unique valid images")
    print(f"  (Cross-dataset duplicates eliminated: {stats['duplicates']}, Corrupted skipped: {stats['corrupted']})")

    # 6. PARTITION INTO 70% TRAIN / 15% VAL / 15% TEST
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

    print("\nV3.0 Dataset preparation completed successfully!")
    print(f"Target Directory: {TARGET_DIR}")
    for split in ["train", "val", "test"]:
        sub_total = sum(split_summary[split].values())
        print(f"  Split '{split:<5}': {sub_total:>6} total images")
        for c in CLASSES:
            print(f"     - {c:<15}: {split_summary[split][c]:>5}")

if __name__ == "__main__":
    main()
