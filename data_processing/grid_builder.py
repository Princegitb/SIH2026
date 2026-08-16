import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Predefined district centers
DISTRICTS = [
    {"name": "Delhi", "state": "Delhi-NCR", "lat": 28.6139, "lon": 77.2090, "type": "urban"},
    {"name": "Gurugram", "state": "Haryana", "lat": 28.4595, "lon": 77.0266, "type": "urban"},
    {"name": "Faridabad", "state": "Haryana", "lat": 28.4089, "lon": 77.3178, "type": "urban"},
    {"name": "Rohtak", "state": "Haryana", "lat": 28.8955, "lon": 76.6066, "type": "rural"},
    {"name": "Panipat", "state": "Haryana", "lat": 29.3909, "lon": 76.9635, "type": "industrial"},
    {"name": "Karnal", "state": "Haryana", "lat": 29.6857, "lon": 76.9905, "type": "agricultural"},
    {"name": "Hisar", "state": "Haryana", "lat": 29.1486, "lon": 75.7217, "type": "agricultural"},
    {"name": "Ambala", "state": "Haryana", "lat": 30.3782, "lon": 76.7767, "type": "rural"},
    {"name": "Amritsar", "state": "Punjab", "lat": 31.6340, "lon": 74.8723, "type": "agricultural"},
    {"name": "Ludhiana", "state": "Punjab", "lat": 30.9010, "lon": 75.8573, "type": "industrial"},
    {"name": "Jalandhar", "state": "Punjab", "lat": 31.3260, "lon": 75.5762, "type": "urban"},
    {"name": "Patiala", "state": "Punjab", "lat": 30.3398, "lon": 76.3869, "type": "agricultural"},
    {"name": "Bathinda", "state": "Punjab", "lat": 30.2110, "lon": 74.9454, "type": "industrial"},
    {"name": "Sangrur", "state": "Punjab", "lat": 30.2290, "lon": 75.8412, "type": "agricultural"},
    {"name": "Firozpur", "state": "Punjab", "lat": 30.9256, "lon": 74.6212, "type": "agricultural"},
]

def generate_spatial_grid(lat_min=27.6, lat_max=32.4, lon_min=73.8, lon_max=77.8, step=0.15):
    """
    Generates a list of grid cells covering the pilot region and associates each cell
    with the nearest predefined district.
    """
    lats = np.arange(lat_min, lat_max, step)
    lons = np.arange(lon_min, lon_max, step)
    
    grid_cells = []
    cell_id = 0
    for lat in lats:
        for lon in lons:
            # Find nearest district
            min_dist = float("inf")
            nearest_district = None
            for d in DISTRICTS:
                dist = np.sqrt((lat - d["lat"])**2 + (lon - d["lon"])**2)
                if dist < min_dist:
                    min_dist = dist
                    nearest_district = d
            
            # Keep only cells within 1.2 degrees of any district to crop to actual states shape
            if min_dist <= 1.2:
                grid_cells.append({
                    "cell_id": cell_id,
                    "latitude": round(lat, 4),
                    "longitude": round(lon, 4),
                    "district": nearest_district["name"],
                    "state": nearest_district["state"],
                    "type": nearest_district["type"]
                })
                cell_id += 1
                
    return pd.DataFrame(grid_cells)

def simulate_data():
    """
    Generates the complete physical simulation of satellite, weather, and ground truth measurements.
    Vectorized using NumPy for high performance.
    """
    logger.info("Initializing grid and date parameters...")
    grid_df = generate_spatial_grid()
    
    start_date = datetime(2025, 10, 1)
    end_date = datetime(2025, 11, 30)
    days = (end_date - start_date).days + 1
    
    date_list = [start_date + timedelta(days=x) for x in range(days)]
    
    logger.info(f"Generated {len(grid_df)} grid cells. Simulating {days} days from Oct 1 to Nov 30...")
    
    # 1. Simulate Fire Events for the period
    np.random.seed(42)
    fire_records = []
    
    for date in date_list:
        day_of_season = (date - start_date).days
        
        # Stubble burning timeline: peaks late Oct to mid Nov
        if day_of_season < 15: # Early Oct: very few fires
            num_fires = np.random.randint(1, 10)
        elif day_of_season < 20: # Mid Oct: rising fires
            num_fires = np.random.randint(10, 40)
        elif day_of_season < 45: # Late Oct to mid Nov: Peak stubble burning
            num_fires = np.random.randint(100, 300)
        elif day_of_season < 55: # Late Nov: declining
            num_fires = np.random.randint(20, 80)
        else: # End of Nov: very low
            num_fires = np.random.randint(2, 15)
            
        for _ in range(num_fires):
            # Fires occur mostly in agricultural areas of Punjab (70%) and Haryana (30%)
            is_punjab = np.random.rand() < 0.7
            if is_punjab:
                # Random location near Punjab agricultural districts (Sangrur, Amritsar, Firozpur, Patiala)
                ref_dist = np.random.choice([d for d in DISTRICTS if d["state"] == "Punjab" and d["type"] == "agricultural"])
            else:
                ref_dist = np.random.choice([d for d in DISTRICTS if d["state"] == "Haryana" and d["type"] in ["agricultural", "rural"]])
                
            lat_f = ref_dist["lat"] + np.random.normal(0, 0.25)
            lon_f = ref_dist["lon"] + np.random.normal(0, 0.25)
            
            # Fire Radiative Power (FRP) in MegaWatts
            frp = float(np.random.exponential(scale=35.0) + 10.0)
            confidence = int(np.random.randint(50, 100))
            
            fire_records.append({
                "date": date.strftime("%Y-%m-%d"),
                "latitude": round(lat_f, 4),
                "longitude": round(lon_f, 4),
                "frp": round(frp, 1),
                "confidence": confidence,
                "sensor": np.random.choice(["MODIS", "VIIRS"])
            })
            
    fires_df = pd.DataFrame(fire_records)
    os.makedirs("data", exist_ok=True)
    fires_df.to_csv("data/fire_events.csv", index=False)
    logger.info(f"Simulated {len(fires_df)} fire events and saved to data/fire_events.csv")
    
    # 2. Simulate Grid Dataset
    grid_records = []
    
    # Generate daily base weather parameters
    # Predominant wind is north-westerly in this season
    weather_by_date = {}
    for date in date_list:
        day_of_season = (date - start_date).days
        
        # Temperature decreases as winter approaches
        base_temp = 32.0 - (day_of_season * 0.22) + np.random.normal(0, 1.0)
        # Humidity increases
        base_humidity = 40.0 + (day_of_season * 0.45) + np.random.normal(0, 4.0)
        # Boundary Layer Height decreases as atmosphere cools and locks in (inversion)
        base_blh = 1300.0 - (day_of_season * 18.0) + np.random.normal(0, 50.0)
        base_blh = max(180.0, base_blh) # cap at minimum 180 meters
        
        # Wind: predominant north-westerly (wind vector angle ~315 degrees, blowing towards SE)
        # We vary the angle slightly dynamically
        wind_angle = 315.0 + np.sin(day_of_season / 5.0) * 20.0 + np.random.normal(0, 10.0)
        wind_speed = 2.0 + np.cos(day_of_season / 7.0) * 0.8 + np.random.normal(0, 0.4)
        wind_speed = max(0.5, wind_speed)
        
        # Convert to u and v wind components
        # North-westerly wind blows from NW to SE, so u > 0, v < 0
        wind_u = wind_speed * np.cos(np.radians(360 - wind_angle + 90))
        wind_v = wind_speed * np.sin(np.radians(360 - wind_angle + 90))
        
        # Rain: dry season, but simulate a couple of rain events (e.g. Day 18 and Day 40)
        rain = 0.0
        if day_of_season in [18, 41]:
            rain = np.random.uniform(5.0, 20.0)
            
        weather_by_date[date.strftime("%Y-%m-%d")] = {
            "temperature": base_temp,
            "humidity": base_humidity,
            "blh": base_blh,
            "wind_u": wind_u,
            "wind_v": wind_v,
            "precipitation": rain,
            "wind_angle": wind_angle,
            "wind_speed": wind_speed
        }
        
    # Process grid cell values day by day
    for date in date_list:
        date_str = date.strftime("%Y-%m-%d")
        w = weather_by_date[date_str]
        
        # Get active fires for this day
        day_fires = fires_df[fires_df["date"] == date_str]
        
        if not day_fires.empty:
            fire_lats = day_fires["latitude"].values
            fire_lons = day_fires["longitude"].values
            fire_frps = day_fires["frp"].values
            
            # Precompute wind variables
            travel_angle = np.radians(w["wind_angle"] - 180.0)
            # Wind unit vector pointing downwind
            wind_dir_vector = np.array([np.cos(travel_angle), np.sin(travel_angle)])
        else:
            fire_lats = np.array([])
            fire_lons = np.array([])
            fire_frps = np.array([])
            wind_dir_vector = np.array([0.0, 0.0])
        
        for idx, row in grid_df.iterrows():
            lat_c, lon_c = row["latitude"], row["longitude"]
            
            # A. Calculate Biomass Smoke Impact (Optimized Vectorized Plume Model)
            smoke_impact = 0.0
            if len(fire_lats) > 0:
                d_lats = lat_c - fire_lats
                d_lons = lon_c - fire_lons
                dists_deg = np.sqrt(d_lats**2 + d_lons**2)
                dists_km = dists_deg * 111.0
                dists_km = np.clip(dists_km, 1.0, None)
                
                # Projection of distance vector onto downwind direction vector
                proj_dists = (d_lons * wind_dir_vector[0] + d_lats * wind_dir_vector[1]) * 111.0
                
                # Perpendicular distance to plume centerline
                # Cross product in 2D gives |d_vector x wind_vector| which is perpendicular distance
                perp_dists = np.abs(d_lons * wind_dir_vector[1] - d_lats * wind_dir_vector[0]) * 111.0
                
                # Plume model: dispersion width increases with downwind distance
                sigma_ys = 1.5 + 0.1 * np.clip(proj_dists, 0.0, None)
                
                # Plume Gaussian factor
                plume_factors = np.exp(-0.5 * (perp_dists / sigma_ys)**2)
                
                # Decay along downwind distance
                decay_factors = 1.0 / (1.0 + 0.005 * np.clip(proj_dists, 0.0, None)**1.5)
                
                # Filter out upwind cells (proj_dists <= -5.0)
                mask = proj_dists > -5.0
                
                contributions = (fire_frps * plume_factors * decay_factors) / np.sqrt(dists_km)
                smoke_impact = np.sum(contributions[mask])
            
            smoke_impact = min(800.0, smoke_impact)
            
            # B. Base Concentrations based on Cell Type (urban, industrial, agricultural, rural)
            winter_haze_factor = (date - start_date).days * 0.7
            
            if row["type"] == "urban":
                base_pm25 = 55.0 + winter_haze_factor + np.random.normal(0, 5.0)
                base_no2 = 45.0 + np.random.normal(0, 3.0)
                base_so2 = 12.0 + np.random.normal(0, 1.0)
                base_co = 0.8 + np.random.normal(0, 0.05)
                base_o3 = 40.0 + np.random.normal(0, 4.0)
            elif row["type"] == "industrial":
                base_pm25 = 75.0 + winter_haze_factor + np.random.normal(0, 8.0)
                base_no2 = 35.0 + np.random.normal(0, 3.0)
                base_so2 = 35.0 + np.random.normal(0, 4.0)
                base_co = 1.2 + np.random.normal(0, 0.1)
                base_o3 = 30.0 + np.random.normal(0, 3.0)
            elif row["type"] == "agricultural":
                base_pm25 = 40.0 + winter_haze_factor + np.random.normal(0, 4.0)
                base_no2 = 15.0 + np.random.normal(0, 1.5)
                base_so2 = 8.0 + np.random.normal(0, 0.8)
                base_co = 0.4 + np.random.normal(0, 0.03)
                base_o3 = 45.0 + np.random.normal(0, 3.0)
            else: # rural
                base_pm25 = 35.0 + winter_haze_factor + np.random.normal(0, 3.0)
                base_no2 = 10.0 + np.random.normal(0, 1.0)
                base_so2 = 6.0 + np.random.normal(0, 0.5)
                base_co = 0.3 + np.random.normal(0, 0.02)
                base_o3 = 40.0 + np.random.normal(0, 3.0)
                
            # C. Boundary Layer Height Compression Effect
            blh_compression = 1000.0 / w["blh"]
            base_pm25 *= (0.4 + 0.6 * blh_compression)
            base_no2 *= (0.3 + 0.7 * blh_compression)
            base_so2 *= (0.3 + 0.7 * blh_compression)
            base_co *= (0.3 + 0.7 * blh_compression)
            
            # D. Add Smoke Pollutant Contributions
            pm25_smoke = smoke_impact * 1.2
            pm10_smoke = smoke_impact * 1.8
            co_smoke = smoke_impact * 0.005
            no2_smoke = smoke_impact * 0.05
            so2_smoke = smoke_impact * 0.01
            hcho_smoke = smoke_impact * 0.04
            
            # E. Total Surface Concentrations
            pm25 = max(10.0, base_pm25 + pm25_smoke)
            pm10 = max(20.0, pm25 * 1.5 + pm10_smoke * 0.8)
            no2_surf = max(2.0, base_no2 + no2_smoke)
            so2_surf = max(1.0, base_so2 + so2_smoke)
            co_surf = max(0.1, base_co + co_smoke)
            o3_surf = max(5.0, base_o3 - (smoke_impact * 0.05) + np.random.normal(0, 2.0))
            
            # F. Wet Scavenging (Rain Washout)
            if w["precipitation"] > 0.0:
                washout = np.exp(-0.15 * w["precipitation"])
                pm25 *= washout
                pm10 *= washout
                no2_surf *= washout
                so2_surf *= washout
                co_surf *= washout
                
            # G. Simulate Satellite Column Densities
            aod = (pm25 * 0.004) * (w["blh"] / 1000.0) + np.random.uniform(0.05, 0.15)
            aod = max(0.05, min(4.0, aod))
            
            no2_col = (no2_surf * 0.4) * (w["blh"] / 1000.0) * 1e14 + np.random.uniform(1e14, 5e14)
            so2_col = (so2_surf * 0.25) * (w["blh"] / 1000.0) * 1e14 + np.random.uniform(0.5e14, 2e14)
            co_col = (co_surf * 1.2) * (w["blh"] / 1000.0) * 1e17 + np.random.uniform(1e17, 3e17)
            o3_col = (o3_surf * 4.5) * 1e18 + np.random.uniform(1e18, 5e18)
            
            hcho_col = (hcho_smoke * 0.5 + 0.8) * 1e15 * (w["blh"] / 1000.0) + np.random.uniform(2e15, 6e15)
            hcho_col = max(1e15, hcho_col)

            grid_records.append({
                "date": date_str,
                "cell_id": row["cell_id"],
                "latitude": lat_c,
                "longitude": lon_c,
                "district": row["district"],
                "state": row["state"],
                "type": row["type"],
                "temperature": round(w["temperature"] + np.random.normal(0, 0.2), 1),
                "humidity": round(w["humidity"] + np.random.normal(0, 0.5), 1),
                "blh": round(w["blh"], 1),
                "wind_u": round(w["wind_u"], 2),
                "wind_v": round(w["wind_v"], 2),
                "precipitation": round(w["precipitation"], 2),
                "aod": round(aod, 3),
                "no2_column": round(no2_col / 1e15, 4),
                "so2_column": round(so2_col / 1e15, 4),
                "co_column": round(co_col / 1e18, 4),
                "o3_column": round(o3_col / 1e19, 4),
                "hcho_column": round(hcho_col / 1e15, 4),
                "pm25": round(pm25, 1),
                "pm10": round(pm10, 1),
                "no2_surface": round(no2_surf, 1),
                "so2_surface": round(so2_surf, 1),
                "co_surface": round(co_surf, 2),
                "o3_surface": round(o3_surf, 1),
                "smoke_impact": round(smoke_impact, 2)
            })
            
    grid_df_all = pd.DataFrame(grid_records)
    grid_df_all.to_csv("data/grid_data.csv", index=False)
    logger.info(f"Simulated {len(grid_df_all)} daily grid rows and saved to data/grid_data.csv")
    
    # 3. Simulate Sparse CPCB Ground Station Locations
    station_locations = [
        {"station_name": "CPCB Delhi - Mandir Marg", "district": "Delhi", "lat": 28.6139, "lon": 77.2090},
        {"station_name": "CPCB Gurugram - Sector 51", "district": "Gurugram", "lat": 28.4595, "lon": 77.0266},
        {"station_name": "CPCB Faridabad - Sector 16A", "district": "Faridabad", "lat": 28.4089, "lon": 77.3178},
        {"station_name": "HSPCB Panipat - Sector 18", "district": "Panipat", "lat": 29.3909, "lon": 76.9635},
        {"station_name": "HSPCB Karnal - Sector 12", "district": "Karnal", "lat": 29.6857, "lon": 76.9905},
        {"station_name": "HSPCB Rohtak - Vikas Nagar", "district": "Rohtak", "lat": 28.8955, "lon": 76.6066},
        {"station_name": "PPCB Amritsar - Golden Temple", "district": "Amritsar", "lat": 31.6340, "lon": 74.8723},
        {"station_name": "PPCB Ludhiana - Punjab Agri Univ", "district": "Ludhiana", "lat": 30.9010, "lon": 75.8573},
        {"station_name": "PPCB Patiala - Civil Lines", "district": "Patiala", "lat": 30.3398, "lon": 76.3869},
        {"station_name": "PPCB Jalandhar - Model Town", "district": "Jalandhar", "lat": 31.3260, "lon": 75.5762},
        {"station_name": "PPCB Sangrur - City Center", "district": "Sangrur", "lat": 30.2290, "lon": 75.8412},
        {"station_name": "PPCB Bathinda - Civil Station", "district": "Bathinda", "lat": 30.2110, "lon": 74.9454},
    ]
    
    station_records = []
    for station in station_locations:
        grid_cells_locs = grid_df_all[["cell_id", "latitude", "longitude"]].drop_duplicates()
        min_dist = float("inf")
        nearest_cell_id = None
        for idx, row in grid_cells_locs.iterrows():
            dist = np.sqrt((station["lat"] - row["latitude"])**2 + (station["lon"] - row["longitude"])**2)
            if dist < min_dist:
                min_dist = dist
                nearest_cell_id = int(row["cell_id"])
                
        cell_data = grid_df_all[grid_df_all["cell_id"] == nearest_cell_id].copy()
        cell_data["station_name"] = station["station_name"]
        
        cell_data["pm25"] = (cell_data["pm25"] + np.random.normal(0, 2.0)).clip(lower=2.0).round(1)
        cell_data["pm10"] = (cell_data["pm10"] + np.random.normal(0, 4.0)).clip(lower=5.0).round(1)
        
        station_records.append(cell_data)
        
    ground_stations_df = pd.concat(station_records)
    ground_stations_df.to_csv("data/ground_stations.csv", index=False)
    logger.info(f"Generated ground station observations and saved to data/ground_stations.csv")

if __name__ == "__main__":
    simulate_data()
