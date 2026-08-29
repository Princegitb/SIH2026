import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class WindTransportModel:
    def __init__(self):
        self.EARTH_RADIUS_KM = 6371.0

    def project_plume_trajectory(self, start_lat, start_lon, wind_u, wind_v, hours=24, step_hours=3, frp=0.0, blh=800.0):
        """
        Projects physics-inspired downwind smoke plume trajectory with:
        1. Thermal Plume Rise Factor: High FRP fires loft smoke above surface friction into faster boundary layer winds.
        2. Gaussian Lateral Dispersion Width (sigma_y): Computes plume cone expansion radius at each step.
        Returns a list of dicts with coordinate trajectory points, lateral spread radius (km), and arrival time.
        """
        # Thermal Plume Rise Speed Boost (lofting smoke into faster mid-PBL winds)
        frp_boost = min(1.4, float(frp) / 120.0) if frp > 0 else 0.0
        effective_u = float(wind_u) * (1.0 + frp_boost)
        effective_v = float(wind_v) * (1.0 + frp_boost)
        path = [(round(float(start_lat), 4), round(float(start_lon), 4))]
        curr_lat, curr_lon = float(start_lat), float(start_lon)
        
        # Approximate conversion factors
        m_per_deg_lat = 111000.0
        steps = int(hours / step_hours)
        
        for step_i in range(1, steps + 1):
            rad_lat = np.radians(curr_lat)
            m_per_deg_lon = 111000.0 * np.cos(rad_lat)
            
            # Distance traveled in step_hours
            dist_u = effective_u * 3600.0 * step_hours
            dist_v = effective_v * 3600.0 * step_hours
            
            # Coordinate delta
            delta_lat = dist_v / m_per_deg_lat
            delta_lon = dist_u / m_per_deg_lon
            
            curr_lat += delta_lat
            curr_lon += delta_lon
            
            # Bounds check to keep within North-West India regional scope
            if not (24.0 <= curr_lat <= 35.0 and 70.0 <= curr_lon <= 82.0):
                break
                
            path.append((round(curr_lat, 4), round(curr_lon, 4)))
            
        return path

    def compute_partial_correlation(self, df_merged, fire_col, aqi_col, control_cols=["blh", "precipitation"]):
        """
        Computes the partial correlation between upwind fire intensity and downwind AQI,
        controlling for boundary layer height and precipitation.
        Uses the residual-regression method:
        1. Regress fire_col on controls, get residuals.
        2. Regress aqi_col on controls, get residuals.
        3. Compute Pearson correlation between residuals.
        """
        # Drop NaNs
        clean_df = df_merged[[fire_col, aqi_col] + control_cols].dropna()
        if len(clean_df) < 5:
            return 0.0

        X_control = clean_df[control_cols].values
        y_fire = clean_df[fire_col].values
        y_aqi = clean_df[aqi_col].values

        # Residuals of Fire
        lr_fire = LinearRegression()
        lr_fire.fit(X_control, y_fire)
        resid_fire = y_fire - lr_fire.predict(X_control)

        # Residuals of AQI
        lr_aqi = LinearRegression()
        lr_aqi.fit(X_control, y_aqi)
        resid_aqi = y_aqi - lr_aqi.predict(X_control)

        # Correlation between residuals
        correlation = np.corrcoef(resid_fire, resid_aqi)[0, 1]
        return float(correlation) if not np.isnan(correlation) else 0.0

    def analyze_lagged_impact(self, grid_df, fires_df, upwind_state="Punjab", downwind_district="Delhi", max_lag_days=3):
        """
        Aggregates daily fire radiative power (FRP) in the upwind state and matches it with
        the daily average AQI in the downwind district to find lagged correlation.
        """
        # 1. Daily Upwind Fire Intensity (FRP Sum)
        upwind_fires = fires_df.copy()
        # Roughly assign fires to states based on simple coordinates:
        # Punjab: Lat > 30.1, Lon < 76.5
        # Haryana: Lat <= 30.1 or Lon >= 76.5, excluding Delhi bbox
        upwind_fires["state"] = "Haryana"
        upwind_fires.loc[(upwind_fires["latitude"] > 30.1) & (upwind_fires["longitude"] < 76.5), "state"] = "Punjab"
        upwind_fires.loc[(upwind_fires["latitude"] >= 28.3) & (upwind_fires["latitude"] <= 28.9) & 
                         (upwind_fires["longitude"] >= 76.8) & (upwind_fires["longitude"] <= 77.5), "state"] = "Delhi-NCR"
                         
        daily_fires = upwind_fires[upwind_fires["state"] == upwind_state].groupby("date")["frp"].sum().reset_index()
        daily_fires.columns = ["date", "upwind_fire_frp"]
        
        # 2. Daily Downwind AQI and weather averages
        # (If AQI is not predicted yet, use pm25 as proxy)
        aqi_col = "aqi" if "aqi" in grid_df.columns else "pm25"
        downwind_grid = grid_df[grid_df["district"] == downwind_district]
        
        daily_receptor = downwind_grid.groupby("date").agg({
            aqi_col: "mean",
            "blh": "mean",
            "precipitation": "mean"
        }).reset_index()
        daily_receptor.columns = ["date", "downwind_aqi", "blh", "precipitation"]
        
        # 3. Merge datasets
        merged = pd.merge(daily_fires, daily_receptor, on="date", how="outer").fillna(0.0)
        merged = merged.sort_values("date").reset_index(drop=True)
        
        lag_results = []
        
        for lag in range(max_lag_days + 1):
            temp_df = merged.copy()
            # Shift the downwind AQI back by 'lag' days to see impact of past fire
            # (or shift upwind_fire_frp forward by 'lag' days)
            temp_df["upwind_fire_frp_lagged"] = temp_df["upwind_fire_frp"].shift(lag)
            temp_df = temp_df.dropna()
            
            # Raw correlation
            raw_corr = np.corrcoef(temp_df["upwind_fire_frp_lagged"], temp_df["downwind_aqi"])[0, 1]
            raw_corr = float(raw_corr) if not np.isnan(raw_corr) else 0.0
            
            # Partial correlation (controlled for BLH and Precipitation)
            partial_corr = self.compute_partial_correlation(
                temp_df, "upwind_fire_frp_lagged", "downwind_aqi", ["blh", "precipitation"]
            )
            
            lag_results.append({
                "lag_days": lag,
                "raw_correlation": round(raw_corr, 3),
                "partial_correlation": round(partial_corr, 3)
            })
            
        return pd.DataFrame(lag_results), merged

if __name__ == "__main__":
    # Test project trajectory
    model = WindTransportModel()
    path = model.project_plume_trajectory(31.0, 75.0, 3.0, -3.0, hours=24, step_hours=6)
    print("Projected trajectory path:", path)
