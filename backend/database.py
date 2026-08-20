import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime

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

class SensitiveReceptor(Base):
    __tablename__ = "sensitive_receptors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

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

# Database Engine Configuration: Dual-Driver ORM (Supabase PostgreSQL / Local SQLite)
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
    Initializes database tables in Supabase (or SQLite) and default sensitive receptors.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Supabase PostgreSQL Database tables initialized successfully.")
    
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

def sync_dataframes_to_db(grid_df: pd.DataFrame, fires_df: pd.DataFrame = None):
    """
    Synchronizes in-memory and CSV dataframes directly to Supabase PostgreSQL.
    """
    if grid_df is None or grid_df.empty:
        return
        
    session = db_session()
    try:
        # Check existing dates in DB
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

        # Sync fire records
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
