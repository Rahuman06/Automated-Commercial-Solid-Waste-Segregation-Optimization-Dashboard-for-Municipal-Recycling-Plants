import os
import io
import re
import glob
import random
import shutil
import hashlib
import zipfile
from collections import defaultdict
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DIR = os.path.join(BASE_DIR, "data", "processed_v5")
SEED = 42

CLASSES = ["Biodegradable", "Cardboard", "E-Waste", "Glass", "Metal", "Paper", "Plastic"]

# Dataset 1: alistairking/recyclable-and-household-waste-classification
ALISTAIR_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\alistairking\recyclable-and-household-waste-classification\versions\1\images\images"
ALISTAIR_MAP = {
    "cardboard_boxes": "Cardboard",
    "cardboard_packaging": "Cardboard",
    "aerosol_cans": "Metal",
    "aluminum_food_cans": "Metal",
    "aluminum_soda_cans": "Metal",
    "steel_food_cans": "Metal",
    "magazines": "Paper",
    "newspaper": "Paper",
    "office_paper": "Paper",
    "paper_cups": "Paper",
    "glass_beverage_bottles": "Glass",
    "glass_cosmetic_containers": "Glass",
    "glass_food_jars": "Glass",
    "coffee_grounds": "Biodegradable",
    "eggshells": "Biodegradable",
    "food_waste": "Biodegradable",
    "tea_bags": "Biodegradable",
    "disposable_plastic_cutlery": "Plastic",
    "plastic_cup_lids": "Plastic",
    "plastic_detergent_bottles": "Plastic",
    "plastic_food_containers": "Plastic",
    "plastic_shopping_bags": "Plastic",
    "plastic_soda_bottles": "Plastic",
    "plastic_straws": "Plastic",
    "plastic_trash_bags": "Plastic",
    "plastic_water_bottles": "Plastic",
    "styrofoam_cups": "Plastic",
    "styrofoam_food_containers": "Plastic"
}

# Dataset 2: nandinibagga/metal-images
NANDINI_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\nandinibagga\metal-images\versions\1\metal"

# Dataset 3: akshat103/e-waste-image-dataset
AKSHAT_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\akshat103\e-waste-image-dataset\versions\1"

# Dataset 4: yadavmohit04/plastic-multiclass-dataset
MOHIT_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\yadavmohit04\plastic-multiclass-dataset\versions\1"

# Dataset 5: Roboflow Garbage Detection
ROBOFLOW_DIR = r"D:\mini project\garbage-detection\GARBAGE CLASSIFICATION"
ROBOFLOW_MAP = {
    "biodegradable": "Biodegradable",
    "cardboard": "Cardboard",
    "glass": "Glass",
    "metal": "Metal",
    "paper": "Paper",
    "plastic": "Plastic"
}

# Dataset 6: mostafaabla/garbage-classification
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

# Dataset 7: phenomsg/waste-classification
PHENOMSG_BASE = r"C:\Users\tmpra\.cache\kagglehub\datasets\phenomsg\waste-classification"

# Dataset 8: asdasdasasdas/garbage-classification
ASDASDAS_DIR = r"C:\Users\tmpra\.cache\kagglehub\datasets\asdasdasasdas\garbage-classification\versions\2\Garbage classification\Garbage classification"
ASDASDAS_MAP = {
    "cardboard": "Cardboard",
    "glass": "Glass",
    "metal": "Metal",
    "paper": "Paper",
    "plastic": "Plastic"
}

# Dataset 9: yolo mobile dataset
YOLO_DIR = r"D:\mini project\yolo\archive\yolo_data_sindhi_label"

def classify_phenomsg_path(path_str: str):
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

def compute_file_hash(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def main():
    random.seed(SEED)
    print("=" * 80, flush=True)
    print("V5.0 ULTIMATE MASTER DATASET ENGINE (ALL 9 SOURCES MERGED & BALANCED)", flush=True)
    print("=" * 80, flush=True)

    os.makedirs(TARGET_DIR, exist_ok=True)
    for split in ["train", "val", "test"]:
        for c in CLASSES:
            os.makedirs(os.path.join(TARGET_DIR, split, c), exist_ok=True)

    seen_hashes = set()
    category_items = defaultdict(list)  # class -> list of (clean_name, ("file", path) or ("zip", zip_path, internal_path))
    stats = defaultdict(int)

    # 1. INGEST ALISTAIRKING RECYCLABLE & HOUSEHOLD DATASET (15,000 images)
    print("\n[1/9] Ingesting alistairking/recyclable-and-household-waste-classification...", flush=True)
    if os.path.exists(ALISTAIR_DIR):
        for sub_folder in os.listdir(ALISTAIR_DIR):
            sub_path = os.path.join(ALISTAIR_DIR, sub_folder)
            if not os.path.isdir(sub_path):
                continue
            target_cat = ALISTAIR_MAP.get(sub_folder)
            if not target_cat:
                continue

            for root, dirs, files in os.walk(sub_path):
                for fname in files:
                    if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                        continue
                    full_path = os.path.join(root, fname)
                    try:
                        h = compute_file_hash(full_path)
                        if h in seen_hashes:
                            stats["duplicates"] += 1
                            continue
                        seen_hashes.add(h)

                        with Image.open(full_path) as im:
                            im.verify()

                        rel_sub = os.path.basename(root)
                        clean_name = f"alistair_{sub_folder}_{rel_sub}_{fname}"
                        category_items[target_cat].append((clean_name, ("file", full_path)))
                        stats["alistair_total"] += 1
                    except Exception:
                        stats["corrupted"] += 1
        print(f"  --> Ingested {stats['alistair_total']} unique images from alistairking dataset.", flush=True)
    else:
        print(f"  [Warning] Directory not found: {ALISTAIR_DIR}", flush=True)

    # 2. INGEST NANDINIBAGGA METAL IMAGES (410 images)
    print("\n[2/9] Ingesting nandinibagga/metal-images (Metal)...", flush=True)
    if os.path.exists(NANDINI_DIR):
        for fname in os.listdir(NANDINI_DIR):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                continue
            full_path = os.path.join(NANDINI_DIR, fname)
            try:
                h = compute_file_hash(full_path)
                if h in seen_hashes:
                    stats["duplicates"] += 1
                    continue
                seen_hashes.add(h)

                with Image.open(full_path) as im:
                    im.verify()

                clean_name = f"nandini_metal_{fname}"
                category_items["Metal"].append((clean_name, ("file", full_path)))
                stats["nandini_metal"] += 1
            except Exception:
                stats["corrupted"] += 1
        print(f"  --> Ingested {stats['nandini_metal']} unique metal images from nandinibagga.", flush=True)
    else:
        print(f"  [Warning] Directory not found: {NANDINI_DIR}", flush=True)

    # 3. INGEST AKSHAT103 E-WASTE DATASET (3,000 images)
    print("\n[3/9] Ingesting akshat103/e-waste-image-dataset (E-Waste)...", flush=True)
    if os.path.exists(AKSHAT_DIR):
        for root, dirs, files in os.walk(AKSHAT_DIR):
            for fname in files:
                if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    continue
                full_path = os.path.join(root, fname)
                try:
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    sub_cat = os.path.basename(root)
                    clean_name = f"akshat_{sub_cat}_{fname}"
                    category_items["E-Waste"].append((clean_name, ("file", full_path)))
                    stats["akshat_ewaste"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['akshat_ewaste']} unique images from akshat103 E-Waste.", flush=True)
    else:
        print(f"  [Warning] Directory not found: {AKSHAT_DIR}", flush=True)

    # 4. INGEST YADAVMOHIT04 PLASTIC MULTICLASS DATASET (8,979 images)
    print("\n[4/9] Ingesting yadavmohit04/plastic-multiclass-dataset (Plastic)...", flush=True)
    if os.path.exists(MOHIT_DIR):
        for split_folder in ["train", "valid", "test"]:
            img_folder = os.path.join(MOHIT_DIR, split_folder, "images")
            if not os.path.exists(img_folder):
                continue
            for fname in os.listdir(img_folder):
                if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    continue
                full_path = os.path.join(img_folder, fname)
                try:
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    clean_name = f"mohit_{fname}"
                    category_items["Plastic"].append((clean_name, ("file", full_path)))
                    stats["mohit_plastic"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['mohit_plastic']} unique images from yadavmohit04 Plastic.", flush=True)
    else:
        print(f"  [Warning] Directory not found: {MOHIT_DIR}", flush=True)

    # 5. INGEST ROBOFLOW GARBAGE DETECTION (10,464 images)
    print("\n[5/9] Ingesting Roboflow Garbage Detection Dataset...", flush=True)
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
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    category_items[target_cat].append((f"rf_{fname}", ("file", full_path)))
                    stats["roboflow"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['roboflow']} unique images from Roboflow.", flush=True)
    else:
        print(f"  [Warning] Roboflow directory missing: {ROBOFLOW_DIR}", flush=True)

    # 6. INGEST MOSTAFAABLA DATASET (Zip file)
    print("\n[6/9] Ingesting mostafaabla/garbage-classification archive...", flush=True)
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
                    h = hashlib.sha256(data).hexdigest()
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(io.BytesIO(data)) as im:
                        im.verify()

                    clean_name = f"mostafa_{parts[1]}_{os.path.basename(fname)}"
                    category_items[target_cat].append((clean_name, ("zip", ZIP_PATH, fname)))
                    stats["mostafaabla"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['mostafaabla']} unique images from mostafaabla zip.", flush=True)
    else:
        print(f"  [Warning] Zip file missing: {ZIP_PATH}", flush=True)

    # 7. INGEST PHENOMSG/WASTE-CLASSIFICATION
    print("\n[7/9] Ingesting phenomsg/waste-classification...", flush=True)
    phenomsg_dir = None
    if os.path.exists(PHENOMSG_BASE):
        v_dirs = glob.glob(os.path.join(PHENOMSG_BASE, "versions", "*"))
        if v_dirs:
            phenomsg_dir = sorted(v_dirs)[-1]
        else:
            phenomsg_dir = PHENOMSG_BASE

    if phenomsg_dir and os.path.exists(phenomsg_dir):
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
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    sanitized_name = f"phenom_{re.sub(r'[^a-zA-Z0-9_.-]', '_', rel_path)}"
                    category_items[target_cat].append((sanitized_name, ("file", full_path)))
                    stats["phenomsg"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['phenomsg']} unique images from phenomsg.", flush=True)

    # 8. INGEST ASDASDASASDAS DATASET
    print("\n[8/9] Ingesting asdasdasasdas/garbage-classification...", flush=True)
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
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    clean_name = f"asdasdas_{sub}_{fname}"
                    category_items[target_cat].append((clean_name, ("file", full_path)))
                    stats["asdasdasasdas"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['asdasdasasdas']} unique images from asdasdasasdas.", flush=True)

    # 9. INGEST MOBILE PHONE / E-WASTE ANNOTATIONS
    print("\n[9/9] Ingesting Mobile Phone annotations from YOLO dataset...", flush=True)
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
                    h = compute_file_hash(full_path)
                    if h in seen_hashes:
                        stats["duplicates"] += 1
                        continue
                    seen_hashes.add(h)

                    with Image.open(full_path) as im:
                        im.verify()

                    category_items["E-Waste"].append((f"yolo_mob_{fname}", ("file", full_path)))
                    stats["yolo"] += 1
                except Exception:
                    stats["corrupted"] += 1
        print(f"  --> Ingested {stats['yolo']} unique mobile phone images for E-Waste.", flush=True)

    print("\n" + "=" * 80, flush=True)
    print("V5.0 MASTER CORPUS RAW TOTALS BY CLASS:", flush=True)
    print("=" * 80, flush=True)
    for c in CLASSES:
        cnt = len(category_items[c])
        print(f"  {c:<15}: {cnt:>6} images", flush=True)

    # 10. BALANCING
    # Capping at 4,000 gives an extraordinarily balanced, high-fidelity distribution
    MAX_PER_CLASS = 4000
    balanced_category_items = {}
    for c in CLASSES:
        items = category_items[c]
        random.shuffle(items)
        if len(items) > MAX_PER_CLASS:
            balanced_category_items[c] = items[:MAX_PER_CLASS]
            print(f"  [Balanced] {c}: Sampled {MAX_PER_CLASS} diverse images (from {len(items)})", flush=True)
        else:
            balanced_category_items[c] = items

    print("\n" + "=" * 80, flush=True)
    print("BALANCED DATASET TOTALS BY CLASS (FOR MODEL V5.0):", flush=True)
    print("=" * 80, flush=True)
    total_balanced = 0
    for c in CLASSES:
        cnt = len(balanced_category_items[c])
        total_balanced += cnt
        print(f"  {c:<15}: {cnt:>6} images", flush=True)
    print(f"  {'TOTAL':<15}: {total_balanced:>6} images", flush=True)
    print(f"  (Cross-dataset duplicates purged: {stats['duplicates']}, Corrupted skipped: {stats['corrupted']})", flush=True)

    # Partition into 70% Train / 15% Val / 15% Test
    print("\nWriting Train (70%), Val (15%), Test (15%) splits to processed_v5...", flush=True)
    split_summary = {"train": defaultdict(int), "val": defaultdict(int), "test": defaultdict(int)}

    # Open zip once if needed
    zip_handles = {}

    def copy_item(item_desc, out_path):
        tag = item_desc[0]
        if tag == "file":
            shutil.copyfile(item_desc[1], out_path)
        elif tag == "zip":
            zip_p, internal_p = item_desc[1], item_desc[2]
            if zip_p not in zip_handles:
                zip_handles[zip_p] = zipfile.ZipFile(zip_p, "r")
            data = zip_handles[zip_p].read(internal_p)
            with open(out_path, "wb") as f_out:
                f_out.write(data)

    try:
        for c in CLASSES:
            items = balanced_category_items[c]
            random.shuffle(items)
            n = len(items)
            train_end = int(n * 0.70)
            val_end = int(n * 0.85)

            train_set = items[:train_end]
            val_set = items[train_end:val_end]
            test_set = items[val_end:]

            for fname, item_desc in train_set:
                out_p = os.path.join(TARGET_DIR, "train", c, fname)
                copy_item(item_desc, out_p)
                split_summary["train"][c] += 1

            for fname, item_desc in val_set:
                out_p = os.path.join(TARGET_DIR, "val", c, fname)
                copy_item(item_desc, out_p)
                split_summary["val"][c] += 1

            for fname, item_desc in test_set:
                out_p = os.path.join(TARGET_DIR, "test", c, fname)
                copy_item(item_desc, out_p)
                split_summary["test"][c] += 1
            print(f"  Finished writing category: {c} ({n} images)", flush=True)
    finally:
        for zh in zip_handles.values():
            zh.close()

    print("\nV5.0 Master Dataset preparation completed successfully!", flush=True)
    print(f"Target Directory: {TARGET_DIR}", flush=True)
    for split in ["train", "val", "test"]:
        sub_total = sum(split_summary[split].values())
        print(f"  Split '{split:<5}': {sub_total:>6} total images", flush=True)
        for c in CLASSES:
            print(f"     - {c:<15}: {split_summary[split][c]:>5}", flush=True)

if __name__ == "__main__":
    main()
