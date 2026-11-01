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

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
CHECKPOINTS_DIR = os.path.join(BASE_DIR, "models", "checkpoints")
METRICS_DIR = os.path.join(BASE_DIR, "models", "metrics")
os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
os.makedirs(METRICS_DIR, exist_ok=True)

# Hyperparameters
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.0008
WEIGHT_DECAY = 1e-4
SEED = 42

def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True

def main():
    set_seed(SEED)
    print("=" * 65)
    print("AI-POWERED SOLID WASTE CLASSIFIER - INITIAL MODEL TRAINING (V1.0)")
    print("=" * 65)

    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Available VRAM: {round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)} GB")

    # Transforms
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Datasets & Dataloaders
    train_dir = os.path.join(DATA_DIR, "train")
    val_dir = os.path.join(DATA_DIR, "val")
    test_dir = os.path.join(DATA_DIR, "test")

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_test_transform)
    test_dataset = datasets.ImageFolder(test_dir, transform=val_test_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"\nDetected {num_classes} classes: {class_names}")
    print(f"Dataset split counts: Train={len(train_dataset)}, Val={len(val_dataset)}, Test={len(test_dataset)}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=torch.cuda.is_available())
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=torch.cuda.is_available())
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # Architecture: MobileNetV3-Large with pretrained weights
    print("\nLoading MobileNetV3-Large backbone...")
    weights = models.MobileNet_V3_Large_Weights.DEFAULT
    model = models.mobilenet_v3_large(weights=weights)

    # Custom classification head
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes)
    )
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-5)
    scaler = torch.amp.GradScaler('cuda', enabled=torch.cuda.is_available())

    # Training Loop
    best_val_acc = 0.0
    history = {
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": []
    }

    best_checkpoint_path = os.path.join(CHECKPOINTS_DIR, "v1.0_best.pt")
    start_time = time.time()

    print(f"\nStarting training for {EPOCHS} epochs with batch size {BATCH_SIZE}...")
    for epoch in range(1, EPOCHS + 1):
        epoch_start = time.time()
        
        # --- TRAIN ---
        model.train()
        running_loss = 0.0
        running_corrects = 0
        total_train = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            optimizer.zero_grad()
            with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                outputs = model(inputs)
                loss = criterion(outputs, labels)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data).item()
            total_train += inputs.size(0)

        scheduler.step()
        epoch_train_loss = running_loss / total_train
        epoch_train_acc = running_corrects / total_train

        # --- VALIDATE ---
        model.eval()
        val_running_loss = 0.0
        val_running_corrects = 0
        total_val = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)
                with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                _, preds = torch.max(outputs, 1)
                val_running_loss += loss.item() * inputs.size(0)
                val_running_corrects += torch.sum(preds == labels.data).item()
                total_val += inputs.size(0)

        epoch_val_loss = val_running_loss / total_val
        epoch_val_acc = val_running_corrects / total_val

        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 4))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 4))

        epoch_time = time.time() - epoch_start
        print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] ({epoch_time:.1f}s) - "
              f"Loss: {epoch_train_loss:.4f} | Acc: {epoch_train_acc*100:.2f}% | "
              f"Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc*100:.2f}%", end="")

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": best_val_acc,
                "class_names": class_names,
                "architecture": "MobileNetV3-Large"
            }, best_checkpoint_path)
            print(" [BEST CHECKPOINT SAVED]")
        else:
            print()

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time/60:.2f} minutes. Best Validation Accuracy: {best_val_acc*100:.2f}%")

    # --- INDEPENDENT TEST EVALUATION ---
    print("\nEvaluating on Independent Test Dataset...")
    checkpoint = torch.load(best_checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    all_preds = []
    all_targets = []
    test_running_loss = 0.0
    total_test = 0

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            labels = labels.to(device)
            with torch.amp.autocast('cuda', enabled=torch.cuda.is_available()):
                outputs = model(inputs)
                loss = criterion(outputs, labels)
            _, preds = torch.max(outputs, 1)
            test_running_loss += loss.item() * inputs.size(0)
            total_test += inputs.size(0)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.cpu().numpy().tolist())

    test_loss = test_running_loss / total_test
    test_acc = sum(p == t for p, t in zip(all_preds, all_targets)) / total_test

    # Compute Confusion Matrix (pure numpy)
    conf_matrix = [[0] * num_classes for _ in range(num_classes)]
    for t, p in zip(all_targets, all_preds):
        conf_matrix[t][p] += 1

    # Per-class metrics
    per_class = []
    macro_prec = []
    macro_rec = []
    macro_f1 = []

    for i, cname in enumerate(class_names):
        tp = conf_matrix[i][i]
        fp = sum(conf_matrix[r][i] for r in range(num_classes) if r != i)
        fn = sum(conf_matrix[i][c] for c in range(num_classes) if c != i)
        total_class_test = sum(conf_matrix[i])

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        macro_prec.append(prec)
        macro_rec.append(rec)
        macro_f1.append(f1)

        per_class.append({
            "class_name": cname,
            "test_images": total_class_test,
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4)
        })

    overall_prec = float(np.mean(macro_prec))
    overall_rec = float(np.mean(macro_rec))
    overall_f1 = float(np.mean(macro_f1))

    print("\n" + "=" * 65)
    print("INDEPENDENT TEST EVALUATION REPORT")
    print("=" * 65)
    print(f"Test Loss:     {test_loss:.4f}")
    print(f"Test Accuracy: {test_acc*100:.2f}%")
    print(f"Macro Precision: {overall_prec*100:.2f}%")
    print(f"Macro Recall:    {overall_rec*100:.2f}%")
    print(f"Macro F1-Score:  {overall_f1*100:.2f}%")
    print("-" * 65)
    print(f"{'Class':<15} {'Samples':<10} {'Precision':<12} {'Recall':<12} {'F1-Score':<10}")
    print("-" * 65)
    for pc in per_class:
        print(f"{pc['class_name']:<15} {pc['test_images']:<10} {pc['precision']*100:>8.2f}%    {pc['recall']*100:>8.2f}%    {pc['f1_score']*100:>8.2f}%")
    print("=" * 65)

    # Save final model file
    final_model_path = os.path.join(CHECKPOINTS_DIR, "v1.0.pt")
    torch.save({
        "version": "v1.0",
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "num_classes": num_classes,
        "architecture": "MobileNetV3-Large",
        "input_resolution": 224,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "accuracy": round(test_acc, 4),
        "f1_score": round(overall_f1, 4),
        "precision": round(overall_prec, 4),
        "recall": round(overall_rec, 4)
    }, final_model_path)
    print(f"\nFinal deployable model saved: {final_model_path}")

    # Save evaluation report
    eval_report = {
        "model_version": "v1.0",
        "architecture": "MobileNetV3-Large",
        "training_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "hardware_accelerator": str(device),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
        "epochs": EPOCHS,
        "batch_size": BATCH_SIZE,
        "training_duration_seconds": round(total_time, 1),
        "metrics": {
            "test_accuracy": round(test_acc, 4),
            "test_loss": round(test_loss, 4),
            "macro_precision": round(overall_prec, 4),
            "macro_recall": round(overall_rec, 4),
            "macro_f1_score": round(overall_f1, 4)
        },
        "per_class_metrics": per_class,
        "confusion_matrix": {
            "classes": class_names,
            "matrix": conf_matrix
        },
        "training_history": history
    }

    eval_path = os.path.join(METRICS_DIR, "v1.0_evaluation.json")
    with open(eval_path, "w") as f:
        json.dump(eval_report, f, indent=2)
    print(f"Structured evaluation report saved: {eval_path}")

if __name__ == "__main__":
    main()
