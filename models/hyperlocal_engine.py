import os
import logging
import numpy as np
import pandas as pd
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("VayuShetra-Hyperlocal")

from models.aqi_model import TARGET_POLLUTANTS, calculate_sub_index, FEATURES

def get_cpcb_category(aqi: int) -> str:
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    return "Severe"

# Extensive Village, Tehsil, and Locality Directory across North-West India
VILLAGE_LOCALITY_DIRECTORY = [
    # Haryana Agricultural & Rural Belts
    {"name": "Assandh Village", "district": "Karnal", "state": "Haryana", "lat": 29.8142, "lon": 76.5310, "type": "Agricultural Village"},
    {"name": "Nilokheri Rural", "district": "Karnal", "state": "Haryana", "lat": 29.8335, "lon": 76.9182, "type": "Rural Tehsil"},
    {"name": "Gharaunda Farm Belt", "district": "Karnal", "state": "Haryana", "lat": 29.5401, "lon": 76.9715, "type": "Agricultural Village"},
    {"name": "Indri Farm Area", "district": "Karnal", "state": "Haryana", "lat": 29.8805, "lon": 77.0588, "type": "Agricultural Village"},
    {"name": "Samalkha Rural", "district": "Panipat", "state": "Haryana", "lat": 29.2312, "lon": 77.0145, "type": "Rural / Industrial"},
    {"name": "Israna Village", "district": "Panipat", "state": "Haryana", "lat": 29.2780, "lon": 76.8450, "type": "Agricultural Village"},
    {"name": "Bapoli Farmland", "district": "Panipat", "state": "Haryana", "lat": 29.3210, "lon": 77.1020, "type": "Agricultural Village"},
    {"name": "Gohana Tehsil", "district": "Sonipat", "state": "Haryana", "lat": 29.1384, "lon": 76.6974, "type": "Rural Tehsil"},
    {"name": "Ganaur Village Belt", "district": "Sonipat", "state": "Haryana", "lat": 29.1320, "lon": 77.0210, "type": "Agricultural Village"},
    {"name": "Kharkhoda Rural", "district": "Sonipat", "state": "Haryana", "lat": 28.8780, "lon": 76.9120, "type": "Rural Village"},
    {"name": "Meham Rural", "district": "Rohtak", "state": "Haryana", "lat": 28.9660, "lon": 76.2940, "type": "Agricultural Village"},
    {"name": "Sampla Village", "district": "Rohtak", "state": "Haryana", "lat": 28.7750, "lon": 76.7720, "type": "Rural Village"},
    {"name": "Kalanaur Farm Area", "district": "Rohtak", "state": "Haryana", "lat": 28.8310, "lon": 76.4020, "type": "Agricultural Village"},
    {"name": "Hansi Agricultural Belt", "district": "Hisar", "state": "Haryana", "lat": 29.1012, "lon": 75.9615, "type": "Agricultural Village"},
    {"name": "Barwala Village", "district": "Hisar", "state": "Haryana", "lat": 29.3780, "lon": 75.9120, "type": "Rural Tehsil"},
    {"name": "Narnaund Rural", "district": "Hisar", "state": "Haryana", "lat": 29.2150, "lon": 76.1420, "type": "Agricultural Village"},
    {"name": "Tohana Farm Belt", "district": "Fatehabad", "state": "Haryana", "lat": 29.7020, "lon": 75.9010, "type": "Agricultural Village"},
    {"name": "Ratia Village", "district": "Fatehabad", "state": "Haryana", "lat": 29.6810, "lon": 75.5780, "type": "Agricultural Village"},
    {"name": "Shahbad Markanda", "district": "Kurukshetra", "state": "Haryana", "lat": 30.1680, "lon": 76.8710, "type": "Rural Tehsil"},
    {"name": "Pehowa Farmland", "district": "Kurukshetra", "state": "Haryana", "lat": 29.9810, "lon": 76.5820, "type": "Agricultural Village"},
    {"name": "Ladwa Rural", "district": "Kurukshetra", "state": "Haryana", "lat": 29.9980, "lon": 77.0450, "type": "Agricultural Village"},
    {"name": "Naraingarh Village", "district": "Ambala", "state": "Haryana", "lat": 30.4810, "lon": 77.1280, "type": "Rural Village"},
    {"name": "Barara Agricultural Area", "district": "Ambala", "state": "Haryana", "lat": 30.2150, "lon": 77.0420, "type": "Agricultural Village"},
    {"name": "Mullana Farm Belt", "district": "Ambala", "state": "Haryana", "lat": 30.2520, "lon": 77.0480, "type": "Agricultural Village"},
    {"name": "Sohna Rural", "district": "Gurugram", "state": "Haryana", "lat": 28.2480, "lon": 77.0620, "type": "Rural Tehsil"},
    {"name": "Pataudi Village", "district": "Gurugram", "state": "Haryana", "lat": 28.3220, "lon": 76.7820, "type": "Rural Village"},
    {"name": "Farrukhnagar Farmland", "district": "Gurugram", "state": "Haryana", "lat": 28.4480, "lon": 76.8210, "type": "Agricultural Village"},

    # Punjab Stubble & Agricultural Belts
    {"name": "Raikot Rural Belt", "district": "Ludhiana", "state": "Punjab", "lat": 30.6510, "lon": 75.6020, "type": "Agricultural Village"},
    {"name": "Jagraon Farmland", "district": "Ludhiana", "state": "Punjab", "lat": 30.7850, "lon": 75.4780, "type": "Agricultural Village"},
    {"name": "Samrala Village", "district": "Ludhiana", "state": "Punjab", "lat": 30.8350, "lon": 76.1910, "type": "Rural Tehsil"},
    {"name": "Payal Farm Area", "district": "Ludhiana", "state": "Punjab", "lat": 30.7210, "lon": 76.0520, "type": "Agricultural Village"},
    {"name": "Khanna Rural", "district": "Ludhiana", "state": "Punjab", "lat": 30.7020, "lon": 76.2180, "type": "Rural Tehsil"},
    {"name": "Sunam Stubble Hotspot", "district": "Sangrur", "state": "Punjab", "lat": 30.1280, "lon": 75.8020, "type": "Agricultural Village"},
    {"name": "Dhuri Farmland", "district": "Sangrur", "state": "Punjab", "lat": 30.3710, "lon": 75.8680, "type": "Agricultural Village"},
    {"name": "Dirba Agricultural Area", "district": "Sangrur", "state": "Punjab", "lat": 30.0650, "lon": 75.9810, "type": "Agricultural Village"},
    {"name": "Lehragaga Village", "district": "Sangrur", "state": "Punjab", "lat": 29.9320, "lon": 75.8120, "type": "Agricultural Village"},
    {"name": "Bhawanigarh Rural", "district": "Sangrur", "state": "Punjab", "lat": 30.2780, "lon": 76.0420, "type": "Rural Village"},
    {"name": "Moonak Farm Belt", "district": "Sangrur", "state": "Punjab", "lat": 29.8150, "lon": 75.8920, "type": "Agricultural Village"},
    {"name": "Nabha Rural", "district": "Patiala", "state": "Punjab", "lat": 30.3720, "lon": 76.1510, "type": "Rural Tehsil"},
    {"name": "Samana Agricultural Belt", "district": "Patiala", "state": "Punjab", "lat": 30.1580, "lon": 76.1920, "type": "Agricultural Village"},
    {"name": "Rajpura Farmland", "district": "Patiala", "state": "Punjab", "lat": 30.4820, "lon": 76.5920, "type": "Rural / Industrial"},
    {"name": "Patran Village", "district": "Patiala", "state": "Punjab", "lat": 29.9480, "lon": 76.0820, "type": "Agricultural Village"},
    {"name": "Ghanour Rural", "district": "Patiala", "state": "Punjab", "lat": 30.3210, "lon": 76.6210, "type": "Agricultural Village"},
    {"name": "Nakodar Farmland", "district": "Jalandhar", "state": "Punjab", "lat": 31.1280, "lon": 75.4780, "type": "Agricultural Village"},
    {"name": "Phillaur Village", "district": "Jalandhar", "state": "Punjab", "lat": 31.0180, "lon": 75.7820, "type": "Rural Tehsil"},
    {"name": "Shahkot Farm Area", "district": "Jalandhar", "state": "Punjab", "lat": 31.0820, "lon": 75.3410, "type": "Agricultural Village"},
    {"name": "Goraya Rural", "district": "Jalandhar", "state": "Punjab", "lat": 31.1250, "lon": 75.7720, "type": "Rural Village"},
    {"name": "Majitha Agricultural Area", "district": "Amritsar", "state": "Punjab", "lat": 31.7610, "lon": 74.9520, "type": "Agricultural Village"},
    {"name": "Ajnala Farm Belt", "district": "Amritsar", "state": "Punjab", "lat": 31.8410, "lon": 74.7610, "type": "Agricultural Village"},
    {"name": "Attari Border Village", "district": "Amritsar", "state": "Punjab", "lat": 31.6020, "lon": 74.6050, "type": "Rural Village"},
    {"name": "Rampura Phul", "district": "Bathinda", "state": "Punjab", "lat": 30.2720, "lon": 75.2410, "type": "Rural Tehsil"},
    {"name": "Talwandi Sabo Farmland", "district": "Bathinda", "state": "Punjab", "lat": 29.9820, "lon": 75.0910, "type": "Agricultural Village"},
    {"name": "Maur Mandi Rural", "district": "Bathinda", "state": "Punjab", "lat": 30.0820, "lon": 75.2410, "type": "Agricultural Village"},
    {"name": "Gonate Rural Belt", "district": "Bathinda", "state": "Punjab", "lat": 30.3150, "lon": 75.0120, "type": "Agricultural Village"},
    {"name": "Zira Farmland", "district": "Firozpur", "state": "Punjab", "lat": 30.9780, "lon": 74.9850, "type": "Agricultural Village"},
    {"name": "Guru Har Sahai Village", "district": "Firozpur", "state": "Punjab", "lat": 30.7120, "lon": 74.4020, "type": "Agricultural Village"},

    # Delhi-NCR Peri-Urban & Rural Localities
    {"name": "Bawana Rural / Industrial", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.7980, "lon": 77.0350, "type": "Peri-Urban / Industrial"},
    {"name": "Narela Agricultural Belt", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.8520, "lon": 77.0920, "type": "Peri-Urban Agricultural"},
    {"name": "Najafgarh Rural Area", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.6120, "lon": 76.9850, "type": "Rural Locality"},
    {"name": "Alipur Farmland", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.7990, "lon": 77.1320, "type": "Agricultural Village"},
    {"name": "Kanjhawala Village", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.7250, "lon": 76.9980, "type": "Rural Village"},
    {"name": "Mundka Locality", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.6810, "lon": 77.0250, "type": "Peri-Urban Area"},
    {"name": "Dhansa Border Farm", "district": "Delhi", "state": "Delhi-NCR", "lat": 28.5680, "lon": 76.8620, "type": "Agricultural Village"}
]

class HyperlocalPredictor:
    """
    Hyperlocal Point Inference Engine for Villages, Farms, and GPS Coordinates.
    Performs inverse distance weighted spatial interpolation across satellite rasters
    and runs XGBoost models to predict air quality anywhere in India.
    """
    def __init__(self):
        self.directory = VILLAGE_LOCALITY_DIRECTORY

    def search_localities(self, query: str, limit: int = 8) -> list:
        """
        Fuzzy search for Indian villages, tehsils, and rural belts.
        """
        if not query or len(query.strip()) < 2:
            return self.directory[:limit]
            
        q = query.strip().lower()
        results = []
        for loc in self.directory:
            searchable = f"{loc['name']} {loc['district']} {loc['state']} {loc['type']}".lower()
            if q in searchable:
                results.append(loc)
                if len(results) >= limit:
                    break
        return results

    def reverse_geocode_location(self, lat: float, lon: float) -> dict:
        """
        Finds the nearest named village/locality within proximity to the GPS coordinate.
        """
        min_dist_km = float("inf")
        nearest_loc = None
        
        for loc in self.directory:
            # Haversine distance in km
            dlat = np.radians(loc["lat"] - lat)
            dlon = np.radians(loc["lon"] - lon)
            a = np.sin(dlat / 2)**2 + np.cos(np.radians(lat)) * np.cos(np.radians(loc["lat"])) * np.sin(dlon / 2)**2
            c = 2 * np.arcsin(np.sqrt(a))
            dist_km = 6371.0 * c
            
            if dist_km < min_dist_km:
                min_dist_km = dist_km
                nearest_loc = loc
                
        if nearest_loc is not None and min_dist_km <= 35.0:
            if min_dist_km <= 1.5:
                loc_name = f"{nearest_loc['name']}, {nearest_loc['district']}"
            else:
                loc_name = f"Near {nearest_loc['name']} ({min_dist_km:.1f} km), {nearest_loc['district']}"
            return {
                "name": loc_name,
                "district": nearest_loc["district"],
                "state": nearest_loc["state"],
                "type": nearest_loc["type"],
                "distance_km": round(min_dist_km, 1)
            }
        else:
            return {
                "name": f"Rural Locality ({lat:.3f}°N, {lon:.3f}°E)",
                "district": "North-West Basin",
                "state": "India",
                "type": "Custom GPS Coordinate",
                "distance_km": 0.0
            }

    def predict_at_coordinate(self, lat: float, lon: float, date: str, grid_df: pd.DataFrame, fires_df: pd.DataFrame, model_manager, forecast_engine) -> dict:
        """
        Executes complete mathematical and ML pipeline for an exact (lat, lon) point.
        """
        if grid_df is None or grid_df.empty:
            raise ValueError("Grid dataset not loaded.")
            
        day_grid = grid_df[grid_df["date"] == date]
        if day_grid.empty:
            day_grid = grid_df[grid_df["date"] == grid_df["date"].max()]
            
        # 1. Spatial Inverse Distance Weighting (IDW) Interpolation over surrounding satellite grid points
        cell_lats = day_grid["latitude"].values
        cell_lons = day_grid["longitude"].values
        
        # Distances in degrees
        dists_sq = (cell_lats - lat)**2 + (cell_lons - lon)**2
        dists_deg = np.sqrt(dists_sq)
        
        # Take nearest 6 satellite cells
        k = min(6, len(day_grid))
        nearest_indices = np.argsort(dists_deg)[:k]
        
        nearest_dists = dists_deg[nearest_indices]
        nearest_subset = day_grid.iloc[nearest_indices]
        
        # Compute IDW weights with power p=2
        epsilon = 1e-6
        weights = 1.0 / (nearest_dists**2 + epsilon)
        weights /= np.sum(weights)
        
        # Interpolate exact feature values at this GPS spot
        interpolated_features = {}
        for feat in FEATURES:
            if feat in nearest_subset.columns:
                interpolated_features[feat] = float(np.sum(nearest_subset[feat].values * weights))
            else:
                interpolated_features[feat] = float(nearest_subset[feat].mean() if feat in nearest_subset else 0.0)
                
        # 2. Run XGBoost Machine Learning Models on Interpolated Features
        X_point = pd.DataFrame([interpolated_features])[FEATURES]
        predictions = {}
        sub_indices = {}
        
        for target_col, clean_name in TARGET_POLLUTANTS.items():
            if model_manager and target_col in model_manager.models:
                pred_val = float(model_manager.models[target_col].predict(X_point)[0])
            else:
                # Fallback to interpolated ground column
                pred_val = float(interpolated_features.get(target_col, 50.0))
            
            pred_val = max(1.0, pred_val)
            predictions[clean_name] = round(pred_val, 1)
            sub_indices[clean_name] = calculate_sub_index(pred_val, clean_name)
            
        # 3. Calculate Composite CPCB AQI
        composite_aqi = int(round(max(sub_indices.values())))
        dominant_pollutant = max(sub_indices, key=sub_indices.get).upper()
        aqi_category = get_cpcb_category(composite_aqi)
        
        # 4. Calculate Source Attribution at this exact spot
        hcho_val = interpolated_features.get("hcho_column", 3.0)
        smoke_impact = interpolated_features.get("smoke_impact", 0.0)
        no2_val = predictions.get("no2", 30.0)
        so2_val = predictions.get("so2", 15.0)
        co_val = predictions.get("co", 1.5)
        
        # Check proximity to active fires
        fire_proximity_km = 999.0
        if fires_df is not None and not fires_df.empty:
            day_fires = fires_df[fires_df["date"] == date]
            if not day_fires.empty:
                f_lats = day_fires["latitude"].values
                f_lons = day_fires["longitude"].values
                f_dists = np.sqrt((f_lats - lat)**2 + (f_lons - lon)**2) * 111.0
                fire_proximity_km = float(np.min(f_dists))
                
        # Source calculation
        biomass_sig = max(10.0, hcho_val * 6.5 + (max(0, 150.0 - fire_proximity_km) * 0.4) + smoke_impact * 0.1)
        vehicular_sig = max(15.0, no2_val * 1.8 + co_val * 12.0)
        industrial_sig = max(10.0, so2_val * 3.5 + no2_val * 0.5)
        
        tot_sig = biomass_sig + vehicular_sig + industrial_sig
        pct_biomass = round((biomass_sig / tot_sig) * 100.0, 1)
        pct_vehicular = round((vehicular_sig / tot_sig) * 100.0, 1)
        pct_industrial = round(100.0 - pct_biomass - pct_vehicular, 1)
        
        dominant_source = "Biomass / Stubble Smoke" if pct_biomass >= max(pct_vehicular, pct_industrial) else ("Vehicular Traffic" if pct_vehicular >= pct_industrial else "Industrial Emissions")

        # 5. Predict 48-Hour ML Forecast for this location
        forecast_res = {"day1": {"aqi": int(composite_aqi * 1.05), "inversion_risk": "Moderate Risk", "wind_speed": 12.0}, "day2": {"aqi": int(composite_aqi * 0.96), "inversion_risk": "Low Risk", "wind_speed": 14.0}}
        if forecast_engine:
            try:
                point_dict = {
                    "aqi": composite_aqi,
                    "pm25": predictions.get("pm25", 70.0),
                    "pm10": predictions.get("pm10", 120.0),
                    "blh": interpolated_features.get("blh", 600.0),
                    "wind_speed": float(np.sqrt(interpolated_features.get("wind_u", 2.0)**2 + interpolated_features.get("wind_v", -1.5)**2) * 3.6),
                    "wind_u": interpolated_features.get("wind_u", 2.0),
                    "wind_v": interpolated_features.get("wind_v", -1.5),
                    "temperature": interpolated_features.get("temperature", 28.0),
                    "humidity": interpolated_features.get("humidity", 60.0),
                    "hcho_column": hcho_val,
                    "date": date,
                    "district": nearest_subset.iloc[0]["district"]
                }
                day_fires_cnt = len(fires_df[fires_df["date"] == date]) if fires_df is not None and not fires_df.empty else 0
                forecast_res = forecast_engine.predict_forecast(point_dict, fires_count=day_fires_cnt)
            except Exception as fc_err:
                logger.warning(f"Hyperlocal forecast fallback applied: {fc_err}")
                
        # 6. Geocode Locality Name
        geo_info = self.reverse_geocode_location(lat, lon)
        
        # 7. Save prediction record to Supabase
        try:
            from backend.database import db_session, HyperlocalPrediction
            session = db_session()
            hp = HyperlocalPrediction(
                date=str(date),
                latitude=float(lat),
                longitude=float(lon),
                location_name=str(geo_info["name"]),
                locality_type=str(geo_info["type"]),
                district=str(geo_info["district"]),
                state=str(geo_info["state"]),
                aqi=int(composite_aqi),
                aqi_category=str(aqi_category),
                pm25=float(predictions.get("pm25", 70.0)),
                pm10=float(predictions.get("pm10", 120.0)),
                no2=float(predictions.get("no2", 30.0)),
                so2=float(predictions.get("so2", 15.0)),
                co=float(predictions.get("co", 1.5)),
                o3=float(predictions.get("o3", 35.0)),
                hcho_column=float(hcho_val),
                aod=float(interpolated_features.get("aod", 0.3)),
                dominant_source=str(dominant_source),
                source_biomass_pct=float(pct_biomass),
                source_vehicular_pct=float(pct_vehicular),
                source_industrial_pct=float(pct_industrial),
                forecast_day1_aqi=int(forecast_res["day1"]["aqi"]),
                forecast_day2_aqi=int(forecast_res["day2"]["aqi"]),
                inversion_risk=str(forecast_res["day1"]["inversion_risk"])
            )
            session.add(hp)
            session.commit()
            session.close()
        except Exception as db_err:
            logger.warning(f"Notice saving hyperlocal prediction to DB: {db_err}")
            
        return {
            "location": {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "name": geo_info["name"],
                "district": geo_info["district"],
                "state": geo_info["state"],
                "locality_type": geo_info["type"],
                "nearest_reference_distance_km": geo_info["distance_km"]
            },
            "aqi": composite_aqi,
            "aqi_category": aqi_category,
            "dominant_pollutant": dominant_pollutant,
            "pollutants": predictions,
            "sub_indices": sub_indices,
            "satellite_telemetry": {
                "hcho_column": round(hcho_val, 3),
                "aod": round(interpolated_features.get("aod", 0.3), 3),
                "blh_meters": int(round(interpolated_features.get("blh", 600.0))),
                "wind_speed_kmh": round(float(np.sqrt(interpolated_features.get("wind_u", 2.0)**2 + interpolated_features.get("wind_v", -1.5)**2) * 3.6), 1),
                "nearest_fire_distance_km": round(fire_proximity_km, 1) if fire_proximity_km < 900 else None
            },
            "source_attribution": {
                "dominant_source": dominant_source,
                "biomass_smoke_pct": pct_biomass,
                "vehicular_traffic_pct": pct_vehicular,
                "industrial_emissions_pct": pct_industrial
            },
            "forecast_48h": forecast_res,
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        }

if __name__ == "__main__":
    predictor = HyperlocalPredictor()
    print("Village search test for 'Assandh':", predictor.search_localities("Assandh"))
    print("Reverse geocode test:", predictor.reverse_geocode_location(29.8142, 76.5310))
