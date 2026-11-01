import os
import sys
import json
import time
import math
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_v2")
CHECKPOINTS_DIR = os.path.join(BASE_DIR, "models", "checkpoints")
METRICS_DIR = os.path.join(BASE_DIR, "models", "metrics")
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)

BATCH_SIZE = 32
EPOCHS = 12
LR_BACKBONE = 1e-4
LR_HEAD = 1e-3
WEIGHT_DECAY = 1e-4
SEED = 42

def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True

def main():
    set_seed(SEED)
    print("=" * 65, flush=True)
    print("AI SOLID WASTE CLASSIFIER - V2.0 WEBCAM ACCURACY MODEL TRAINING", flush=True)
    print("=" * 65, flush=True)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}", flush=True)
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)} ({round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)} GB VRAM)", flush=True)

    # 1. ADVANCED WEBCAM & MOBILE AUGMENTATION PIPELINE
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.35, contrast=0.35, saturation=0.35, hue=0.08),
        transforms.GaussianBlur(kernel_size=(3, 7), sigma=(0.1, 2.0)),
        transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.2), value="random")
    ])

    # Validation & Test (Preserve aspect ratio)
    val_test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_dir = os.path.join(DATA_DIR, "train")
    val_dir = os.path.join(DATA_DIR, "val")
    test_dir = os.path.join(DATA_DIR, "test")

    print("\nLoading datasets...", flush=True)
    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_test_transform)
    test_dataset = datasets.ImageFolder(test_dir, transform=val_test_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"Detected {num_classes} classes: {class_names}", flush=True)
    print(f"Dataset counts: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)}", flush=True)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=torch.cuda.is_available())
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=torch.cuda.is_available())
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # 2. ARCHITECTURE SETUP: MobileNetV3-Large
    print("\nInitializing MobileNetV3-Large with differential learning rates...", flush=True)
    weights = models.MobileNet_V3_Large_Weights.DEFAULT
    model = models.mobilenet_v3_large(weights=weights)

    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes)
    )
    model = model.to(device)

    # Differential learning rate params
    backbone_params = []
    head_params = []
    for name, param in model.named_parameters():
        if "classifier" in name:
            head_params.append(param)
        else:
            backbone_params.append(param)

    optimizer = optim.AdamW([
        {"params": backbone_params, "lr": LR_BACKBONE},
        {"params": head_params, "lr": LR_HEAD}
    ], weight_decay=WEIGHT_DECAY)

    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=4, T_mult=2, eta_min=1e-6)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    scaler = torch.amp.GradScaler('cuda', enabled=torch.cuda.is_available())

    best_val_loss = float("inf")
    best_val_acc = 0.0
    checkpoint_path = os.path.join(CHECKPOINTS_DIR, "v2.0.pt")

    start_time = time.time()
    print("\nStarting training loop for 12 epochs...", flush=True)

    for epoch in range(1, EPOCHS + 1):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train = 0

        for batch_idx, (inputs, targets) in enumerate(train_loader):
            inputs, targets = inputs.to(device), targets.to(device)
            optimizer.zero_grad()

            with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                outputs = model(inputs)
                loss = criterion(outputs, targets)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            total_train += targets.size(0)
            correct_train += predicted.eq(targets).sum().item()

        scheduler.step()

        train_loss = running_loss / total_train
        train_acc = correct_train / total_train

        # Validation
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val = 0

        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs, targets = inputs.to(device), targets.to(device)
                with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                    outputs = model(inputs)
                    loss = criterion(outputs, targets)

                val_loss += loss.item() * inputs.size(0)
                _, predicted = outputs.max(1)
                total_val += targets.size(0)
                correct_val += predicted.eq(targets).sum().item()

        val_loss = val_loss / total_val
        val_acc = correct_val / total_val
        epoch_duration = time.time() - epoch_start

        print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] ({epoch_duration:.1f}s) | Train Loss: {train_loss:.4f} Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f} Acc: {val_acc*100:.2f}%", flush=True)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_val_acc = val_acc
            torch.save({
                "version": "v2.0",
                "model_name": "GCC-MobileNetV3-WasteVision",
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
                "val_accuracy": val_acc,
                "val_loss": val_loss,
                "epoch": epoch
            }, checkpoint_path)
            print(f"  --> Saved new best checkpoint to {checkpoint_path} (Val Acc: {val_acc*100:.2f}%)", flush=True)

    total_training_time = time.time() - start_time
    print(f"\nTraining completed in {total_training_time / 60:.2f} minutes.", flush=True)

    # 3. INDEPENDENT TEST EVALUATION
    print("\n" + "=" * 65, flush=True)
    print("INDEPENDENT TEST EVALUATION ON UNSEEN TEST DATA", flush=True)
    print("=" * 65, flush=True)

    # Load best weights
    best_ckpt = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(best_ckpt["model_state_dict"])
    model.eval()

    all_preds = []
    all_targets = []
    test_loss = 0.0

    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                outputs = model(inputs)
                loss = criterion(outputs, targets)

            test_loss += loss.item() * inputs.size(0)
            _, predicted = outputs.max(1)
            all_preds.extend(predicted.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    test_loss = test_loss / len(test_dataset)
    test_accuracy = float(np.mean(all_preds == all_targets))

    # Confusion Matrix & Per-Class Metrics
    per_class_metrics = []
    precisions = []
    recalls = []
    f1s = []

    print(f"\nTest Loss:     {test_loss:.4f}", flush=True)
    print(f"Test Accuracy: {test_accuracy*100:.2f}%\n", flush=True)
    print(f"{'Class':<15} {'Samples':<10} {'Precision':<12} {'Recall':<12} {'F1-Score':<10}", flush=True)
    print("-" * 65, flush=True)

    for idx, cname in enumerate(class_names):
        tp = int(np.sum((all_preds == idx) & (all_targets == idx)))
        fp = int(np.sum((all_preds == idx) & (all_targets != idx)))
        fn = int(np.sum((all_preds != idx) & (all_targets == idx)))
        samples = int(np.sum(all_targets == idx))

        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)

        per_class_metrics.append({
            "class_name": cname,
            "category": cname,
            "test_images": samples,
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "status": "good" if f1 >= 0.85 else "needs_improvement"
        })

        print(f"{cname:<15} {samples:<10} {prec*100:>9.2f}% {rec*100:>10.2f}% {f1*100:>9.2f}%", flush=True)

    macro_f1 = float(np.mean(f1s))
    macro_prec = float(np.mean(precisions))
    macro_rec = float(np.mean(recalls))

    print("-" * 65, flush=True)
    print(f"Macro Average: Precision: {macro_prec*100:.2f}% | Recall: {macro_rec*100:.2f}% | Macro F1: {macro_f1*100:.2f}%", flush=True)
    print("=" * 65, flush=True)

    # Save detailed evaluation JSON
    eval_data = {
        "model_version": "v2.0",
        "architecture": "MobileNetV3-Large",
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardware_accelerator": str(device),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "training_duration_seconds": round(total_training_time, 1),
        "metrics": {
            "test_accuracy": round(test_accuracy, 4),
            "test_loss": round(test_loss, 4),
            "macro_precision": round(macro_prec, 4),
            "macro_recall": round(macro_rec, 4),
            "macro_f1_score": round(macro_f1, 4)
        },
        "per_class_metrics": per_class_metrics
    }

    eval_path = os.path.join(METRICS_DIR, "v2.0_evaluation.json")
    with open(eval_path, "w") as fp:
        json.dump(eval_data, fp, indent=2)
    print(f"\nEvaluation metrics successfully written to: {eval_path}", flush=True)

if __name__ == "__main__":
    main()
