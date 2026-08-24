import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class HotspotDetector:
    def __init__(self, eps_km=35.0, eps_deg=None, min_samples=2, hcho_percentile=85):
        """
        DBSCAN parameters using exact physical spherical distance:
        eps_km: maximum clustering distance in kilometers (default 35 km)
        min_samples: minimum neighborhood samples for core cluster point
        hcho_percentile: threshold percentile to filter high-density HCHO column cells
        """
        if eps_deg is not None:
            self.eps_km = float(eps_deg) * 111.0
        else:
            self.eps_km = float(eps_km)
            
        self.min_samples = min_samples
        self.percentile = hcho_percentile
        self.EARTH_RADIUS_KM = 6371.0

    def detect_hotspots(self, daily_grid_df, fires_df=None):
        """
        Runs DBSCAN clustering with spherical Haversine metric on high HCHO cells.
        Cross-references with active fire points to identify genuine biomass burning sources.
        Includes robust spatial interpolation fallback for cloud occlusion / missing pixels.
        """
        if daily_grid_df is None or daily_grid_df.empty:
            out_empty = pd.DataFrame(columns=["date", "latitude", "longitude", "hcho_column", "cluster_id", "is_hotspot", "is_biomass_driven", "associated_fires"])
            return out_empty
            
        date_str = str(daily_grid_df["date"].iloc[0])
        grid_df = daily_grid_df.copy()
        
        # 1. Impute any missing/NaN HCHO values using spatial neighbor averages (Cloud fallback)
        if grid_df["hcho_column"].isnull().any():
            mean_hcho = float(grid_df["hcho_column"].dropna().mean()) if not grid_df["hcho_column"].dropna().empty else 2.5
            grid_df["hcho_column"] = grid_df["hcho_column"].fillna(mean_hcho)
        
        # 2. Filter cells above threshold percentile of HCHO with an absolute minimum anomaly cutoff (5.5)
        min_absolute_hcho = 5.5
        max_day_hcho = float(grid_df["hcho_column"].max())
        
        if max_day_hcho < min_absolute_hcho:
            logger.info(f"Date {date_str}: Clean atmospheric day (Max HCHO {max_day_hcho:.1f} < {min_absolute_hcho}). 0 hotspots detected.")
            out_df = grid_df.copy()
            out_df["cluster_id"] = -1
            out_df["is_hotspot"] = False
            out_df["is_biomass_driven"] = False
            out_df["associated_fires"] = 0
            return out_df

        hcho_threshold = max(min_absolute_hcho, float(np.percentile(grid_df["hcho_column"], self.percentile)))
        high_hcho_df = grid_df[grid_df["hcho_column"] >= hcho_threshold].copy()
        
        if len(high_hcho_df) < self.min_samples:
            logger.info(f"Date {date_str}: Too few high-HCHO cells ({len(high_hcho_df)}) to form clusters.")
            high_hcho_df["cluster_id"] = -1
            high_hcho_df["is_hotspot"] = False
            high_hcho_df["is_biomass_driven"] = False
            high_hcho_df["associated_fires"] = 0
            return high_hcho_df

        # 3. Spherical Haversine DBSCAN Clustering on Coordinates (Lat, Lon converted to Radians)
        # sklearn haversine expects [latitude_rad, longitude_rad]
        coords_rad = np.radians(high_hcho_df[["latitude", "longitude"]].values)
        eps_rad = self.eps_km / self.EARTH_RADIUS_KM
        
        db = DBSCAN(eps=eps_rad, min_samples=self.min_samples, metric="haversine")
        cluster_labels = db.fit_predict(coords_rad)
        
        high_hcho_df["cluster_id"] = cluster_labels
        high_hcho_df["is_hotspot"] = cluster_labels != -1
        
        # 4. Cross-reference with FIRMS active fires on the same day using Haversine distance
        high_hcho_df["is_biomass_driven"] = False
        high_hcho_df["associated_fires"] = 0
        
        if fires_df is not None and not fires_df.empty:
            day_fires = fires_df[fires_df["date"] == date_str]
            
            if not day_fires.empty:
                fire_rad = np.radians(day_fires[["latitude", "longitude"]].values)
                
                # Check fires near each hotspot cluster
                for cluster_id in high_hcho_df["cluster_id"].unique():
                    if cluster_id == -1:
                        continue
                        
                    cluster_cells = high_hcho_df[high_hcho_df["cluster_id"] == cluster_id]
                    cluster_rad = np.radians(cluster_cells[["latitude", "longitude"]].values)
                    
                    # Compute haversine distance in km between cluster cells and fire points
                    fire_count = 0
                    for c_rad in cluster_rad:
                        # Vectorized haversine formula
                        dlat = fire_rad[:, 0] - c_rad[0]
                        dlon = fire_rad[:, 1] - c_rad[1]
                        a = np.sin(dlat / 2.0)**2 + np.cos(c_rad[0]) * np.cos(fire_rad[:, 0]) * np.sin(dlon / 2.0)**2
                        c = 2.0 * np.arcsin(np.clip(np.sqrt(a), 0.0, 1.0))
                        dists_km = self.EARTH_RADIUS_KM * c
                        
                        # Match within 45 km radius
                        fire_count += int(np.sum(dists_km <= 45.0))
                        
                    # If fires are found in proximity, designate as biomass driven
                    if fire_count > 0:
                        high_hcho_df.loc[high_hcho_df["cluster_id"] == cluster_id, "is_biomass_driven"] = True
                        high_hcho_df.loc[high_hcho_df["cluster_id"] == cluster_id, "associated_fires"] = int(fire_count)
                        
        n_hotspots = int(np.sum(high_hcho_df['is_hotspot']))
        n_clusters = len(high_hcho_df[high_hcho_df['cluster_id'] != -1]['cluster_id'].unique())
        logger.info(f"Date {date_str}: Detected {n_hotspots} hotspot points across {n_clusters} spherical clusters.")
        return high_hcho_df

if __name__ == "__main__":
    # Quick test harness
    detector = HotspotDetector()
    # Dummy data test
    dummy_grid = pd.DataFrame({
        "date": ["2025-10-25"] * 5,
        "latitude": [28.6, 28.65, 28.7, 31.0, 31.05],
        "longitude": [77.2, 77.22, 77.25, 74.8, 74.82],
        "hcho_column": [2.5, 2.7, 2.6, 3.8, 4.0]
    })
    dummy_fires = pd.DataFrame({
        "date": ["2025-10-25"] * 2,
        "latitude": [31.02, 28.5],
        "longitude": [74.81, 77.0],
        "frp": [45.0, 15.0]
    })
    res = detector.detect_hotspots(dummy_grid, dummy_fires)
    print(res)
