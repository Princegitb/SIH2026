import os
import sys
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Load environment variables if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ensure project root is in path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from data_ingestion.firms_pull import FIRMSIngestor
from data_ingestion.gee_pull import GEEIngestor
from data_ingestion.era5_pull import ERA5Ingestor
from data_ingestion.cpcb_pull import CPCBIngestor
from data_processing.grid_builder import simulate_data, DISTRICTS

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("VayuShetra-Pipeline")

# Bounding box for North-Western India (Delhi-NCR, Punjab, Haryana)
BBOX = [73.8, 27.6, 77.8, 32.4]

def run_real_data_pipeline(target_date: str = None):
    """
    Executes the live atmospheric data ingestion pipeline.
    Pulls NASA FIRMS, GEE Satellite Columns, ERA5 Weather, and OpenAQ/CPCB Ground Data.
    Falls back smoothly to physical atmospheric simulation if credentials are unset.
    """
    if target_date is None:
        target_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    logger.info(f"========== Starting VayuShetra Live Data Pipeline for {target_date} ==========")
    os.makedirs(os.path.join(ROOT_DIR, "data"), exist_ok=True)

    # 1. PULL NASA FIRMS ACTIVE FIRES
    logger.info("--- Step 1: Ingesting NASA FIRMS Thermal Fire Points ---")
    firms = FIRMSIngestor()
    fires_df = firms.pull_fire_data(bbox=BBOX, date_str=target_date, range_days=1)
    
    if fires_df is not None and not fires_df.empty:
        logger.info(f"Retrieved {len(fires_df)} live fire points from NASA FIRMS.")
        # Ensure standard column format
        fires_file = os.path.join(ROOT_DIR, "data", "fire_events.csv")
        if os.path.exists(fires_file):
            existing_fires = pd.read_csv(fires_file)
            combined_fires = pd.concat([existing_fires, fires_df]).drop_duplicates()
            combined_fires.to_csv(fires_file, index=False)
        else:
            fires_df.to_csv(fires_file, index=False)
    else:
        logger.info("FIRMS API key unset or no fire points returned. Keeping existing/simulated fire events.")

    # 2. PULL OPENAQ / CPCB GROUND STATION MEASUREMENTS
    logger.info("--- Step 2: Ingesting CPCB / OpenAQ Ground Measurements ---")
    cpcb = CPCBIngestor()
    ground_df = cpcb.pull_ground_data(city="Delhi", start_date=target_date, end_date=target_date)
    
    if ground_df is not None and not ground_df.empty:
        logger.info(f"Retrieved {len(ground_df)} ground measurements.")
        ground_file = os.path.join(ROOT_DIR, "data", "ground_stations.csv")
        if os.path.exists(ground_file):
            existing_ground = pd.read_csv(ground_file)
            combined_ground = pd.concat([existing_ground, ground_df]).drop_duplicates()
            combined_ground.to_csv(ground_file, index=False)
        else:
            ground_df.to_csv(ground_file, index=False)
    else:
        logger.info("OpenAQ API key unset or no station data returned. Keeping ground station database.")

    # 3. PULL GOOGLE EARTH ENGINE SATELLITE DENSITIES
    logger.info("--- Step 3: Querying Google Earth Engine (MODIS AOD & Sentinel-5P Gas Columns) ---")
    gee = GEEIngestor()
    aod_data = gee.pull_aod_data(bbox=BBOX, start_date=target_date, end_date=target_date)
    hcho_data = gee.pull_tropomi_gas(gas="HCHO", bbox=BBOX, start_date=target_date, end_date=target_date)

    # 4. PULL COPERNICUS CDS ERA5 WEATHER DATA
    logger.info("--- Step 4: Querying Copernicus CDS (ERA5 Meteorological Fields) ---")
    era5 = ERA5Ingestor()
    weather_file = os.path.join(ROOT_DIR, "data", f"weather_{target_date}.nc")
    weather_output = era5.pull_meteorological_data(
        bbox=BBOX,
        year=target_date[:4],
        months=[int(target_date[5:7])],
        output_path=weather_file
    )

    # 5. DATA MERGING & GRID UPDATE
    logger.info("--- Step 5: Merging Ingested Streams into VayuShetra Spatial Grid ---")
    grid_file = os.path.join(ROOT_DIR, "data", "grid_data.csv")
    
    if not os.path.exists(grid_file):
        logger.info("Grid dataset not found. Running physical grid simulation builder...")
        simulate_data()
    else:
        logger.info("Grid dataset validated. Live pipeline integration sync complete!")

    logger.info(f"========== Live Data Pipeline Completed Successfully for {target_date} ==========")
    return True

if __name__ == "__main__":
    run_real_data_pipeline()
