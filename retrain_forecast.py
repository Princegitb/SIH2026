"""
Retrain the missing forecast_day1_xgb.pkl and forecast_day2_xgb.pkl models.

Pipeline:
1. Load grid_data.csv + fire_events.csv
2. Train 6 XGBoost pollutant models if not already on disk
3. Predict surface concentrations onto every grid row
4. Compute CPCB AQI per row
5. Train 2 XGBoost forecast models (Day +1, Day +2) and save to models/saved/

Run from project root: python retrain_forecast.py
"""
import os
import sys
import logging

import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("RetrainForecast")

from models.aqi_model import AQIModelManager, calculate_cpcb_aqi
from models.forecast_model import AQIForecastEngine

GRID_CSV = "data/grid_data.csv"
FIRES_CSV = "data/fire_events.csv"
MODELS_DIR = "models/saved"

# Columns the 6 pollutant XGBoost models need as features
FEATURE_COLS = [
    "temperature", "humidity", "blh", "wind_u", "wind_v", "precipitation",
    "aod", "no2_column", "so2_column", "co_column", "o3_column", "hcho_column",
]
POLLUTANT_COLS = ["pm25", "pm10", "no2_surface", "so2_surface", "co_surface", "o3_surface"]
MODEL_KEYS = ["pm25", "pm10", "no2_surface", "so2_surface", "co_surface", "o3_surface"]


def main():
    if not os.path.exists(GRID_CSV):
        logger.error(f"Missing {GRID_CSV}. Run simulate_data() first.")
        sys.exit(1)
    if not os.path.exists(FIRES_CSV):
        logger.warning(f"Missing {FIRES_CSV} — forecast will use 0 fire count.")

    grid_df = pd.read_csv(GRID_CSV)
    fires_df = pd.read_csv(FIRES_CSV) if os.path.exists(FIRES_CSV) else pd.DataFrame()
    logger.info(f"Loaded grid: {len(grid_df)} rows | fires: {len(fires_df)} rows")

    # ---------------------------------------------------------------
    # 1. Train or load the 6 pollutant XGBoost models
    # ---------------------------------------------------------------
    logger.info("Step 1: Loading / training pollutant XGBoost models...")
    aqi_mgr = AQIModelManager(models_dir=MODELS_DIR)
    aqi_mgr.load_models()  # safe to call; will only set attributes for found pkl files

    # If any model is missing, train all from ground_stations.csv
    missing = [k for k in MODEL_KEYS if aqi_mgr.models.get(k) is None]
    if missing:
        ground_csv = "data/ground_stations.csv"
        if not os.path.exists(ground_csv):
            logger.error(f"Missing {ground_csv}; cannot train pollutant models.")
            sys.exit(1)
        aqi_mgr.train_models(ground_csv)
    else:
        logger.info("All 6 pollutant XGBoost models already on disk.")

    # ---------------------------------------------------------------
    # 2. Predict surface concentrations for every grid row
    # ---------------------------------------------------------------
    logger.info("Step 2: Predicting surface concentrations onto full grid...")
    # Drop any prior prediction columns
    for c in POLLUTANT_COLS:
        if c in grid_df.columns:
            grid_df = grid_df.drop(columns=[c])

    feats = grid_df[FEATURE_COLS].copy()
    # AQI model expects feature columns in the same order; fill any NaN with median
    feats = feats.fillna(feats.median(numeric_only=True))

    for key, col in zip(MODEL_KEYS, POLLUTANT_COLS):
        model = aqi_mgr.models[key]
        if model is None:
            logger.warning(f"No model for {key}; skipping.")
            continue
        grid_df[col] = model.predict(feats)
    logger.info("Surface predictions complete.")

    # ---------------------------------------------------------------
    # 3. Compute AQI per row
    # ---------------------------------------------------------------
    logger.info("Step 3: Computing CPCB AQI per grid row...")
    aqi_values = []
    aqi_cats = []
    dominant = []
    for _, row in grid_df.iterrows():
        aqi_val, sub_indices, category = calculate_cpcb_aqi(row.to_dict())
        dom_pollutant = max(sub_indices, key=sub_indices.get).upper()
        aqi_values.append(aqi_val)
        aqi_cats.append(category)
        dominant.append(dom_pollutant)

    grid_df["aqi"] = aqi_values
    grid_df["aqi_category"] = aqi_cats
    grid_df["dominant_pollutant"] = dominant

    # Persist enriched grid so the backend doesn't have to recompute on next boot
    grid_df.to_csv(GRID_CSV, index=False)
    logger.info(f"Wrote enriched grid to {GRID_CSV} (with aqi column).")

    # ---------------------------------------------------------------
    # 4. Train forecast models
    # ---------------------------------------------------------------
    logger.info("Step 4: Training Day +1 and Day +2 forecast XGBoost models...")
    engine = AQIForecastEngine(models_dir=MODELS_DIR)
    engine.train_models(grid_df, fires_df if not fires_df.empty else None)

    # ---------------------------------------------------------------
    # 5. Quick smoke test
    # ---------------------------------------------------------------
    logger.info("Step 5: Smoke-testing predict_forecast()...")
    sample = grid_df.iloc[0].to_dict()
    forecast = engine.predict_forecast(sample, fires_count=10)
    logger.info(f"Forecast output: {forecast}")
    logger.info("✅ Done. Saved forecast_day1_xgb.pkl and forecast_day2_xgb.pkl to models/saved/")


if __name__ == "__main__":
    main()
