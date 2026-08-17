# VayuShetra — Geospatial AI & Satellite Intelligence Platform

**VayuShetra** is a state-of-the-art Geospatial AI & Satellite Intelligence platform designed to estimate ground-level Air Quality Index (AQI) and track atmospheric pollution dispersion.

India has fewer than 500 ground monitoring stations for a population of 1.4 billion, leaving rural and agricultural basins with zero real-time AQI visibility. **VayuShetra solves this by converting satellite-measured column densities into ground-level AQI predictions** using a suite of machine learning models and meteorological datasets.

---

## 1. 🌌 The Interactive Space Landing Page (Initial Gateway)
Before entering the dashboard, users land on a dark-space landing screen:
*   **CPCB & Satellite Header**: Clear branding (`🛰️ VayuShetra`) with a header displaying *Real-time Air Intelligence Powered by Satellite & CPCB*.
*   **Orbital Scanning Visual**: A rotating 3D Earth graphic wrapped in glowing green and cyan scanning orbits, with an orbiting satellite that casts a pulsing laser light cone.
*   **Interactive Floating Widgets**: Three interactive cards hover in orbit that change on mouse hover and feature real-time animated sparklines:
    1.  **AQI Card**: Shows live Delhi-NCR stats (`76 Satisfactory`) with a green SVG sparkline.
    2.  **Wind Velocity Card**: Displays live wind speeds (`9 km/h`) with vectors.
    3.  **Active Fires Card**: Shows active MODIS/VIIRS detected fire counts (`3 Detected`) with an orange flame sparkline.
*   **Features Grid & Gateway CTAs**: Showcases the value propositions (Satellite-Powered, AI Intelligence, Hyperlocal Insights, Actionable Alerts, Data You Can Trust). Clicking **Explore Live Dashboard** or **Get Started** transitions to the dashboard workspace.

---

## 2. 🗺️ Consolidated GIS Map Views (Dashboard & Live Map)
Instead of plotting 706 grid boxes, the maps group cells into **15 district center markers** representing Delhi, Punjab, and Haryana:
*   **Marker Properties**: The markers dynamically update their color (CPCB standard) and scale their radius based on the active layer value (AQI, PM2.5, PM10, or HCHO).
*   **Hotspot Halos**: A low-opacity outer ring (radius `15,000m`) surrounds each district center to visualize plume dispersion.
*   **Popup Statistics**: Clicking a district opens a breakdown listing AQI, PM2.5, PM10, and HCHO column values simultaneously.
*   **Automatic Redraw**: Dynamic keys force Leaflet to recreate the markers when switching layers, and reload the tile layer from **CartoDB Dark Matter** to **CartoDB Positron** when toggling Light/Dark themes.

---

## 3. 🖥️ The 12 UI Workspace Sections
Once users enter the main dashboard workspace, they can toggle through 12 specific analytics views via the interactive sidebar:

### 1. 📊 Dashboard (`DashboardView.jsx`)
*   **KPI Cards**: Four stats cards (Estimated AQI, Particulate Matter, HCHO Hotspots, Active Fires) with 7-day sparklines.
*   **AI Atmosphere Insight Banner**: A smart banner highlighting formaldehyde concentrations and smoke transport forecasts.
*   **Interactive Map**: Left pane showing the GIS overlay of district markers, fire anomalies, and plume advection lines.
*   **Analysis Target (Right Panel)**: Deep-dive dropdown selection for a specific district showing:
    *   *CPCB AQI Dial*: A semi-circular gauge displaying the composite index.
    *   *Pollutant Progress Bars*: Concentration scales for PM2.5, PM10, and ozone.
    *   *Atmospheric Gas Columns*: Grid showing NO₂, SO₂, and CO values.
    *   *7-Day Trend Line Chart*: Recharts chart mapping historical concentrations.

### 2. 🗺️ Live Map (`LiveMapView.jsx`)
*   A full-screen Map container with visibility checkboxes to isolate/layer **District Markers**, **HCHO Hotspots**, **Active Fires**, and **Plume Trajectories** simultaneously.
*   Includes base layer selectors (AQI, PM2.5, PM10, HCHO) to dynamically recolor the live district centers.

### 3. 🔮 AQI Forecast (`ForecastView.jsx`)
*   **Proactive 48-Hour Projections**: Details Day +1 (Tomorrow) and Day +2 (Day After Tomorrow) AQI predictions computed from weather patterns and recent fire trends.
*   **Meteorological Forecast Alerts**: A themed warning banner (light-adaptive colors) notifying users of conditions like **Temperature Inversions** that trap surface emissions.

### 4. 🎯 HCHO Hotspots (`HotspotsView.jsx`)
*   Identifies formaldehyde clusters (stubble smoke proxies) grouped via the **DBSCAN machine learning model**.
*   Lists coordinates, cluster IDs, and cross-references them with MODIS thermal points to flag them as "Biomass-Driven".

### 5. 🔥 Fire Detection (`FiresView.jsx`)
*   Tracks thermal coordinates directly from NASA's MODIS/VIIRS satellites.
*   Lists coordinates, sensor types, and Fire Radiative Power (FRP in Megawatts) with custom badges highlighting **Critical Energy** (> 100 MW) anomalies.

### 6. 🌬️ Wind Transport (`TransportView.jsx`)
*   Models smoke plume advection using Lagrangian wind vectors.
*   **Lagged Causal Correlation Chart**: A bar chart comparing raw Pearson correlation vs. meteorology-controlled partial correlation (adjusting for boundary layer compression and rain), showing the direct AQI impact of Punjab fires on Delhi-NCR.

### 7. 🧪 Source Attribution (`AttributionView.jsx`)
*   A stacked bar chart comparing the percentage of air pollution driven by **Biomass Burning**, **Vehicular Combustion**, and **Industrial Emissions** across districts.

### 8. 📈 District Analytics (`DistrictAnalyticsView.jsx`)
*   Side-by-side district comparison charts to analyze which regions are exceeding NCAP target limits.

### 9. 📋 Reports (`ReportsView.jsx`)
*   Compiles monthly rolling averages to evaluate compliance with the National Clean Air Programme (NCAP) target of `120 AQI`.

### 10. 🚨 Actionable Alerts (`AlertsView.jsx`)
*   Triggers safety alerts when active fire anomalies fall within dangerous buffer zones around sensitive receptors (hospitals, schools, residential hubs).

### 11. 📊 Data Explorer (`DataExplorerView.jsx`)
*   A paginated raw grid dataset table allowing researchers to query and export CSV measurements.

### 12. ⚙️ Settings (`SettingsView.jsx`)
*   Allows operators to adjust key platform parameters, such as HCHO cluster thresholds, CPCB rules, and NCAP compliance targets.

---

## 4. 🧠 The Backend AI/ML & Atmospheric Models
The backend is built on **FastAPI** and is powered by four key computational modules:
1.  **XGBoost Surface Regressors**: Six separate models predict ground-level concentrations (PM2.5, PM10, NO₂, SO₂, CO, O₃) using satellite AOD and Copernicus ERA5 weather inputs. They are trained with **Spatial GroupKFold** to ensure robust performance across districts.
2.  **DBSCAN Clustering**: Clusters high-formaldehyde cells to identify agricultural stubble burning regions.
3.  **SHAP TreeExplainer**: Computes game-theory shapley values to show which variables (e.g., wind direction, boundary layer compression, local emissions) drove each AQI prediction.
4.  **Meteorological Partial Correlation**: Regresses out meteorological noise to statistically isolate biomass smoke causal coefficients.
