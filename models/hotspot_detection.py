import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class HotspotDetector:
    def __init__(self, eps_deg=0.3, min_samples=2, hcho_percentile=85):
        """
        DBSCAN parameters:
        eps_deg: maximum distance between two samples for one to be considered as in the neighborhood of the other (in degrees)
        min_samples: the number of samples in a neighborhood for a point to be considered as a core point
        hcho_percentile: threshold percentile to filter high-density HCHO column cells
        """
        self.eps = eps_deg
        self.min_samples = min_samples
        self.percentile = hcho_percentile

    def detect_hotspots(self, daily_grid_df, fires_df=None):
        """
        Runs DBSCAN clustering on grid cells with high HCHO levels for a single day.
        Cross-references with active fire points to identify biomass burning sources.
        """
        if daily_grid_df.empty:
            return pd.DataFrame()
            
        date_str = daily_grid_df["date"].iloc[0]
        
        # 1. Filter cells above threshold percentile of HCHO
        hcho_threshold = np.percentile(daily_grid_df["hcho_column"], self.percentile)
        high_hcho_df = daily_grid_df[daily_grid_df["hcho_column"] >= hcho_threshold].copy()
        
        if len(high_hcho_df) < self.min_samples:
            logger.info(f"Date {date_str}: Too few high-HCHO cells to cluster.")
            high_hcho_df["cluster_id"] = -1
            high_hcho_df["is_hotspot"] = False
            high_hcho_df["is_biomass_driven"] = False
            high_hcho_df["associated_fires"] = 0
            return high_hcho_df

        # 2. Cluster using DBSCAN on coordinates
        coords = high_hcho_df[["longitude", "latitude"]].values
        db = DBSCAN(eps=self.eps, min_samples=self.min_samples)
        cluster_labels = db.fit_predict(coords)
        
        high_hcho_df["cluster_id"] = cluster_labels
        high_hcho_df["is_hotspot"] = cluster_labels != -1
        
        # 3. Cross-reference with FIRMS active fires on the same day
        high_hcho_df["is_biomass_driven"] = False
        high_hcho_df["associated_fires"] = 0
        
        if fires_df is not None and not fires_df.empty:
            day_fires = fires_df[fires_df["date"] == date_str]
            
            if not day_fires.empty:
                fire_coords = day_fires[["longitude", "latitude"]].values
                
                # Check fires near each hotspot cluster
                for cluster_id in high_hcho_df["cluster_id"].unique():
                    if cluster_id == -1:
                        continue
                        
                    cluster_cells = high_hcho_df[high_hcho_df["cluster_id"] == cluster_id]
                    cluster_points = cluster_cells[["longitude", "latitude"]].values
                    
                    # Compute pairwise distances between cluster cells and fire points
                    # Distance in degrees: 0.35 deg is ~40 km
                    fire_count = 0
                    for c_pt in cluster_points:
                        dists = np.sqrt(np.sum((fire_coords - c_pt)**2, axis=1))
                        fire_count += np.sum(dists <= 0.35)
                        
                    # If fires are found in proximity, designate as biomass driven
                    if fire_count > 0:
                        high_hcho_df.loc[high_hcho_df["cluster_id"] == cluster_id, "is_biomass_driven"] = True
                        high_hcho_df.loc[high_hcho_df["cluster_id"] == cluster_id, "associated_fires"] = int(fire_count)
                        
        logger.info(f"Date {date_str}: Detected {len(high_hcho_df[high_hcho_df['is_hotspot']])} hotspot points in {len(high_hcho_df[high_hcho_df['cluster_id'] != -1]['cluster_id'].unique())} clusters.")
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
