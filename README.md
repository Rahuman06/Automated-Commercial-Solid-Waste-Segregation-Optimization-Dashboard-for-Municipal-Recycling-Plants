# Automated Commercial Solid Waste Segregation Optimization Dashboard for Municipal Recycling Plants

### Initially focused on Greater Chennai Corporation (GCC), Tamil Nadu, India

A complete, production-ready, full-stack municipal artificial intelligence platform combining real-time waste analytics, smart garbage truck computer vision, Leaflet GIS mapping, and a community-powered continuous AI training and model deployment pipeline.

---

## Key Highlights & Systems

### 1. Waste Analytics Dashboard (`/`)
- Immediate executive visibility into total waste collected today, this week, and this month across all 200 Chennai municipal wards.
- Standardized 11 solid waste categories: Organic Waste, Food Waste, Plastic, Paper, Cardboard, Glass, Metal, Textile Waste, Electronic Waste, Hazardous Waste, and Mixed/Unsegregated Waste.
- KPIs: Recycling Rate, Segregation Efficiency, Environmental Carbon Avoidance, Active Collection Vehicles (24 trucks), Active Segregation Facilities (12 plants), and Capacity Utilization.
- Interactive tooltips for non-technical users and **Data Provenance Badges** on every visualization.

### 2. Smart Garbage Truck AI Vision Feed (`/ai/detection`)
- End-to-end computer vision pipeline:
  `Truck Camera / WebCam → Frame Capture → AI Detection → Bounding Box Classification → GPS Location → Central Database → Dashboard Feed`
- **Live Device WebCam & Camera Integration**: Direct in-browser video feed with real-time bounding box overlay on detected waste objects.
- **Continuous Auto-Scan Mode**: Automatically captures and infers frames periodically (e.g. simulating collection trucks driving past roadside bins).
- Displays detected category, confidence percentage, estimated weight, bin fill level, GPS ward, and routing instructions.

### 3. Community-Powered Continuous Retraining System (`/ai/contribute`, `/ai/training`, `/ai/models`)
- **Citizen Contribution Portal**: Anyone can snap a photo with their webcam or upload images of waste.
- **Automated Validation Pipeline**:
  - Instant AI prediction and confidence score.
  - User verification: "Is this classification correct? [Yes, Confirm] / [No, Correct It]".
  - Image quality checks: Sharpness/blur detection via Laplacian variance, duplicate hash matching, and resolution compliance.
  - Staging in candidate dataset.
- **Continuous Retraining Trigger**: Automated retraining triggered when validated contributions reach the threshold (500 images).
- **Safe Model Deployment Gate**:
  - Candidate model is never pushed directly to production.
  - Candidate Model (v2.2) is benchmarked side-by-side with the Production Model (v2.1) across Accuracy, Precision, Recall, F1 score, and an 11-class performance matrix.
  - One-click Admin Approval & Deployment to fleet, with one-click Rollback safety.

### 4. Interactive Leaflet GIS Map (`/map`)
- Full interactive GIS map centered on Chennai with OpenStreetMap tiles.
- Real-time layers: 24 Smart Collection Trucks (GC-01 to GC-24), 12 Processing Facilities, 200 Ward centroids, and a Waste Intensity Heatmap.
- Entity Inspector drawer showing live facility utilization and vehicle battery/fill levels.

### 5. Strict Data Accuracy & Transparency
Every chart and metric displays an explicit provenance badge:
- `LIVE DATA` (Green badge)
- `NEAR REAL-TIME DATA` (Cyan badge)
- `HISTORICAL DATA` (Blue badge)
- `USER-CONTRIBUTED DATA` (Purple badge)
- `AI-DETECTED DATA` (Teal badge)
- `SIMULATED DATA` (Amber badge)

A global **Simulation Mode** toggle switch allows municipal demonstration without mixing synthetic data with official government records.

---

## The 17 Municipal Pages

| # | Route | Page Title | Description |
|---|---|---|---|
| 1 | `/` | **Home Dashboard** | Executive summary, 11 waste streams, city KPIs, live AI ticker |
| 2 | `/map` | **Live Waste Map** | Interactive Leaflet GIS map with Chennai zone boundaries & fleet pins |
| 3 | `/wards` | **Ward Analytics** | All 200 Chennai wards, 6 rankings leaderboards, ward detail drawers |
| 4 | `/analytics/composition` | **Waste Analysis** | Recharts pie, bar, and 6-month seasonal trend trajectories |
| 5 | `/collection` | **Collection Monitoring** | Smart compactor truck fleet tracker (GC-01..24), fill levels, telemetry |
| 6 | `/plants` | **Segregation Plants** | Directory of 12 facilities (Perungudi, Kodungaiyur, Madhavaram, etc.) |
| 7 | `/environmental` | **Environmental Impact** | CO2e offset, methane risk, landfill space saved, IPCC disclaimer |
| 8 | `/ai/detection` | **AI Waste Detection** | Live WebCam scanner, truck camera feed, bounding boxes, telemetry |
| 9 | `/ai/contribute` | **Contribute to Improve AI** | Citizen WebCam photo capture, AI label verification, quality checks |
| 10 | `/ai/my-contributions` | **My Contributions** | Contributor history, verification statuses, eco points & badges |
| 11 | `/ai/training` | **AI Training Center** | Continuous retraining pipeline progress, batch threshold trigger |
| 12 | `/ai/models` | **AI Model Management** | Production vs Candidate model benchmark matrix, deploy, rollback |
| 13 | `/datasets` | **Dataset Management** | Data connectors (GCC, CPCB, Kaggle), CSV uploader with normalizer |
| 14 | `/optimization` | **Collection Optimization** | AI-generated route rescheduling and plant load balancing |
| 15 | `/alerts` | **Alerts** | Operational incident alerts with Critical/High/Medium/Low priorities |
| 16 | `/about-data` | **About Data** | Provenance definitions, NDSAP compliance, scientific calculation formulas |
| 17 | `/admin` | **Administration** | Persona role switcher (6 roles), simulation mode toggle, system health |

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1-Click Launch (Windows)
Double-click `start_servers.bat` or run in PowerShell:
```powershell
.\start_servers.ps1
```

### Manual Launch

#### 1. Backend (FastAPI)
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://localhost:8000/api`
- Swagger Interactive Documentation: `http://localhost:8000/docs`

#### 2. Frontend (Next.js)
```bash
cd frontend
npm start
```
- Web Application: `http://localhost:3000`

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Charts & Visualizations**: Recharts
- **GIS Mapping**: Leaflet, OpenStreetMap
- **Backend API**: Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Database**: SQLite / PostgreSQL with spatial lat/lng schema and SQLAlchemy ORM
- **Computer Vision & AI**: Pillow, NumPy, PyTorch/YOLOv8-Waste classification engine, Laplacian variance blur detection
- **Icons & UI Primitives**: Lucide React