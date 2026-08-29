import numpy as np
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class PolicySimulator:
    """
    District-Targeted Digital Twin Policy Simulator.
    Calculates exact local baseline and simulated air quality for whichever district is selected
    (e.g., Ludhiana, Sangrur, Amritsar, Patiala, Karnal, Delhi, etc.),
    plus downwind secondary benefits across connected cities.
    """
    def __init__(self):
        # District geographical profiles & typical emissions breakdown
        self.DISTRICT_PROFILES = {
            "Ludhiana": {
                "state": "Punjab", "lat": 30.9010, "lon": 75.8573, 
                "population_lakhs": 38.5, "biomass_share": 0.65, "vehicular_share": 0.22, "industrial_share": 0.13,
                "typical_farm_fires": 110, "downwind_cities": ["Patiala", "Ambala", "Karnal", "Delhi-NCR"]
            },
            "Sangrur": {
                "state": "Punjab", "lat": 30.2450, "lon": 75.8420, 
                "population_lakhs": 18.2, "biomass_share": 0.78, "vehicular_share": 0.14, "industrial_share": 0.08,
                "typical_farm_fires": 160, "downwind_cities": ["Patiala", "Kaithal", "Jind", "Delhi-NCR"]
            },
            "Amritsar": {
                "state": "Punjab", "lat": 31.6340, "lon": 74.8723, 
                "population_lakhs": 27.4, "biomass_share": 0.70, "vehicular_share": 0.20, "industrial_share": 0.10,
                "typical_farm_fires": 95, "downwind_cities": ["Jalandhar", "Ludhiana", "Karnal", "Delhi-NCR"]
            },
            "Patiala": {
                "state": "Punjab", "lat": 30.3398, "lon": 76.3869, 
                "population_lakhs": 21.1, "biomass_share": 0.62, "vehicular_share": 0.24, "industrial_share": 0.14,
                "typical_farm_fires": 80, "downwind_cities": ["Ambala", "Kurukshetra", "Panipat", "Delhi-NCR"]
            },
            "Jalandhar": {
                "state": "Punjab", "lat": 31.3260, "lon": 75.5762, 
                "population_lakhs": 24.5, "biomass_share": 0.58, "vehicular_share": 0.26, "industrial_share": 0.16,
                "typical_farm_fires": 70, "downwind_cities": ["Ludhiana", "Patiala", "Delhi-NCR"]
            },
            "Firozpur": {
                "state": "Punjab", "lat": 30.9237, "lon": 74.6122, 
                "population_lakhs": 12.8, "biomass_share": 0.75, "vehicular_share": 0.16, "industrial_share": 0.09,
                "typical_farm_fires": 85, "downwind_cities": ["Bhatinda", "Sirsa", "Hisar", "Delhi-NCR"]
            },
            "Bhatinda": {
                "state": "Punjab", "lat": 30.2110, "lon": 74.9455, 
                "population_lakhs": 15.6, "biomass_share": 0.72, "vehicular_share": 0.18, "industrial_share": 0.10,
                "typical_farm_fires": 75, "downwind_cities": ["Sirsa", "Fatehabad", "Rohtak", "Delhi-NCR"]
            },
            "Tarn Taran": {
                "state": "Punjab", "lat": 31.4520, "lon": 74.9250, 
                "population_lakhs": 12.2, "biomass_share": 0.80, "vehicular_share": 0.12, "industrial_share": 0.08,
                "typical_farm_fires": 65, "downwind_cities": ["Firozpur", "Ludhiana", "Delhi-NCR"]
            },
            "Karnal": {
                "state": "Haryana", "lat": 29.6857, "lon": 76.9905, 
                "population_lakhs": 16.5, "biomass_share": 0.52, "vehicular_share": 0.30, "industrial_share": 0.18,
                "typical_farm_fires": 45, "downwind_cities": ["Panipat", "Sonipat", "Delhi-NCR", "Noida"]
            },
            "Kaithal": {
                "state": "Haryana", "lat": 29.8015, "lon": 76.3997, 
                "population_lakhs": 11.8, "biomass_share": 0.58, "vehicular_share": 0.26, "industrial_share": 0.16,
                "typical_farm_fires": 40, "downwind_cities": ["Jind", "Rohtak", "Delhi-NCR", "Gurugram"]
            },
            "Kurukshetra": {
                "state": "Haryana", "lat": 29.9695, "lon": 76.8783, 
                "population_lakhs": 10.9, "biomass_share": 0.54, "vehicular_share": 0.28, "industrial_share": 0.18,
                "typical_farm_fires": 35, "downwind_cities": ["Karnal", "Panipat", "Delhi-NCR"]
            },
            "Ambala": {
                "state": "Haryana", "lat": 30.3782, "lon": 76.7767, 
                "population_lakhs": 12.5, "biomass_share": 0.48, "vehicular_share": 0.32, "industrial_share": 0.20,
                "typical_farm_fires": 30, "downwind_cities": ["Kurukshetra", "Karnal", "Delhi-NCR"]
            },
            "Panipat": {
                "state": "Haryana", "lat": 29.3909, "lon": 76.9635, 
                "population_lakhs": 14.2, "biomass_share": 0.45, "vehicular_share": 0.30, "industrial_share": 0.25,
                "typical_farm_fires": 25, "downwind_cities": ["Sonipat", "Delhi-NCR", "Noida", "Faridabad"]
            },
            "Delhi": {
                "state": "Delhi-NCR", "lat": 28.6139, "lon": 77.2090, 
                "population_lakhs": 320.0, "biomass_share": 0.38, "vehicular_share": 0.42, "industrial_share": 0.20,
                "typical_farm_fires": 0, "downwind_cities": ["Noida", "Gurugram", "Faridabad", "Ghaziabad"]
            },
            "All Punjab": {
                "state": "Punjab", "lat": 30.8000, "lon": 75.5000, 
                "population_lakhs": 300.0, "biomass_share": 0.72, "vehicular_share": 0.18, "industrial_share": 0.10,
                "typical_farm_fires": 650, "downwind_cities": ["Haryana State", "Delhi-NCR", "Western UP"]
            },
            "All Haryana": {
                "state": "Haryana", "lat": 29.5000, "lon": 76.5000, 
                "population_lakhs": 280.0, "biomass_share": 0.50, "vehicular_share": 0.30, "industrial_share": 0.20,
                "typical_farm_fires": 220, "downwind_cities": ["Delhi-NCR", "Noida", "Gurugram", "Faridabad"]
            },
            "All North India (Regional Blanket Ban)": {
                "state": "Regional", "lat": 30.0000, "lon": 76.0000, 
                "population_lakhs": 650.0, "biomass_share": 0.65, "vehicular_share": 0.23, "industrial_share": 0.12,
                "typical_farm_fires": 870, "downwind_cities": ["Delhi-NCR Basin", "Indo-Gangetic Plain"]
            }
        }

    def simulate_policy_intervention(
        self,
        target_district: str = "Ludhiana",
        stubble_ban_pct: float = 80.0,
        traffic_curb_pct: float = 0.0,
        industry_curb_pct: float = 0.0,
        baseline_pm25: float = 185.0,
        baseline_aqi: int = 295,
        wind_speed_kmh: float = 14.0,
        blh_m: float = 520.0,
        active_fires_df: pd.DataFrame = None
    ) -> dict:
        """
        Runs digital twin simulation focusing primarily on the selected target district.
        """
        stubble_ban_pct = float(np.clip(stubble_ban_pct, 0.0, 100.0))
        traffic_curb_pct = float(np.clip(traffic_curb_pct, 0.0, 50.0))
        industry_curb_pct = float(np.clip(industry_curb_pct, 0.0, 50.0))

        # Get district profile
        profile = self.DISTRICT_PROFILES.get(target_district, self.DISTRICT_PROFILES.get("Ludhiana"))
        state = profile["state"]
        pop_lakhs = profile["population_lakhs"]
        
        biomass_share = profile["biomass_share"]
        vehicular_share = profile["vehicular_share"]
        industrial_share = profile["industrial_share"]
        
        # 1. Local Reductions in Selected District
        delta_pm25_biomass = (baseline_pm25 * biomass_share) * (stubble_ban_pct / 100.0)
        delta_pm25_traffic = (baseline_pm25 * vehicular_share) * (traffic_curb_pct / 100.0)
        delta_pm25_industry = (baseline_pm25 * industrial_share) * (industry_curb_pct / 100.0)
        
        total_delta_pm25 = float(np.round(delta_pm25_biomass + delta_pm25_traffic + delta_pm25_industry, 1))
        simulated_pm25 = float(np.round(max(18.0, baseline_pm25 - total_delta_pm25), 1))
        
        # 2. CPCB AQI Conversion for simulated values
        from models.aqi_model import calculate_sub_index
        simulated_aqi = int(round(calculate_sub_index(simulated_pm25, "pm25")))
        aqi_points_reduced = int(max(0, baseline_aqi - simulated_aqi))
        pct_improvement = float(round((total_delta_pm25 / max(1.0, baseline_pm25)) * 100.0, 1))
        
        # 3. Local Health & Economic Benefits for Selected District
        district_population = int(pop_lakhs * 100_000)
        baseline_weekly_admissions = int(round(district_population * 0.00015)) # ~15 admissions per 1 Lakh pop/week
        
        beta_health = 0.0038
        relative_risk_reduction = 1.0 - np.exp(-beta_health * (total_delta_pm25 / 10.0))
        admissions_prevented = int(round(baseline_weekly_admissions * relative_risk_reduction))
        admissions_prevented = max(1, admissions_prevented) if total_delta_pm25 > 5.0 else 0
        
        economic_savings_crores = float(round((admissions_prevented * 26000 * 4.0) / 10_000_000, 2))
        
        # Active Farm fires in this district
        typical_fires = profile["typical_farm_fires"]
        fires_curbed = int(round(typical_fires * (stubble_ban_pct / 100.0)))
        
        # 4. Downwind Connected Cities Benefits
        downwind_list = []
        downwind_names = profile.get("downwind_cities", ["Patiala", "Ambala", "Karnal", "Delhi-NCR"])
        
        for idx, city_name in enumerate(downwind_names):
            distance_decay = 0.85 ** (idx + 1)
            city_saved_pm25 = float(round(total_delta_pm25 * distance_decay * 0.75, 1))
            city_saved_aqi = int(round(aqi_points_reduced * distance_decay * 0.70))
            
            downwind_list.append({
                "city": city_name,
                "distance_order": idx + 1,
                "pm25_saved": city_saved_pm25,
                "aqi_points_saved": city_saved_aqi,
                "eta_hours": 12 * (idx + 1),
                "message": f"Receives cleaner air {12 * (idx + 1)}h after {target_district} enforces ban"
            })

        # 5. Local Administrative Recommendation
        def get_local_recommendation(district_name, sim_aqi, saved_pts):
            if sim_aqi <= 100:
                return f"Excellent! {district_name}'s air quality recovers to 'Satisfactory / Clean Sky' (AQI {sim_aqi}). All local schools and morning activities can operate safely."
            elif sim_aqi <= 200:
                return f"Great Recovery! {district_name}'s air moves into 'Moderate' (AQI {sim_aqi}), saving {saved_pts} AQI points and clearing the smog."
            else:
                return f"{district_name}'s air improves by {saved_pts} points. Additional regional coordination with neighboring districts is recommended to reach full clean air levels."

        local_rec = get_local_recommendation(target_district, simulated_aqi, aqi_points_reduced)

        return {
            "target_district_summary": {
                "district_name": target_district,
                "state": state,
                "population_lakhs": pop_lakhs,
                "baseline_pm25": baseline_pm25,
                "simulated_pm25": simulated_pm25,
                "pm25_reduced": total_delta_pm25,
                "baseline_aqi": baseline_aqi,
                "simulated_aqi": simulated_aqi,
                "aqi_reduced": aqi_points_reduced,
                "pct_improvement": pct_improvement,
                "typical_farm_fires": typical_fires,
                "fires_curbed": fires_curbed,
                "sector_breakdown_pm25": {
                    "stubble_saved": float(round(delta_pm25_biomass, 1)),
                    "traffic_saved": float(round(delta_pm25_traffic, 1)),
                    "industry_saved": float(round(delta_pm25_industry, 1))
                }
            },
            "local_health_roi": {
                "admissions_prevented_per_week": admissions_prevented,
                "economic_savings_crores": economic_savings_crores,
                "health_risk_reduction_pct": float(round(relative_risk_reduction * 100.0, 1))
            },
            "downwind_impact": downwind_list,
            "administrative_recommendation": local_rec,
            "available_districts": list(self.DISTRICT_PROFILES.keys())
        }

if __name__ == "__main__":
    sim = PolicySimulator()
    res = sim.simulate_policy_intervention(target_district="Ludhiana", stubble_ban_pct=80.0, baseline_pm25=190.0, baseline_aqi=310)
    print("Ludhiana Summary:", res["target_district_summary"])
    print("Downwind Chain:", res["downwind_impact"])
