# Tech Stack Document
## AI-Driven Surface AQI Estimation & HCHO Hotspot Detection Platform

---

## 1. Overview of Architecture

The system is organized into five layers:

1. **Data Ingestion Layer** — pulls satellite, weather, fire, and ground-truth data
2. **Data Processing Layer** — cleans, grids, and merges all sources into a unified dataset
3. **Modeling Layer** — trains and serves the AQI prediction, HCHO clustering, and transport correlation models
4. **API/Backend Layer** — serves processed data and model outputs to the frontend
5. **Presentation Layer** — the interactive dashboard end users interact with

Each layer, and every technology choice within it, is explained below along with *why* it was chosen.

---

## 2. Data Ingestion Layer

| Data | Source | Access Method | Why This Source |
|---|---|---|---|
| Aerosol Optical Depth (AOD) | **MODIS/VIIRS (via Google Earth Engine) — primary**; INSAT-3D (MOSDAC) — optional/future | GEE Python API for MODIS/VIIRS; direct MOSDAC portal (manual registration required) for INSAT-3D | **Correction after review:** INSAT-3D products are *not* hosted on Google Earth Engine — GEE only hosts NASA/ESA/Copernicus catalogs. MODIS/VIIRS AOD (both natively on GEE) should be the primary AOD source for the hackathon build. INSAT-3D requires a separate MOSDAC account that can take days to get approved — treat it as a future/optional data source, not a Day-1 dependency |
| NO₂, SO₂, CO, O₃, HCHO | Sentinel-5P TROPOMI | Google Earth Engine Python API | TROPOMI is the highest-resolution publicly available trace-gas sensor; GEE hosts it as an analysis-ready collection |
| Ground truth AQI | CPCB CCR Portal / OpenAQ API | REST API / CSV export | This is the "real answer" used to train and validate the model — without it, the model has no way to learn the AOD-to-AQI relationship |
| Meteorological data (wind u/v, humidity, temperature, boundary layer height) | ERA5 (Copernicus Climate Data Store) or MERRA-2 | CDS API / GEE | Wind and humidity directly affect how pollutants disperse — AOD alone is not enough to estimate ground AQI, weather correction is essential |
| Fire activity | MODIS/VIIRS Active Fire Product (NASA FIRMS) | FIRMS API | Standard, reliable, near-real-time fire detection dataset used globally for biomass burning studies |
| Points of interest (schools, hospitals) | OpenStreetMap (via Overpass API) | Overpass API | Free, open, sufficiently detailed for health-risk exposure alerting (Feature U4) |

**Why Google Earth Engine as the central data hub:** Instead of separately managing downloads from 4-5 different satellite/weather providers with different formats and projections, GEE provides a single Python interface that can pull, reproject, and pre-aggregate most of these datasets consistently. This saves significant engineering time in a hackathon timeline.

**⚠️ Practical gotcha — register for accounts before Day 1:** Google Earth Engine, Copernicus CDS (for ERA5), CPCB CCR portal, and MOSDAC (if used) all require account creation, and some require manual approval that can take 1-3 days. Register for all of these *before* the hackathon clock starts — losing half of Day 1 to a pending API key approval is a common, avoidable failure mode.

---

## 3. Data Processing Layer

| Tool | Purpose | Why Chosen |
|---|---|---|
| **Python** | Core processing language | Universal support across all geospatial/ML libraries needed |
| **GeoPandas** | Handling vector geospatial data (points, polygons, station locations) | Standard for combining tabular data with geographic coordinates |
| **Rasterio / GDAL** | Handling raster data (satellite imagery grids) | Industry standard for reading/writing/reprojecting satellite raster formats |
| **NumPy / Pandas** | Numerical processing and tabular data merging | Needed to build the unified grid dataset (AOD + gases + weather + fire + AQI per cell) |
| **xarray** | Handling multi-dimensional climate/satellite data (time x lat x lon) | ERA5 and satellite data are naturally multi-dimensional; xarray is purpose-built for this instead of forcing everything into flat tables prematurely |

**Key processing step:** All data sources arrive at different spatial resolutions and time intervals. This layer's core job is **regridding everything onto a common spatial grid** (e.g., 10km x 10km cells across the pilot region) and a common daily time step, producing one unified dataset where each row = one grid cell on one day, with all variables (AOD, gases, wind, fire count, ground AQI if available) as columns.

---

## 4. Modeling Layer

### 4.1 Surface AQI Estimation Model

| Component | Choice | Why |
|---|---|---|
| Prediction target (Stage 1) | Individual pollutant surface concentrations — PM2.5, PM10, NO₂, SO₂, CO, O₃ — **not** the final AQI number directly | India's official AQI is a composite index that takes the *maximum* sub-index across 8 pollutants (a non-smooth, rule-based function) — regressing directly to this single number forces the model to implicitly learn a discontinuous formula. Predicting the underlying pollutant concentrations is more physically grounded, more accurate, and more explainable |
| AQI computation (Stage 2) | Rule-based CPCB breakpoint formula applied to Stage-1 outputs (not a model) | This reproduces the *actual* published CPCB methodology exactly, so the final AQI number is defensible and auditable rather than a black-box estimate |
| Primary model (Stage 1) | Transformer-based spatiotemporal model (or CNN-LSTM as fallback) | Transformers can attend across both space and time simultaneously, which suits the problem better than a plain CNN (spatial only) or plain LSTM (temporal only). CNN-LSTM is a reasonable, faster-to-build fallback if time is limited |
| Baseline model | Random Forest / XGBoost | Always build this first — it trains in minutes, gives a benchmark, and helps sanity-check the deep learning model isn't underperforming a simple baseline. **Given how few CPCB stations exist in the pilot region, this baseline may end up being the more reliable, defensible choice — don't be afraid to lead the demo with it if the Transformer overfits** |
| Framework | PyTorch (or TensorFlow) | Both are viable; PyTorch is generally faster to prototype with for custom architectures like spatiotemporal transformers |
| Validation method | Spatial k-fold cross-validation (hold out entire stations, not random rows) against CPCB ground truth | Random row-splitting leaks information because nearby grid-days from the same station are highly correlated — holding out entire stations gives a much more honest estimate of how well the model generalizes to *unmonitored* areas, which is the actual use case |
| Column-to-surface conversion | All satellite trace-gas products (AOD **and** NO₂/SO₂/CO/O₃) measure an atmospheric *column* value, not ground-level concentration | This conversion depends heavily on boundary layer height (BLH) and humidity — a shallow BLH (common in Delhi winter temperature inversions) traps pollutants near the surface and produces a very different surface concentration than the same column value on a day with a deep, well-mixed BLH. BLH should be treated as one of the most important model features, not a minor meteorological input |

### 4.2 HCHO Hotspot Detection

| Component | Choice | Why |
|---|---|---|
| Clustering algorithm | DBSCAN | Unlike k-means, DBSCAN doesn't require pre-specifying the number of hotspots and naturally handles irregularly shaped pollution zones and noise/outliers |
| Thresholding | Statistical anomaly detection (e.g., top percentile of HCHO column density relative to regional baseline) | Ensures hotspots are flagged relative to what's abnormal for that region, not an arbitrary global cutoff |

### 4.3 Wind-Based Transport Correlation (Feature U1)

| Component | Choice | Why |
|---|---|---|
| Wind vector processing | ERA5 u/v wind components | Provides direction and speed needed to project plume movement |
| Transport projection | Simplified Lagrangian trajectory approximation (not full atmospheric dispersion physics like HYSPLIT) | Full dispersion modeling (e.g., NOAA HYSPLIT) is too heavy for a hackathon timeline; a simplified directional projection is sufficient to demonstrate the causal narrative convincingly without requiring a full atmospheric physics simulation |
| Correlation analysis | Time-lagged cross-correlation between fire/HCHO event and downwind AQI change, **controlling for boundary layer height and precipitation** (partial correlation, not raw correlation) | A raw lag-correlation risks confounding — an AQI spike after a fire could just as easily be caused by a temperature inversion (falling BLH trapping pollution) happening around the same time, independent of the fire. Controlling for BLH/rain makes the "fire caused this" claim meaningfully more defensible. Present results as a *statistical association*, not proof of causation — full atmospheric dispersion physics (e.g., HYSPLIT) would be needed to claim true causality |

### 4.4 Source Attribution Model (Feature U2)

| Component | Choice | Why |
|---|---|---|
| Approach | Rule-based ratio analysis (HCHO:NO₂:CO:SO₂ signatures) initially, optionally upgraded to a trained classifier | Biomass burning, vehicular, and industrial sources have distinct known gas signatures in atmospheric chemistry literature — a ratio-based approach is explainable and fast to build, and can be upgraded to an ML classifier if time allows |

### 4.5 48-Hour AQI Forecast (Feature U3)

| Component | Choice | Why |
|---|---|---|
| Weather forecast source | NOAA GFS (via NOMADS or the Open-Meteo API) or ECMWF Open Data | **Correction after review:** ERA5 is a *reanalysis* product — it only contains past, already-observed weather, and cannot be used to forecast the future. A genuine forecast feature needs an actual forecast model output (GFS/ECMWF), which is a different API from the one used for historical training data |
| Forecast approach | Feed forecasted wind/humidity/BLH + recent fire/emission trend into the trained Stage-1 model | Reuses the same AQI model — only the input weather data changes from "observed" (ERA5) to "forecasted" (GFS) |

### 4.6 Explainability Layer (Feature U6)

| Component | Choice | Why |
|---|---|---|
| Explainability method | SHAP (SHapley Additive exPlanations) | Industry-standard method for explaining individual predictions from tree-based or deep learning models; directly answers "why did the model predict this AQI value" |

---

## 5. API / Backend Layer

**⚠️ Revised recommendation after review:** A full FastAPI + PostGIS + Redis stack is more infrastructure than a 3-day hackathon timeline can justify, and building/debugging it eats time that should go toward the model and correlation logic — the actual novelty. Two tracks are given below; **use the MVP track unless the team specifically wants to demonstrate production-readiness.**

| Tool | Purpose | Why Chosen |
|---|---|---|
| **MVP track: GeoParquet / Parquet files, loaded directly in the Streamlit app** | Storing and querying processed grid data | No server to run or debug; Pandas/GeoPandas can query a well-indexed Parquet file fast enough for a demo dataset scoped to one pilot region. Zero infrastructure risk during the demo |
| **Future/production track: FastAPI** | Backend API serving model predictions and processed data to a separate frontend | Needed once the system moves beyond a single demo dataset to a live, multi-user, daily-refreshing service |
| **Future/production track: PostGIS (PostgreSQL + spatial extension)** | Storing processed grid data, hotspot points, and station locations with spatial querying | Only pays off once data volume/query patterns exceed what a flat file can handle efficiently |
| **Future/production track: Redis** | Caching frequent dashboard queries | Only relevant at multi-user, production scale — not needed for a single-demo hackathon dashboard |

---

## 6. Presentation / Dashboard Layer

| Tool | Purpose | Why Chosen |
|---|---|---|
| **Streamlit** | Primary dashboard framework | Pure Python, extremely fast to build interactive apps with, ideal for hackathon timelines where a dedicated frontend developer/framework (React) would take too long to build and connect |
| **Plotly** | Interactive charts (time-series AQI trends, source attribution breakdowns) | Native Streamlit integration, interactive out of the box (zoom, hover tooltips) |
| **Folium / Leaflet.js (via Streamlit-Folium)** | Interactive map layers (AQI heatmap, hotspots, fire points, wind vectors) | Leaflet-based maps are lightweight and well-supported for rendering multiple toggleable geospatial layers |
| **QGIS (for offline map/asset preparation)** | Preparing static high-resolution map exports for the technical report | Standard GIS tool for producing publication-quality maps, used outside the live dashboard for the report deliverable |

**Note on stack choice:** If the team has strong frontend developers available and more time, a React + Mapbox GL JS frontend with the FastAPI backend would produce a more polished, production-like dashboard. Streamlit is recommended specifically for hackathon time constraints — it gets a working interactive dashboard built in hours instead of days.

---

## 7. Full Tech Stack Summary

**Languages:** Python (primary), SQL (for PostGIS queries)

**Data Sources:** INSAT-3D (MOSDAC), Sentinel-5P TROPOMI, CPCB CCR/OpenAQ, ERA5/MERRA-2, MODIS/VIIRS FIRMS, OpenStreetMap

**Data Access:** Google Earth Engine Python API, Copernicus CDS API, FIRMS API, Overpass API

**Data Processing:** Pandas, NumPy, GeoPandas, Rasterio, GDAL, xarray

**Machine Learning:** PyTorch (or TensorFlow), Scikit-learn (baseline models), XGBoost, SHAP

**Clustering/Spatial Analysis:** Scikit-learn (DBSCAN), GeoPandas

**Backend:** FastAPI, PostgreSQL + PostGIS, Redis (optional)

**Frontend/Dashboard:** Streamlit, Plotly, Folium/Streamlit-Folium

**GIS Tools:** QGIS (for static report maps), ArcGIS (optional, if institutional license available)

**Deployment (if going beyond hackathon demo):** Docker (containerization), a scheduled job runner (Airflow or simple cron) for the daily data pipeline, cloud hosting (AWS/GCP — GEE integrates natively with GCP)

---

## 8. Suggested Folder Structure

```
aqi-hcho-platform/
├── data_ingestion/
│   ├── gee_pull.py          # Pulls AOD, TROPOMI gases from Earth Engine
│   ├── cpcb_pull.py         # Pulls ground station AQI data
│   ├── era5_pull.py         # Pulls weather/wind data
│   └── firms_pull.py        # Pulls fire location data
├── data_processing/
│   ├── grid_builder.py      # Regrids all sources to unified spatial grid
│   └── merge_datasets.py    # Merges into final training dataset
├── models/
│   ├── aqi_model.py         # Transformer/CNN-LSTM AQI prediction model
│   ├── baseline_model.py    # Random Forest/XGBoost baseline
│   ├── hotspot_detection.py # DBSCAN clustering for HCHO hotspots
│   ├── transport_model.py   # Wind-based plume transport correlation
│   ├── source_attribution.py# Source attribution scoring logic
│   └── explainability.py    # SHAP-based explanation generator
├── backend/
│   ├── main.py               # FastAPI app entry point
│   └── routes/                # API endpoints for dashboard
├── dashboard/
│   └── app.py                 # Streamlit dashboard application
├── reports/
│   └── technical_report.pdf
└── README.md
```

---

## 9. Why This Stack Works for a Hackathon Timeline

- **Google Earth Engine** eliminates the most time-consuming part of a project like this — manually sourcing and preprocessing multiple satellite datasets.
- **Streamlit + Plotly + Folium** allows a fully interactive geospatial dashboard to be built by a Python-only team without needing dedicated frontend engineering time.
- **Baseline-first modeling (XGBoost before Transformer)** ensures there's always a working, demoable model even if the more advanced architecture doesn't finish training in time.
- **PostGIS** is optional for MVP (a well-structured Pandas/GeoPandas pipeline can work for a 3-day demo) but is included as the natural next step for anyone extending this into a real deployed system.
