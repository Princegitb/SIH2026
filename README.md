# 🛰️ VayuShetra — Satellite-Driven Hyperlocal AQI & Biomass Intelligence Platform

[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20TailwindCSS-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Uvicorn-009688.svg)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/ML%20Models-Multi--Seasonal%20XGBoost%20%2B%20SHAP-orange.svg)](https://xgboost.ai/)
[![DBSCAN](https://img.shields.io/badge/Clustering-Spherical%20Haversine%20DBSCAN-green.svg)](https://scikit-learn.org/)
[![Physics](https://img.shields.io/badge/Dispersion-Lagrangian%20Advection%20%2B%20Briggs%20Plume-purple.svg)](https://github.com/Princegitb/SIH2026)

---

## 📋 Prerequisites
Before running on a new laptop, ensure you have:
1. **Python 3.10, 3.11, or 3.12+** ([Download Python](https://www.python.org/downloads/))
2. **Node.js 18+ & npm** ([Download Node.js](https://nodejs.org/))
3. **Git** ([Download Git](https://git-scm.com/))

---

## ⚡ Quick Start Guide (Run on Any Laptop)

### Step 1: Extract Zip & Open Terminal
Open your terminal (PowerShell, Command Prompt, or Bash) in the extracted project folder:
```bash
cd SIH2026
```

---

### Step 2: Set Up & Start Backend (Terminal 1)

```bash
# 1. Create a Python Virtual Environment (Recommended)
python -m venv venv

# 2. Activate Virtual Environment:
# On Windows:
.\venv\Scripts\activate
# On Mac / Linux:
source venv/bin/activate

# 3. Install Backend Dependencies:
pip install -r requirements.txt

# 4. Start the FastAPI Backend Server:
python -m uvicorn backend.main:app --reload --port 8000
```
> 🚀 **Backend runs at:** `http://localhost:8000`  
> 📖 **Interactive API Docs (Swagger):** `http://localhost:8000/docs`

---

### Step 3: Set Up & Start Frontend (Terminal 2)

Open a **second terminal window** in the same folder:
```bash
# 1. Navigate to frontend directory:
cd frontend

# 2. Install Frontend NPM Packages:
npm install

# 3. Start Vite Dev Server:
npm run dev
```
> 🌟 **Frontend runs at:** `http://localhost:5173`

---

## ⚙️ Environment Configuration (`.env`)
The platform includes built-in offline fallbacks and pre-cached continuous spatial fields so it runs immediately out-of-the-box. 

If you wish to configure live external satellite APIs:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your keys (Optional):
   - `FIRMS_MAP_KEY`: NASA FIRMS Satellite Active Fire Key ([Get Key](https://firms.modaps.eosdis.nasa.gov/api/map_key/))
   - `OPENAQ_API_KEY`: CPCB / OpenAQ Sensor Key ([Get Key](https://openaq.org/))
   - `GEE_SERVICE_ACCOUNT`: Google Earth Engine Service Account

---

## 📂 Project Architecture

```
SIH2026/
├── backend/
│   ├── main.py                     # FastAPI REST API & Telemetry Endpoints
│   ├── database.py                 # Supabase PostgreSQL Storage & Sync
│   └── requirements.txt            # Python Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.jsx     # Cosmic Space Hero & Cursor Constellation Tracker
│   │   │   ├── DashboardView.jsx   # Real-Time Telemetry HUD & District Breakdown
│   │   │   ├── LiveMapView.jsx     # 706-Grid High-Precision Satellite GIS Heatmap
│   │   │   ├── TransportView.jsx   # 48h Lagrangian Smoke Corridor & City Impact Matrix
│   │   │   ├── ForecastView.jsx    # 48h XGBoost ML Forecaster & Inversion Index
│   │   │   ├── HotspotsView.jsx    # Sentinel-5P HCHO Hotspots & DBSCAN Clusters
│   │   │   ├── FiresView.jsx       # NASA FIRMS Live Fire Detection
│   │   │   ├── AttributionView.jsx # Chemical Fingerprinting (Vehicular/Biomass/Industrial)
│   │   │   ├── DistrictAnalytics.jsx # Comprehensive 5-District Deep Dive
│   │   │   └── ReportsView.jsx     # Automated Executive PDF Exporter
│   │   ├── store.js                # Global State Management (Zustand)
│   │   └── index.css               # Design System & Cosmic Glow Utilities
│   └── package.json                # Frontend NPM Dependencies
│
├── models/
│   ├── aqi_model.py                # Multi-Seasonal XGBoost Surface Inversion Models
│   ├── hotspot_detection.py        # Spherical Haversine DBSCAN Hotspot Clustering
│   ├── transport_model.py          # Lagrangian Plume Advection & Briggs Plume Rise
│   ├── source_attribution.py       # Chemical Mass Balance (CMB) Attributor
│   ├── forecast_model.py           # 48h Lagged ML AQI Forecaster
│   ├── hyperlocal_model.py         # Multi-Layer Inverse Distance Spatial Interpolation
│   ├── explainability.py           # SHAP TreeExplainers for Causal Drivers
│   └── saved/                      # Serialized ML Model Weights (.pkl & metrics.json)
│
├── data_ingestion/                 # NASA FIRMS, Sentinel-5P, ERA5, & CPCB Ingestion
├── data_processing/                # 706 Spatial Cell Grid Builder & Satellite Sampler
├── requirements.txt                # Master Python Package List
└── README.md                       # Comprehensive Setup & Operations Guide
```

---

## 🧪 Verification & Health Check Commands

To verify all machine learning models and physics functions on the new machine:
```bash
# Verify all 6 XGBoost models, metrics, and SHAP explainers:
python verify_models.py

# Test backend API endpoints:
python -c "import requests; r = requests.get('http://127.0.0.1:8000/api/wind'); print(r.status_code, r.json().get('physics_telemetry'))"
```

---

## 🏆 Smart India Hackathon (SIH 2026)
* **Team:** VayuShetra Team
* **Live System:** Satellite-Driven Multi-Source Air Quality & Biomass Dispersion Platform
