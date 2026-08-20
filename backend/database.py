import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Load environment variables if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("VayuShetra-DB")

from sqlalchemy import (
    create_engine, Column, Integer, Float, String, Boolean, DateTime, Index, text
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

Base = declarative_base()

# 1. Spatial Grid Observations (Master Atmospheric Telemetry)
class GridObservation(Base):
    __tablename__ = "grid_observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(12), nullable=False, index=True)
    cell_id = Column(Integer, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    district = Column(String(50), nullable=False, index=True)
    state = Column(String(50), nullable=False, index=True)
    type = Column(String(30))
    
    # Air Quality & Pollutants
    aqi = Column(Integer, index=True)
    pm25 = Column(Float)
    pm10 = Column(Float)
    no2_surface = Column(Float)
    so2_surface = Column(Float)
    co_surface = Column(Float)
    o3_surface = Column(Float)
    
    # Satellite Columns & Atmosphere
    aod = Column(Float)
    hcho_column = Column(Float, index=True)
    blh = Column(Float)
    wind_u = Column(Float)
    wind_v = Column(Float)
    precipitation = Column(Float)
    
    # Chemical Source Attribution
    source_biomass_pct = Column(Float)
    source_vehicular_pct = Column(Float)
    source_industrial_pct = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_date_district", "date", "district"),
        Index("idx_date_cell", "date", "cell_id", unique=True),
    )

# 2. NASA FIRMS Active Thermal Fire Anomalies
class FireEvent(Base):
    __tablename__ = "fire_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(12), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    frp = Column(Float, nullable=False)
    confidence = Column(Integer, default=80)
    sensor = Column(String(20), default="VIIRS")
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_fire_date_coord", "date", "latitude", "longitude"),
    )

# 3. Sensitive Receptors (Hospitals, Schools Proximity Directory)
class SensitiveReceptor(Base):
    __tablename__ = "sensitive_receptors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

# 4. Ground Station Observations (CPCB / OpenAQ Sensor Measurements)
class GroundMeasurement(Base):
    __tablename__ = "ground_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(12), nullable=False, index=True)
    station_name = Column(String(100), nullable=False, index=True)
    district = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    pm25 = Column(Float)
    pm10 = Column(Float)
    no2_surface = Column(Float)
    so2_surface = Column(Float)
    co_surface = Column(Float)
    o3_surface = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

# 5. 48-Hour ML Forecast Records
class ForecastRecord(Base):
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(12), nullable=False, index=True)
    district = Column(String(50), nullable=False, index=True)
    current_aqi = Column(Integer, nullable=False)
    day1_projected_aqi = Column(Integer, nullable=False)
    day1_inversion_risk = Column(String(30))
    day1_wind_speed = Column(Float)
    day2_projected_aqi = Column(Integer, nullable=False)
    day2_inversion_risk = Column(String(30))
    day2_wind_speed = Column(Float)
    model_name = Column(String(50), default="XGBoost-MultiStep-Lagged")
    created_at = Column(DateTime, default=datetime.utcnow)

# 6. NCAP Compliance & Target Tracking Records
class ComplianceRecord(Base):
    __tablename__ = "ncap_compliance_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(12), nullable=False, index=True)
    district = Column(String(50), nullable=False, index=True)
    rolling_30d_aqi = Column(Float, nullable=False)
    target_aqi = Column(Float, default=120.0)
    is_compliant = Column(Boolean, nullable=False)
    margin_aqi = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

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

# Database Engine Configuration
def get_db_engine():
    db_url = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
    
    if db_url:
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        logger.info(f"Connecting to Supabase PostgreSQL Database: {db_url.split('@')[-1] if '@' in db_url else 'Supabase'}")
        engine = create_engine(db_url, pool_size=10, max_overflow=20, pool_pre_ping=True)
    else:
        os.makedirs("data", exist_ok=True)
        sqlite_path = os.path.abspath("data/vayushetra.db")
        logger.info(f"Using SQLite Relational Engine: {sqlite_path}")
        engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
        
    return engine

engine = get_db_engine()
SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionFactory)

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

def init_db():
    """
    Initializes all 6 database tables in Supabase and seeds initial directories.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("All 6 Supabase PostgreSQL Database tables initialized successfully.")
    
    session = db_session()
    try:
        if session.query(SensitiveReceptor).count() == 0:
            for r in DEFAULT_RECEPTORS:
                session.add(SensitiveReceptor(**r))
            session.commit()
            logger.info("Sensitive receptor directory seeded.")
    except Exception as e:
        session.rollback()
        logger.warning(f"Receptor initialization notice: {e}")
    finally:
        session.close()

def sync_dataframes_to_db(grid_df: pd.DataFrame, fires_df: pd.DataFrame = None, ground_df: pd.DataFrame = None):
    """
    Synchronizes in-memory and CSV dataframes directly to Supabase PostgreSQL across all tables.
    """
    if grid_df is None or grid_df.empty:
        return
        
    session = db_session()
    try:
        # 1. Sync Grid Observations
        existing_dates = set(r[0] for r in session.query(GridObservation.date).distinct().all())
        df_dates = set(grid_df["date"].unique())
        missing_dates = df_dates - existing_dates
        
        if missing_dates:
            logger.info(f"Uploading {len(missing_dates)} date partitions into Supabase PostgreSQL...")
            for d in missing_dates:
                day_rows = grid_df[grid_df["date"] == d]
                obs_list = []
                for idx, r in day_rows.iterrows():
                    obs = GridObservation(
                        date=str(r["date"]),
                        cell_id=int(r["cell_id"]),
                        latitude=float(r["latitude"]),
                        longitude=float(r["longitude"]),
                        district=str(r["district"]),
                        state=str(r["state"]),
                        type=str(r.get("type", "urban")),
                        aqi=int(r.get("aqi", 150)),
                        pm25=float(r.get("pm25", 70.0)),
                        pm10=float(r.get("pm10", 130.0)),
                        no2_surface=float(r.get("no2_surface", 40.0)),
                        so2_surface=float(r.get("so2_surface", 15.0)),
                        co_surface=float(r.get("co_surface", 1.5)),
                        o3_surface=float(r.get("o3_surface", 35.0)),
                        aod=float(r.get("aod", 0.3)),
                        hcho_column=float(r.get("hcho_column", 3.0)),
                        blh=float(r.get("blh", 600.0)),
                        wind_u=float(r.get("wind_u", 2.0)),
                        wind_v=float(r.get("wind_v", -1.5)),
                        precipitation=float(r.get("precipitation", 0.0)),
                        source_biomass_pct=float(r.get("source_biomass_pct", 25.0)),
                        source_vehicular_pct=float(r.get("source_vehicular_pct", 50.0)),
                        source_industrial_pct=float(r.get("source_industrial_pct", 25.0))
                    )
                    obs_list.append(obs)
                session.bulk_save_objects(obs_list)
                session.commit()
                logger.info(f"Successfully uploaded {len(obs_list)} grid rows for {d} to Supabase PostgreSQL.")

        # 2. Sync Active Fire Events
        if fires_df is not None and not fires_df.empty:
            existing_fire_dates = set(r[0] for r in session.query(FireEvent.date).distinct().all())
            missing_fire_dates = set(fires_df["date"].unique()) - existing_fire_dates
            if missing_fire_dates:
                fire_list = []
                for d in missing_fire_dates:
                    df_day = fires_df[fires_df["date"] == d]
                    for idx, f in df_day.iterrows():
                        fe = FireEvent(
                            date=str(f["date"]),
                            latitude=float(f["latitude"]),
                            longitude=float(f["longitude"]),
                            frp=float(f.get("frp", 25.0)),
                            confidence=parse_conf(f.get("confidence", 80)),
                            sensor=str(f.get("sensor", "VIIRS"))
                        )
                        fire_list.append(fe)
                if fire_list:
                    session.bulk_save_objects(fire_list)
                    session.commit()
                    logger.info(f"Successfully uploaded {len(fire_list)} active fire events to Supabase PostgreSQL.")

        # 3. Sync Ground Station Measurements
        ground_file = "data/ground_stations.csv"
        if os.path.exists(ground_file) and session.query(GroundMeasurement).count() == 0:
            logger.info("Uploading Ground Station sensor measurements to Supabase...")
            gdf_raw = pd.read_csv(ground_file)
            g_list = []
            for idx, g in gdf_raw.iterrows():
                gm = GroundMeasurement(
                    date=str(g.get("date", "2025-11-05")),
                    station_name=str(g.get("station_name", f"Station {idx}")),
                    district=str(g.get("district", "Delhi")),
                    latitude=float(g["latitude"]),
                    longitude=float(g["longitude"]),
                    pm25=float(g.get("pm25", 60.0)),
                    pm10=float(g.get("pm10", 110.0)),
                    no2_surface=float(g.get("no2_surface", 35.0)),
                    so2_surface=float(g.get("so2_surface", 15.0)),
                    co_surface=float(g.get("co_surface", 1.2)),
                    o3_surface=float(g.get("o3_surface", 35.0))
                )
                g_list.append(gm)
            if g_list:
                session.bulk_save_objects(g_list)
                session.commit()
                logger.info(f"Successfully uploaded {len(g_list)} ground station observations to Supabase PostgreSQL.")

        # 4. Generate & Sync NCAP Compliance History
        if session.query(ComplianceRecord).count() == 0:
            logger.info("Calculating and uploading NCAP Compliance records to Supabase...")
            districts = grid_df["district"].unique()
            dates = grid_df["date"].unique()
            comp_list = []
            for d in dates:
                day_sub = grid_df[grid_df["date"] == d]
                for dist in districts:
                    dist_rows = day_sub[day_sub["district"] == dist]
                    if "aqi" in dist_rows.columns:
                        avg_aqi = float(dist_rows["aqi"].mean())
                    else:
                        avg_p25 = float(dist_rows["pm25"].mean()) if not dist_rows.empty else 60.0
                        avg_aqi = min(500.0, avg_p25 * 1.8)
                    is_comp = avg_aqi <= 120.0
                    margin = round(avg_aqi - 120.0, 1)
                    cr = ComplianceRecord(
                        date=str(d),
                        district=str(dist),
                        rolling_30d_aqi=round(avg_aqi, 1),
                        target_aqi=120.0,
                        is_compliant=is_comp,
                        margin_aqi=margin
                    )
                    comp_list.append(cr)
            if comp_list:
                session.bulk_save_objects(comp_list)
                session.commit()
                logger.info(f"Successfully uploaded {len(comp_list)} NCAP compliance records to Supabase PostgreSQL.")

    except Exception as e:
        session.rollback()
        logger.error(f"Error syncing dataframes to database: {e}")
    finally:
        session.close()

def get_db():
    db = SessionFactory()
    try:
        yield db
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    if os.path.exists("data/grid_data.csv"):
        gdf = pd.read_csv("data/grid_data.csv")
        fdf = pd.read_csv("data/fire_events.csv") if os.path.exists("data/fire_events.csv") else None
        sync_dataframes_to_db(gdf, fdf)
