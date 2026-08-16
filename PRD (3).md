# Product Requirements Document (PRD)
## AI-Driven Surface AQI Estimation & Formaldehyde (HCHO) Hotspot Detection Platform

**Project Code:** GGSIPU2603
**Organization:** University School of Automation & Robotics (USAR), GGSIPU
**Domain:** Remote Sensing, Geospatial AI, Deep Learning, Atmospheric Science
**Version:** 1.0
**Status:** Draft for Hackathon Submission

---

## 1. Executive Summary

India has fewer than 500 CPCB ground air-quality monitoring stations covering a country of 1.4 billion people and 3.3 million km². Most districts, especially rural and semi-urban areas, have zero real-time visibility into air quality. Meanwhile, satellites like INSAT-3D and Sentinel-5P (TROPOMI) continuously scan the entire country, capturing atmospheric column data — but this data is not directly usable as ground-level AQI, and requires model-based translation.

This platform converts satellite-derived atmospheric measurements into estimated surface-level AQI across all of India, identifies formaldehyde (HCHO) hotspots linked to biomass/crop-residue burning, traces how pollution physically travels using wind data, and presents everything through an interactive dashboard designed to support decision-making under the National Clean Air Programme (NCAP).

---

## 2. Problem Statement

### 2.1 Core Problem
Ground-based AQI monitoring in India is geographically sparse and economically expensive to scale. This creates a "coverage blindspot" — regions where citizens and policymakers have no way to know current air quality, and no historical baseline to measure improvement or degradation against NCAP targets.

### 2.2 Secondary Problem
Even where AQI is known to be poor, the *cause* is often unclear. Crop residue burning (stubble burning), particularly in Punjab and Haryana during October–November, is a major but seasonal and geographically specific contributor. Without source attribution, policy response is reactive and untargeted rather than precise.

### 2.3 Why This Matters Now
- NCAP has city-specific pollution reduction targets (competitively ranked cities) but relies heavily on the limited ground station network for compliance tracking.
- Stubble burning season directly overlaps with Delhi-NCR's worst AQI period, and current systems don't quantify how much of that specific spike is attributable to specific fire events versus other sources.

---

## 3. Goals & Objectives

| Goal | Description | Success Measure |
|---|---|---|
| G1 | Estimate surface AQI across India using satellite + weather data | Model RMSE within acceptable range vs CPCB ground truth |
| G2 | Detect and localize HCHO hotspots | Hotspot clusters correctly overlap with FIRMS fire data ≥80% of validated cases |
| G3 | Trace pollutant transport using wind data | Demonstrable time-lag correlation between fire event and downwind AQI change |
| G4 | Deliver an interactive, policymaker-usable dashboard | Judges/users can independently query any district and get an answer in <5 seconds |
| G5 | Support NCAP-aligned reporting | Auto-generated compliance flags for target cities |

---

## 4. Target Users / Personas

1. **Policymakers (CPCB, State Pollution Control Boards, NCAP officials)**
   Need: City/district-level AQI trends, source attribution, and compliance status to plan interventions (e.g., stubble burning bans, industrial regulation).

2. **Researchers / Environmental Scientists**
   Need: Access to model outputs, raw correlations, and exportable data for further study.

3. **Citizens / Journalists / NGOs**
   Need: Simple, visual, trustworthy answer to "how polluted is my area right now, and why?"

4. **Disaster/Health Response Teams**
   Need: Early alerts when AQI crosses hazardous thresholds near hospitals/schools.

---

## 5. Core Features (Baseline — from Problem Statement)

| # | Feature | Description |
|---|---|---|
| C1 | Surface AQI Estimation Model | Two-stage design: (1) deep learning model (CNN/LSTM/CNN-LSTM/Transformer) converts AOD + trace gas columns + meteorological data into estimated ground-level **pollutant concentrations** (PM2.5, PM10, NO₂, SO₂, CO, O₃); (2) a rule-based module applies the official CPCB sub-index breakpoint formula to those concentrations to compute the final composite AQI (max sub-index), exactly matching how India's real AQI is calculated |
| C2 | HCHO Hotspot Detection | Spatial clustering (DBSCAN) on HCHO column density to identify high-concentration zones |
| C3 | Fire Correlation | Cross-reference HCHO hotspots with MODIS/VIIRS active fire data to confirm biomass burning source |
| C4 | High-Resolution AQI Maps | Daily gridded AQI maps across India rendered as raster/heatmap layers |
| C5 | Interactive GIS Dashboard | Web-based map interface for exploring AQI, hotspots, and trends by region/date |
| C6 | Technical Documentation | Model methodology, validation results, and source code delivered as part of submission |

---

## 6. Unique / Differentiating Features (Added Value Beyond Baseline)

These are the features designed specifically to differentiate this solution from a standard "satellite-to-AQI regression" project.

| # | Feature | What It Does | Why It's Unique |
|---|---|---|---|
| U1 | **Wind-Based Pollution Transport Tracker** | Uses ERA5/MERRA-2 wind vector fields (u/v components) to simulate and animate how a plume from a specific fire/hotspot travels over the following 6–24 hours, and correlates this with AQI change at downwind grid cells | Most AQI dashboards show static maps. This creates a *causal, time-lagged narrative* — "this fire caused that AQI spike, here" — which is far more actionable for policy than two disconnected heatmaps |
| U2 | **Pollution Source Attribution Score** | For each grid cell, decomposes the AQI contribution into estimated percentages: biomass/stubble burning, vehicular, industrial — using the ratio and pattern of HCHO, NO₂, CO, and SO₂ signatures | Moves the platform from "what is the AQI" to "why is the AQI this way," directly useful for targeted policy (e.g., differentiating a traffic problem from a farm-fire problem) |
| U3 | **48-Hour AQI Forecast** | Combines short-term weather forecast data with recent fire/emission trends to project AQI 24–48 hours ahead, not just report current state | Enables proactive public health advisories instead of only reactive reporting |
| U4 | **Health-Risk Exposure Alerts** | Overlays AQI hotspots against locations of schools, hospitals, and elderly-care facilities (OpenStreetMap POI data) within a configurable radius, triggering alerts when thresholds are breached | Converts a generic environmental dashboard into a public-health decision tool |
| U5 | **NCAP Compliance Auto-Flagging** | Automatically compares each NCAP target city's rolling AQI average against its official reduction target and flags non-compliant cities/trends | Directly ties the technical output to the stated policy goal (NCAP) named in the problem statement, rather than leaving that connection implicit |
| U6 | **Model Explainability Layer** | Uses SHAP (SHapley Additive exPlanations) values to show which input features (AOD, wind, humidity, NO₂, etc.) most influenced a specific AQI prediction at a specific location/time | Addresses the most common judge question — "how do we trust this number" — with a transparent, feature-level answer instead of a black-box model |
| U7 | **Data Gap-Filling via Multi-Sensor Fusion** | When Sentinel-5P or INSAT-3D data is missing for a region/day (cloud cover, orbit gaps), the system fuses whichever sensor has valid data plus historical interpolation instead of leaving blank tiles | Improves real-world usability — satellite data has frequent gaps and most hackathon prototypes ignore this |
| U8 | **Citizen Validation Layer (Stretch Goal)** | Optional crowdsourced reporting (simple form: location + perceived air quality/visibility) used to sanity-check and calibrate the satellite-derived model in areas with no ground stations | Creates a feedback loop and demonstrates real-world deployability beyond a static dataset |

---

## 7. Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | System shall ingest daily satellite data (AOD, NO₂, SO₂, CO, O₃, HCHO) from Google Earth Engine |
| FR2 | System shall ingest CPCB ground station AQI data for model training and validation |
| FR3 | System shall ingest ERA5/MERRA-2 meteorological data (wind, humidity, temperature, boundary layer height) |
| FR4 | System shall ingest MODIS/VIIRS fire location data |
| FR5 | System shall train and serve a deep learning model that outputs estimated AQI per grid cell |
| FR6 | System shall detect HCHO hotspots via clustering and flag statistically significant concentrations |
| FR7 | System shall compute wind-based transport paths from hotspots and correlate with downwind AQI change |
| FR8 | System shall render all outputs on an interactive map with selectable layers and date range |
| FR9 | System shall generate a source attribution breakdown per selected region |
| FR10 | System shall flag NCAP target cities that exceed compliance thresholds |
| FR11 | System shall provide model explainability output per prediction |
| FR12 | System shall export reports (PDF/CSV) for a selected region and date range |

---

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard map interactions should respond within 2–3 seconds for cached data |
| Scalability | Pipeline architecture should support scaling from a pilot region (Delhi-NCR/Punjab/Haryana) to pan-India without redesign |
| Accuracy | Model validation must report RMSE/MAE against CPCB ground truth, not just visual plausibility |
| Availability | Daily data pipeline should handle missing/delayed satellite passes gracefully (see U7) |
| Usability | Dashboard must be usable by a non-technical policymaker without training |
| Transparency | All AQI outputs must be traceable to their contributing data sources (see U6) |

---

## 9. Scope Definition

### In Scope (Hackathon MVP)
- Pilot region: Delhi-NCR + Punjab + Haryana
- Time window: October–November (stubble burning season) using recent historical data
- Core AQI model + HCHO hotspot detection + wind transport correlation
- Interactive dashboard with at least features C1–C6 and U1, U2, U6 fully working
- U3, U4, U5, U7, U8 as stretch goals depending on remaining time

### Out of Scope (for MVP)
- Full real-time pan-India daily automated pipeline (architecture should support it, but full deployment is future work)
- Mobile app (web dashboard only for MVP)
- Multi-language dashboard localization

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| AQI model accuracy vs CPCB ground truth | RMSE competitive with published AOD→AQI literature benchmarks |
| Hotspot-fire correlation accuracy | ≥80% of detected hotspots overlap with confirmed FIRMS fire points |
| Dashboard load/query time | <5 seconds per query |
| Demo narrative clarity | Judges can independently trace one specific fire event to a specific AQI outcome using the dashboard |

---

## 11. Milestones / Timeline (3-Day Hackathon Build)

| Day | Milestone |
|---|---|
| Day 1 | Data pipeline: pull AOD, TROPOMI gases, CPCB, ERA5, FIRMS for pilot region; merge into unified grid dataset |
| Day 2 | Train AQI model (baseline → deep learning); build HCHO clustering; build source attribution logic |
| Day 3 | Wind transport correlation, dashboard integration (map + layers), explainability layer, final testing, demo rehearsal |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Satellite data gaps (cloud cover) | Missing AQI tiles | Multi-sensor fusion + interpolation (U7) |
| Limited CPCB ground stations for validation | Hard to prove model accuracy | Use k-fold validation on available stations; be transparent about limitations in report |
| Full India scope too ambitious for timeline | Incomplete/rushed demo | Restrict MVP to Delhi-NCR/Punjab/Haryana pilot region |
| Wind transport model oversimplified (no full atmospheric dispersion physics) | Correlation may be approximate, not exact | Present as a statistical correlation tool, not a full dispersion simulation — be explicit about this in the technical report |
| AQI is a composite max-sub-index formula, not a single smooth number | Direct end-to-end regression to "AQI" would implicitly (and poorly) approximate a discontinuous function | Predict individual pollutant concentrations first, then compute AQI via the official CPCB rule-based formula (see C1) |
| Very few CPCB stations in the pilot region to train/validate against | High risk of overfitting a complex model (e.g., Transformer) to a handful of locations | Always build and report the Random Forest/XGBoost baseline; use spatial (station-held-out) cross-validation, not random row-splitting; be willing to lead with the simpler model if it generalizes better |
| Satellite overpass (~1x/day) may miss actual stubble-burning periods (often early morning/evening) | Fire/HCHO signal in the data may undercount real burning activity | Explicitly document the system as a daily-averaged estimator, not a real-time burning detector; use VIIRS (better daily coverage than MODIS alone) to help close the gap |
| Wind-lag AQI correlation may be confounded by unrelated meteorology (e.g., temperature inversion, rainfall) happening at the same time as a fire | Risk of overstating a "fire caused this AQI spike" claim that is really driven by trapped air (low boundary layer height) | Control for boundary layer height and precipitation in the correlation analysis (partial correlation); present findings as statistical association, not proven causation |
| Data portal account approval delays (Google Earth Engine, Copernicus CDS, CPCB CCR, MOSDAC) | Could lose a full day of a 3-day hackathon waiting for API access | Register for every required account before the hackathon start; do not depend on same-day approval |
| INSAT-3D is not available via Google Earth Engine (requires separate MOSDAC access) | Team could lose time discovering this mid-build | Use MODIS/VIIRS AOD via GEE as the primary source for the MVP; treat INSAT-3D as an optional future addition |
| ERA5 is a reanalysis (historical) product, not a forecast product | The 48-hour forecast feature (U3) cannot be built on ERA5 alone | Use NOAA GFS or ECMWF Open Data forecast APIs for the forward-looking forecast feature |

---

## 13. Deliverables (per Problem Statement + Enhancements)

1. AI model for Surface AQI estimation (with validation report)
2. HCHO hotspot detection system
3. Biomass burning impact assessment (fire → AQI causal narrative)
4. Wind-based pollution transport visualization
5. Source attribution scoring system
6. NCAP compliance dashboard module
7. Model explainability report (SHAP-based)
8. Interactive GIS dashboard (full deliverable)
9. Technical report
10. Source code + model documentation
