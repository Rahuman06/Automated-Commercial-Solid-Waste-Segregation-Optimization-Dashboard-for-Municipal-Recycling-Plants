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
DATA_DIR = os.path.join(BASE_DIR, "data", "processed_v3")
CHECKPOINTS_DIR = os.path.join(BASE_DIR, "models", "checkpoints")
METRICS_DIR = os.path.join(BASE_DIR, "models", "metrics")
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)

BATCH_SIZE = 32
EPOCHS = 10
LR_BACKBONE = 8e-5
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
    print("=" * 70, flush=True)
    print("AI SOLID WASTE CLASSIFIER - V3.0 MEGA-DATASET DEEP LEARNING ENGINE", flush=True)
    print("=" * 70, flush=True)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}", flush=True)
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
        print(f"GPU: {gpu_name} ({vram_gb} GB VRAM)", flush=True)

    # 1. ADVANCED WEBCAM & REAL-WORLD SOLID WASTE AUGMENTATION PIPELINE
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.08),
        transforms.GaussianBlur(kernel_size=(3, 7), sigma=(0.1, 2.0)),
        transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.2), value="random")
    ])

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

    # 2. ARCHITECTURE SETUP: MobileNetV3-Large with Custom Classification Head
    print("\nInitializing MobileNetV3-Large backbone...", flush=True)
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

    # Differential learning rate
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

    best_val_acc = 0.0
    checkpoint_path = os.path.join(CHECKPOINTS_DIR, "v3.0.pt")

    start_time = time.time()
    print(f"\nStarting training loop for {EPOCHS} epochs on RTX 3050 GPU...", flush=True)

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

            if (batch_idx + 1) % 150 == 0 or (batch_idx + 1) == len(train_loader):
                elapsed = time.time() - epoch_start
                print(f"  Epoch [{epoch:>2}/{EPOCHS}] | Step [{batch_idx+1:>4}/{len(train_loader)}] | Train Loss: {loss.item():.4f} | Elapsed: {elapsed:.1f}s", flush=True)

        scheduler.step()

        train_loss = running_loss / total_train
        train_acc = correct_train / total_train

        # Validation phase
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
        epoch_time = time.time() - epoch_start

        print(f"\n>> Epoch {epoch:2d}/{EPOCHS:2d} finished in {epoch_time:.1f}s | Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}%", flush=True)

        # Save checkpoint if best validation accuracy
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            print(f"  [+] New Best Validation Accuracy ({val_acc*100:.2f}%)! Saving checkpoint to {checkpoint_path}", flush=True)
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "val_loss": val_loss,
                "classes": class_names,
                "architecture": "mobilenet_v3_large",
                "version": "v3.0",
                "timestamp": time.time()
            }, checkpoint_path)

    total_training_time = time.time() - start_time
    print("\n" + "=" * 70, flush=True)
    print(f"TRAINING COMPLETE IN {total_training_time/60:.2f} MINUTES. Best Val Acc: {best_val_acc*100:.2f}%", flush=True)
    print("=" * 70, flush=True)

    # 3. INDEPENDENT TEST SET EVALUATION
    print("\nRunning comprehensive evaluation on independent Test Set...", flush=True)
    best_checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(best_checkpoint["model_state_dict"])
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
    test_acc = np.mean(all_preds == all_targets)
    test_loss = test_loss / len(all_targets)

    # Per-class metrics & confusion matrix
    confusion_mat = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(all_targets, all_preds):
        confusion_mat[t, p] += 1

    per_class_metrics = {}
    precisions, recalls, f1s = [], [], []

    for i, cname in enumerate(class_names):
        tp = confusion_mat[i, i]
        fp = confusion_mat[:, i].sum() - tp
        fn = confusion_mat[i, :].sum() - tp
        support = confusion_mat[i, :].sum()

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)

        per_class_metrics[cname] = {
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "support": int(support)
        }

    macro_prec = float(np.mean(precisions))
    macro_rec = float(np.mean(recalls))
    macro_f1 = float(np.mean(f1s))

    print("\n" + "=" * 70, flush=True)
    print("V3.0 INDEPENDENT TEST SET EVALUATION RESULTS", flush=True)
    print("=" * 70, flush=True)
    print(f"Overall Test Accuracy : {test_acc*100:.2f}%", flush=True)
    print(f"Macro Precision       : {macro_prec*100:.2f}%", flush=True)
    print(f"Macro Recall          : {macro_rec*100:.2f}%", flush=True)
    print(f"Macro F1-Score        : {macro_f1*100:.2f}%", flush=True)
    print(f"Test Loss             : {test_loss:.4f}", flush=True)

    print("\nPer-Class Detailed Performance:", flush=True)
    print(f"{'Class':<16} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<8}", flush=True)
    print("-" * 60, flush=True)
    for cname, m in per_class_metrics.items():
        print(f"{cname:<16} {m['precision']*100:>8.2f}%    {m['recall']*100:>8.2f}%    {m['f1_score']*100:>8.2f}%    {m['support']:>6}", flush=True)

    eval_result = {
        "version": "v3.0",
        "dataset_name": "Mega Waste Corpus (PhenomSG + MostafaAbla + Roboflow + ASDASDAS + Mobile Annotations)",
        "training_time_seconds": round(total_training_time, 2),
        "total_epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "test_accuracy": round(float(test_acc), 4),
        "test_loss": round(float(test_loss), 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1_score": round(macro_f1, 4),
        "per_class": per_class_metrics,
        "classes": class_names,
        "num_classes": num_classes,
        "confusion_matrix": confusion_mat.tolist(),
        "checkpoint_path": checkpoint_path
    }

    eval_path = os.path.join(METRICS_DIR, "v3.0_evaluation.json")
    with open(eval_path, "w") as fp:
        json.dump(eval_result, fp, indent=2)

    print(f"\nEvaluation metrics saved to: {eval_path}", flush=True)
    print("V3.0 Training and Evaluation workflow completed successfully!", flush=True)

if __name__ == "__main__":
    main()
