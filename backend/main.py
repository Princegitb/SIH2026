import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging


# Load environment variables if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Add project root to python path to resolve models imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)
os.chdir(ROOT_DIR)

from models.aqi_model import AQIModelManager, FEATURES
from models.hotspot_detection import HotspotDetector
from models.transport_model import WindTransportModel
from models.source_attribution import SourceAttributor
from models.explainability import AQIExplainer

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="VayuShetra API Service", version="1.0.0")

# Enable CORS for React dev server on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to React domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global database caches
grid_df = None
fires_df = None
model_manager = None
explainer = None
attributor = None
transport = None
hotspot_detector = None

@app.on_event("startup")
def startup_event():
    global grid_df, fires_df, model_manager, explainer, attributor, transport, hotspot_detector
    logger.info("Initializing models and loading datasets...")
    
    # Simple lock mechanism to prevent multi-worker race conditions on Render
    import time
    lock_file = "data/sim.lock"
    
    if not (os.path.exists("data/grid_data.csv") and os.path.exists("data/ground_stations.csv")):
        # Check if another worker is already generating the data
        if os.path.exists(lock_file):
            logger.info("Another worker is generating data, waiting...")
            while os.path.exists(lock_file) or not os.path.exists("data/grid_data.csv"):
                time.sleep(1)
        else:
            # Create lock file
            os.makedirs("data", exist_ok=True)
            with open(lock_file, "w") as f:
                f.write("locked")
            
            logger.info("Simulation datasets not found. Triggering automated grid builder simulator...")
            try:
                from data_processing.grid_builder import simulate_data
                simulate_data()
                logger.info("Simulation dataset generated successfully!")
            except Exception as e:
                logger.error(f"Failed to auto-generate simulation datasets: {e}")
                if os.path.exists(lock_file):
                    os.remove(lock_file)
                raise e
            finally:
                if os.path.exists(lock_file):
                    os.remove(lock_file)
            
    # Load raw datasets
    grid_df_raw = pd.read_csv("data/grid_data.csv")
    fires_df = pd.read_csv("data/fire_events.csv")
    
    # Auto-sync live date if missing
    try:
        from real_data_pipeline import run_real_data_pipeline
        run_real_data_pipeline()
        grid_df_raw = pd.read_csv("data/grid_data.csv")
        fires_df = pd.read_csv("data/fire_events.csv")
    except Exception as e:
        logger.warning(f"Startup live data sync notice: {e}")
        
    # Initialize model manager
    model_manager = AQIModelManager()
    
    # Auto-train models if missing
    model_files = []
    if os.path.exists("models/saved"):
        model_files = [f for f in os.listdir("models/saved") if f.endswith(".pkl")]
        
    if len(model_files) < 6:
        logger.info("Trained model files not found. Auto-training models on station data...")
        try:
            model_manager.train_models()
            logger.info("Model auto-training complete!")
        except Exception as e:
            logger.error(f"Failed to auto-train models: {e}")
            raise e
    else:
        model_manager.load_models()
    
    explainer = AQIExplainer(model_manager)
    explainer.initialize_explainers()
    
    attributor = SourceAttributor()
    transport = WindTransportModel()
    hotspot_detector = HotspotDetector(eps_deg=0.3, min_samples=2, hcho_percentile=85)
    
    # Precompute prediction grid and attribution to cache in memory
    logger.info("Precomputing predictions and chemical source attribution on grid...")
    pred_df = model_manager.predict_grid(grid_df_raw)
    grid_df = attributor.attribute_dataframe(pred_df)
    
    logger.info("FastAPI Backend ready and cached in memory!")

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"name": "VayuShetra Atmospheric Intelligence API", "status": "online", "version": "1.0.0"}

@app.get("/api/metadata")
def get_metadata():
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data, try again shortly.")
    dates = sorted(grid_df["date"].unique().tolist())
    states = ["All", "Delhi-NCR", "Punjab", "Haryana"]
    districts = sorted(grid_df["district"].unique().tolist())
    return {"dates": dates, "states": states, "districts": districts}

@app.get("/api/dashboard")
def get_dashboard(date: str = None, district: str = "Ambala"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data, try again shortly.")
    
    if not date or date not in grid_df["date"].values:
        date = str(grid_df["date"].max())
        
    # 1. Delhi metrics for Top KPI cards (acting as reference)
    delhi_day = grid_df[(grid_df["date"] == date) & (grid_df["district"] == "Delhi")]
    delhi_row = delhi_day.iloc[0] if not delhi_day.empty else None
    
    # Historical 7 days for Delhi sparklines
    delhi_7d = grid_df[(grid_df["district"] == "Delhi") & (grid_df["date"] <= date)].sort_values("date").tail(7)
    
    # 2. Selected Focus District metrics
    dist_day = grid_df[(grid_df["date"] == date) & (grid_df["district"] == district)]
    dist_row = dist_day.iloc[0] if not dist_day.empty else None
    
    # Historical 7 days for Focus District trend chart
    dist_7d = grid_df[(grid_df["district"] == district) & (grid_df["date"] <= date)].sort_values("date").tail(7)
    
    # Compute SHAP values for Selected District
    shap_explanation = None
    if dist_row is not None:
        input_row = pd.DataFrame([dist_row[FEATURES]], columns=FEATURES)
        sub_indices = {
            "pm25": float(dist_row["sub_index_pm25"]),
            "pm10": float(dist_row["sub_index_pm10"]),
            "no2": float(dist_row["sub_index_no2"]),
            "so2": float(dist_row["sub_index_so2"]),
            "co": float(dist_row["sub_index_co"]),
            "o3": float(dist_row["sub_index_o3"])
        }
        dominant_pol = max(sub_indices, key=sub_indices.get)
        
        # Map back to surface prediction key
        clean_dominant_mapping = {
            "pm25": "pm25", "pm10": "pm10", "no2": "no2_surface",
            "so2": "so2_surface", "co": "co_surface", "o3": "o3_surface"
        }
        clean_dominant_code = clean_dominant_mapping[dominant_pol]
        
        explainer_res = explainer.explain_prediction(input_row, clean_dominant_code)
        
        # Clean dictionary mapping key for web output
        web_shap = {}
        for k, v in explainer_res["shap_values"].items():
            web_shap[k] = float(v)
            
        shap_explanation = {
            "pollutant": dominant_pol.upper(),
            "base_value": float(explainer_res["base_value"]),
            "prediction_value": float(explainer_res["prediction_value"]),
            "shap_values": web_shap
        }

    # Format KPI response
    day_fires_count = len(fires_df[fires_df["date"] == date])
    kpis = {
        "aqi": int(delhi_row["aqi"]) if delhi_row is not None else 158,
        "pm25": float(delhi_row["pm25"]) if delhi_row is not None else 77.0,
        "pm10": float(delhi_row["pm10"]) if delhi_row is not None else 143.0,
        "hcho": 24, # simulated hotspots count
        "fires": day_fires_count,
        "wind": float(np.round(np.sqrt(delhi_row["wind_u"]**2 + delhi_row["wind_v"]**2) * 3.6, 1)) if delhi_row is not None else 18.0,
        "sparklines": {
            "aqi": delhi_7d["aqi"].tolist() if not delhi_7d.empty else [100]*7,
            "pm25": delhi_7d["pm25"].tolist() if not delhi_7d.empty else [50]*7,
            "pm10": delhi_7d["pm10"].tolist() if not delhi_7d.empty else [120]*7,
            "hcho": delhi_7d["hcho_column"].tolist() if not delhi_7d.empty else [1.5]*7,
            "fires": [45, 60, 85, 127, 95, 110, 127], # simulated timeline
            "wind": [12, 15, 18, 14, 16, 18, 18]
        }
    }
    
    focus_metrics = None
    if dist_row is not None:
        focus_metrics = {
            "district": district,
            "state": dist_row["state"],
            "aqi": int(dist_row["aqi"]),
            "pm25": float(dist_row["pm25"]),
            "pm10": float(dist_row["pm10"]),
            "no2": float(dist_row["no2_surface"]),
            "so2": float(dist_row["so2_surface"]),
            "co": float(dist_row["co_surface"]),
            "o3": float(dist_row["o3_surface"]),
            "aod": float(dist_row["aod"]),
            "hcho_column": float(dist_row["hcho_column"]),
            "blh": int(dist_row["blh"]),
            "wind_speed": float(np.round(np.sqrt(dist_row["wind_u"]**2 + dist_row["wind_v"]**2) * 3.6, 1)),
            "source_attribution": {
                "biomass": float(dist_row["source_biomass_pct"]),
                "vehicular": float(dist_row["source_vehicular_pct"]),
                "industrial": float(dist_row["source_industrial_pct"])
            },
            "trend": {
                "dates": dist_7d["date"].tolist(),
                "aqi": dist_7d["aqi"].tolist(),
                "pm25": dist_7d["pm25"].tolist(),
                "pm10": dist_7d["pm10"].tolist()
            },
            "shap": shap_explanation
        }
        
    return {"kpis": kpis, "focus": focus_metrics}

def parse_confidence(val):
    try:
        if pd.isna(val):
            return 80
        return int(float(val))
    except (ValueError, TypeError):
        val_str = str(val).lower().strip()
        if val_str == 'h':
            return 90
        elif val_str == 'l':
            return 40
        else:
            return 80

@app.get("/api/map-data")
def get_map_data(date: str = "2025-11-05", state: str = "All"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
        
    day_grid = grid_df[grid_df["date"] == date]
    if state != "All":
        day_grid = day_grid[day_grid["state"] == state]
        
    # Map cells records
    cells = []
    for idx, r in day_grid.iterrows():
        cells.append({
            "cell_id": int(r["cell_id"]),
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "district": r["district"],
            "state": r["state"],
            "aqi": int(r["aqi"]),
            "pm25": float(r["pm25"]),
            "pm10": float(r["pm10"]),
            "aod": float(r["aod"]),
            "blh": int(r["blh"]),
            "hcho": float(r["hcho_column"])
        })
        
    # Map active fires
    day_fires = fires_df[fires_df["date"] == date]
    fires = []
    for idx, f in day_fires.iterrows():
        # Keep fires inside bounding box of grid coordinates
        if 27.6 <= f["latitude"] <= 32.4 and 73.8 <= f["longitude"] <= 77.8:
            fires.append({
                "latitude": float(f["latitude"]),
                "longitude": float(f["longitude"]),
                "frp": float(f["frp"]),
                "confidence": parse_confidence(f.get("confidence", 80)),
                "sensor": str(f.get("sensor", "VIIRS"))
            })
            
    # Calculate HCHO Hotspots
    day_hotspots = hotspot_detector.detect_hotspots(day_grid, fires_df)
    hotspots = []
    for idx, h in day_hotspots[day_hotspots["is_hotspot"]].iterrows():
        hotspots.append({
            "latitude": float(h["latitude"]),
            "longitude": float(h["longitude"]),
            "hcho": float(h["hcho_column"]),
            "is_biomass": bool(h.get("is_biomass_driven", False)),
            "cluster_id": int(h["cluster_id"])
        })
        
    # Plume Trajectory for top 3 fires
    ref_wind = day_grid.iloc[0] if not day_grid.empty else None
    plumes = []
    if ref_wind is not None and len(day_fires) > 0:
        wind_u = float(ref_wind["wind_u"])
        wind_v = float(ref_wind["wind_v"])
        top_fires = day_fires.sort_values("frp", ascending=False).head(3)
        for idx, f in top_fires.iterrows():
            path = transport.project_plume_trajectory(f["latitude"], f["longitude"], wind_u, wind_v, hours=18, step_hours=3)
            plumes.append({
                "frp": float(f["frp"]),
                "path": path
            })
            
    # Sample wind vectors for display (10% of cells)
    wind_vectors = []
    if not day_grid.empty:
        wind_sample = day_grid.sample(frac=0.1, random_state=42)
        for idx, r in wind_sample.iterrows():
            wind_vectors.append({
                "latitude": float(r["latitude"]),
                "longitude": float(r["longitude"]),
                "u": float(r["wind_u"]),
                "v": float(r["wind_v"])
            })

    return {
        "cells": cells,
        "fires": fires,
        "hotspots": hotspots,
        "plumes": plumes,
        "wind_vectors": wind_vectors
    }

@app.get("/api/hotspots")
def get_hotspots(date: str = "2025-11-05"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
    day_grid = grid_df[grid_df["date"] == date]
    day_hotspots = hotspot_detector.detect_hotspots(day_grid, fires_df)
    
    records = []
    active_hotspots = day_hotspots[day_hotspots["is_hotspot"]]
    for idx, r in active_hotspots.iterrows():
        records.append({
            "district": r["district"],
            "state": r["state"],
            "latitude": float(r["latitude"]),
            "longitude": float(r["longitude"]),
            "hcho_column": float(r["hcho_column"]),
            "cluster_id": int(r["cluster_id"]),
            "is_biomass_driven": bool(r.get("is_biomass_driven", False))
        })
    return {"hotspots": records, "count": len(records)}

@app.get("/api/fires")
def get_fires(date: str = "2025-11-05"):
    day_fires = fires_df[fires_df["date"] == date]
    records = []
    for idx, f in day_fires.iterrows():
        records.append({
            "latitude": float(f["latitude"]),
            "longitude": float(f["longitude"]),
            "frp": float(f["frp"]),
            "confidence": parse_confidence(f.get("confidence", 80)),
            "sensor": str(f.get("sensor", "VIIRS"))
        })
    return {"fires": records, "count": len(records)}

@app.get("/api/wind")
def get_wind(date: str = "2025-11-05"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
    
    # 1. Trajectory paths
    day_grid = grid_df[grid_df["date"] == date]
    ref_wind = day_grid.iloc[0] if not day_grid.empty else None
    plumes = []
    if ref_wind is not None:
        wind_u = float(ref_wind["wind_u"])
        wind_v = float(ref_wind["wind_v"])
        day_fires = fires_df[fires_df["date"] == date]
        top_fires = day_fires.sort_values("frp", ascending=False).head(5)
        for idx, f in top_fires.iterrows():
            path = transport.project_plume_trajectory(f["latitude"], f["longitude"], wind_u, wind_v, hours=24, step_hours=3)
            plumes.append({
                "latitude": float(f["latitude"]),
                "longitude": float(f["longitude"]),
                "frp": float(f["frp"]),
                "path": path
            })
            
    # 2. Lag correlation data
    lag_results, merged_ts = transport.analyze_lagged_impact(grid_df, fires_df, upwind_state="Punjab", downwind_district="Delhi")
    lag_list = []
    for idx, row in lag_results.iterrows():
        lag_list.append({
            "lag_days": int(row["lag_days"]),
            "raw_correlation": float(row["raw_correlation"]),
            "partial_correlation": float(row["partial_correlation"])
        })
        
    return {"plumes": plumes, "lag_analysis": lag_list}

@app.get("/api/attribution")
def get_attribution(date: str = "2025-11-05", state: str = "All"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
    day_grid = grid_df[grid_df["date"] == date]
    if state != "All":
        day_grid = day_grid[day_grid["state"] == state]
        
    state_avg = day_grid.groupby("district").agg({
        "source_biomass_pct": "mean",
        "source_vehicular_pct": "mean",
        "source_industrial_pct": "mean"
    }).reset_index()
    
    records = []
    for idx, r in state_avg.iterrows():
        records.append({
            "district": r["district"],
            "biomass": float(np.round(r["source_biomass_pct"], 1)),
            "vehicular": float(np.round(r["source_vehicular_pct"], 1)),
            "industrial": float(np.round(r["source_industrial_pct"], 1))
        })
    return {"attribution": records}

@app.get("/api/compliance")
def get_compliance(date: str = "2025-11-05", district: str = "Ambala"):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
        
    sel_date_obj = datetime.strptime(date, "%Y-%m-%d")
    rolling_30_dates = [(sel_date_obj - timedelta(days=x)).strftime("%Y-%m-%d") for x in range(30)]
    
    district_rolling = grid_df[
        (grid_df["district"] == district) &
        (grid_df["date"].isin(rolling_30_dates))
    ]
    
    rolling_avg = 100.0
    if not district_rolling.empty:
        rolling_avg = float(district_rolling["aqi"].mean())
        
    # Check compliance status against NCAP target of 120
    ncap_target = 120.0
    is_compliant = rolling_avg <= ncap_target
    
    # Pre-detect hotspots for alerts
    day_grid = grid_df[grid_df["date"] == date]
    day_hotspots = hotspot_detector.detect_hotspots(day_grid, fires_df)
    
    district_hotspots = day_hotspots[
        (day_hotspots["district"] == district) & 
        (day_hotspots["is_hotspot"])
    ]
    
    alerts = []
    if not district_hotspots.empty:
        # Predefined sensitive receptors
        receptors = {
            "Delhi": [
                {"name": "Venkateshwar Hospital", "type": "Hospital", "dist_km": 3.4},
                {"name": "DPS RK Puram School", "type": "School", "dist_km": 5.1},
                {"name": "Fortis Shalimar Bagh", "type": "Hospital", "dist_km": 6.8}
            ],
            "Gurugram": [
                {"name": "Medanta The Medicity", "type": "Hospital", "dist_km": 2.8},
                {"name": "Amity International School", "type": "School", "dist_km": 4.5}
            ],
            "Ludhiana": [
                {"name": "Fortis Hospital Ludhiana", "type": "Hospital", "dist_km": 1.2},
                {"name": "DAV Public School", "type": "School", "dist_km": 3.7}
            ]
        }
        
        active_alerts = receptors.get(district, [
            {"name": f"{district} General Hospital", "type": "Hospital", "dist_km": 3.2},
            {"name": f"Government Model School, {district}", "type": "School", "dist_km": 4.5}
        ])
        alerts = active_alerts
        
    return {
        "rolling_average": float(np.round(rolling_avg, 1)),
        "target": ncap_target,
        "is_compliant": is_compliant,
        "alerts": alerts
    }

@app.get("/api/data-explorer")
def get_data_explorer(page: int = 1, limit: int = 100):
    if grid_df is None:
        raise HTTPException(status_code=503, detail="Service loading data.")
        
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    sliced_df = grid_df.iloc[start_idx:end_idx]
    
    records = []
    for idx, r in sliced_df.iterrows():
        records.append({
            "date": r["date"],
            "district": r["district"],
            "state": r["state"],
            "aqi": int(r["aqi"]),
            "pm25": float(r["pm25"]),
            "pm10": float(r["pm10"]),
            "no2_surface": float(r["no2_surface"]),
            "so2_surface": float(r["so2_surface"]),
            "co_surface": float(r["co_surface"]),
            "o3_surface": float(r["o3_surface"]),
            "aod": float(r["aod"]),
            "hcho_column": float(r["hcho_column"]),
            "blh": int(r["blh"])
        })
        
    return {
        "data": records,
        "page": page,
        "limit": limit,
        "total_records": len(grid_df)
    }

@app.post("/api/refresh-live-data")
def refresh_live_data(date: str = None):
    """
    Triggers the live satellite, weather, and fire data ingestion pipeline.
    """
    global grid_df, fires_df, model_manager, attributor
    try:
        from real_data_pipeline import run_real_data_pipeline
        success = run_real_data_pipeline(target_date=date)
        
        # Reload memory caches
        if os.path.exists("data/grid_data.csv"):
            grid_df_raw = pd.read_csv("data/grid_data.csv")
            fires_df = pd.read_csv("data/fire_events.csv")
            if model_manager and attributor:
                pred_df = model_manager.predict_grid(grid_df_raw)
                grid_df = attributor.attribute_dataframe(pred_df)
                
        latest_date = str(grid_df["date"].max()) if grid_df is not None else date
        return {"status": "success", "message": "Live data pipeline executed successfully", "latest_date": latest_date}
    except Exception as e:
        logger.error(f"Error running live data pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Start on port 8000
    uvicorn.run(app, host="127.0.0.1", port=8000)

