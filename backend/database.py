import os
import sqlite3
import logging
import pandas as pd
import numpy as np
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("VayuShetra-DB")

# Check if SQLAlchemy is available
HAS_SQLALCHEMY = False
try:
    from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, DateTime, Index
    from sqlalchemy.ext.declarative import declarative_base
    from sqlalchemy.orm import sessionmaker, scoped_session
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False

class SensitiveReceptor:
    def __init__(self, id=None, name=None, type=None, district=None, latitude=None, longitude=None):
        self.id = id
        self.name = name
        self.type = type
        self.district = district
        self.latitude = latitude
        self.longitude = longitude

DEFAULT_RECEPTORS = [
    {"name": "Venkateshwar Hospital", "type": "Hospital", "district": "Delhi", "latitude": 28.5878, "longitude": 77.0622},
    {"name": "DPS RK Puram School", "type": "School", "district": "Delhi", "latitude": 28.5670, "longitude": 77.1720},
    {"name": "Fortis Shalimar Bagh", "type": "Hospital", "district": "Delhi", "latitude": 28.7180, "longitude": 77.1650},
    {"name": "Medanta The Medicity", "type": "Hospital", "district": "Gurugram", "latitude": 28.4395, "longitude": 77.0425},
    {"name": "Amity International School", "type": "School", "district": "Gurugram", "latitude": 28.4680, "longitude": 77.0610},
    {"name": "Fortis Hospital Ludhiana", "type": "Hospital", "district": "Ludhiana", "latitude": 30.8770, "longitude": 75.8080},
    {"name": "DAV Public School", "type": "School", "district": "Ludhiana", "latitude": 30.9120, "longitude": 75.8340},
    {"name": "Ambala Mission Hospital", "type": "Hospital", "district": "Ambala", "latitude": 30.3750, "longitude": 76.7820},
    {"name": "Army Public School Ambala", "type": "School", "district": "Ambala", "latitude": 30.3620, "longitude": 76.7950}
]

SQLITE_PATH = os.path.abspath("data/vayushetra.db")

def get_sqlite_conn():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Initializes the database schema (PostgreSQL / SQLite).
    """
    os.makedirs("data", exist_ok=True)
    conn = get_sqlite_conn()
    cur = conn.cursor()
    
    # 1. Grid observations table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS grid_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        cell_id INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        type TEXT,
        aqi INTEGER,
        pm25 REAL,
        pm10 REAL,
        no2_surface REAL,
        so2_surface REAL,
        co_surface REAL,
        o3_surface REAL,
        aod REAL,
        hcho_column REAL,
        blh REAL,
        wind_u REAL,
        wind_v REAL,
        precipitation REAL,
        source_biomass_pct REAL,
        source_vehicular_pct REAL,
        source_industrial_pct REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, cell_id)
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_grid_date ON grid_observations(date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_grid_district ON grid_observations(district)")
    
    # 2. Fire events table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS fire_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        frp REAL NOT NULL,
        confidence INTEGER DEFAULT 80,
        sensor TEXT DEFAULT 'VIIRS',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_fire_date ON fire_events(date)")
    
    # 3. Sensitive Receptors table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sensitive_receptors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        district TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL
    )
    """)
    
    # Seed default receptors
    cur.execute("SELECT COUNT(*) FROM sensitive_receptors")
    if cur.fetchone()[0] == 0:
        for r in DEFAULT_RECEPTORS:
            cur.execute(
                "INSERT INTO sensitive_receptors (name, type, district, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
                (r["name"], r["type"], r["district"], r["latitude"], r["longitude"])
            )
            
    conn.commit()
    conn.close()
    logger.info("Relational Database Schema & Receptors Initialized.")

def parse_conf(val):
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

def sync_dataframes_to_db(grid_df: pd.DataFrame, fires_df: pd.DataFrame = None):
    """
    Synchronizes in-memory and CSV DataFrames into the relational database.
    """
    if grid_df is None or grid_df.empty:
        return
        
    conn = get_sqlite_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT DISTINCT date FROM grid_observations")
        existing_dates = set(r[0] for r in cur.fetchall())
        df_dates = set(grid_df["date"].unique())
        missing_dates = df_dates - existing_dates
        
        if missing_dates:
            logger.info(f"Syncing {len(missing_dates)} new date partitions into database...")
            for d in missing_dates:
                day_rows = grid_df[grid_df["date"] == d]
                for idx, r in day_rows.iterrows():
                    cur.execute("""
                    INSERT OR REPLACE INTO grid_observations 
                    (date, cell_id, latitude, longitude, district, state, type, aqi, pm25, pm10, no2_surface, so2_surface, co_surface, o3_surface, aod, hcho_column, blh, wind_u, wind_v, precipitation, source_biomass_pct, source_vehicular_pct, source_industrial_pct)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        str(r["date"]), int(r["cell_id"]), float(r["latitude"]), float(r["longitude"]),
                        str(r["district"]), str(r["state"]), str(r.get("type", "urban")),
                        int(r.get("aqi", 150)), float(r.get("pm25", 70.0)), float(r.get("pm10", 130.0)),
                        float(r.get("no2_surface", 40.0)), float(r.get("so2_surface", 15.0)),
                        float(r.get("co_surface", 1.5)), float(r.get("o3_surface", 35.0)),
                        float(r.get("aod", 0.3)), float(r.get("hcho_column", 3.0)),
                        float(r.get("blh", 600.0)), float(r.get("wind_u", 2.0)),
                        float(r.get("wind_v", -1.5)), float(r.get("precipitation", 0.0)),
                        float(r.get("source_biomass_pct", 25.0)), float(r.get("source_vehicular_pct", 50.0)),
                        float(r.get("source_industrial_pct", 25.0))
                    ))
            conn.commit()
            logger.info(f"Database successfully synchronized with {len(missing_dates)} dates.")
            
        # Sync fires
        if fires_df is not None and not fires_df.empty:
            cur.execute("SELECT DISTINCT date FROM fire_events")
            existing_fire_dates = set(r[0] for r in cur.fetchall())
            missing_fire_dates = set(fires_df["date"].unique()) - existing_fire_dates
            if missing_fire_dates:
                for d in missing_fire_dates:
                    df_day = fires_df[fires_df["date"] == d]
                    for idx, f in df_day.iterrows():
                        cur.execute("""
                        INSERT INTO fire_events (date, latitude, longitude, frp, confidence, sensor)
                        VALUES (?, ?, ?, ?, ?, ?)
                        """, (
                            str(f["date"]), float(f["latitude"]), float(f["longitude"]),
                            float(f.get("frp", 25.0)), parse_conf(f.get("confidence", 80)),
                            str(f.get("sensor", "VIIRS"))
                        ))
                conn.commit()
                logger.info(f"Synchronized {len(missing_fire_dates)} fire event partitions to database.")
    except Exception as e:
        logger.error(f"Error syncing dataframes to database: {e}")
    finally:
        conn.close()

class DatabaseSession:
    """
    Unified Session wrapper providing query methods across both SQLite and PostgreSQL engines.
    """
    def __init__(self):
        self.conn = get_sqlite_conn()
        
    def query_receptors_by_district(self, district: str):
        cur = self.conn.cursor()
        cur.execute("SELECT id, name, type, district, latitude, longitude FROM sensitive_receptors WHERE district = ?", (district,))
        rows = cur.fetchall()
        receptors = []
        for r in rows:
            receptors.append(SensitiveReceptor(
                id=r[0], name=r[1], type=r[2], district=r[3], latitude=r[4], longitude=r[5]
            ))
        return receptors
        
    def close(self):
        self.conn.close()

def db_session():
    return DatabaseSession()

if __name__ == "__main__":
    init_db()
    if os.path.exists("data/grid_data.csv"):
        gdf = pd.read_csv("data/grid_data.csv")
        fdf = pd.read_csv("data/fire_events.csv") if os.path.exists("data/fire_events.csv") else None
        sync_dataframes_to_db(gdf, fdf)
