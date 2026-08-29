import numpy as np
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class PolicySimulator:
    """
    Digital Twin Policy & Intervention Simulator.
    Allows government officials, DMs, and CAQM regulators to execute 'What-If' scenarios:
    Simulates district-targeted agricultural stubble burning bans, urban Odd-Even traffic restrictions,
    and industrial limits to project downwind PM2.5/AQI reductions, health benefits, and GRAP stage de-escalation.
    """
    def __init__(self):
        # District geographical coordinates & typical agricultural biomass share in upwind plume
        self.DISTRICT_PROFILES = {
            "Sangrur": {"state": "Punjab", "lat": 30.2450, "lon": 75.8420, "plume_weight": 0.28, "typical_fires": 140},
            "Ludhiana": {"state": "Punjab", "lat": 30.9010, "lon": 75.8573, "plume_weight": 0.22, "typical_fires": 110},
            "Amritsar": {"state": "Punjab", "lat": 31.6340, "lon": 74.8723, "plume_weight": 0.18, "typical_fires": 90},
            "Patiala": {"state": "Punjab", "lat": 30.3398, "lon": 76.3869, "plume_weight": 0.16, "typical_fires": 75},
            "Firozpur": {"state": "Punjab", "lat": 30.9237, "lon": 74.6122, "plume_weight": 0.14, "typical_fires": 70},
            "Bhatinda": {"state": "Punjab", "lat": 30.2110, "lon": 74.9455, "plume_weight": 0.15, "typical_fires": 65},
            "Tarn Taran": {"state": "Punjab", "lat": 31.4520, "lon": 74.9250, "plume_weight": 0.12, "typical_fires": 55},
            "Karnal": {"state": "Haryana", "lat": 29.6857, "lon": 76.9905, "plume_weight": 0.10, "typical_fires": 45},
            "Kaithal": {"state": "Haryana", "lat": 29.8015, "lon": 76.3997, "plume_weight": 0.08, "typical_fires": 40},
            "Kurukshetra": {"state": "Haryana", "lat": 29.9695, "lon": 76.8783, "plume_weight": 0.07, "typical_fires": 35},
            "Jind": {"state": "Haryana", "lat": 29.3160, "lon": 76.3180, "plume_weight": 0.08, "typical_fires": 30},
            "All Punjab": {"state": "Punjab", "lat": 30.8000, "lon": 75.5000, "plume_weight": 0.85, "typical_fires": 500},
            "All Haryana": {"state": "Haryana", "lat": 29.5000, "lon": 76.5000, "plume_weight": 0.35, "typical_fires": 180},
            "All North India (Regional Blanket Ban)": {"state": "Regional", "lat": 30.0000, "lon": 76.0000, "plume_weight": 1.00, "typical_fires": 680}
        }
        
        # Receptor cities downwind of the northwest agricultural corridor
        self.RECEPTOR_CITIES = {
            "Delhi (Central / NCR)": {"distance_km": 310, "transit_hours": 42, "urban_baseline_pm25": 72.0, "biomass_share_nominal": 0.62},
            "Gurugram & Faridabad": {"distance_km": 340, "transit_hours": 45, "urban_baseline_pm25": 68.0, "biomass_share_nominal": 0.58},
            "Karnal & Panipat": {"distance_km": 190, "transit_hours": 24, "urban_baseline_pm25": 48.0, "biomass_share_nominal": 0.45},
            "Noida & Greater Noida": {"distance_km": 325, "transit_hours": 44, "urban_baseline_pm25": 70.0, "biomass_share_nominal": 0.60}
        }

    def simulate_policy_intervention(
        self,
        target_district: str = "Sangrur",
        stubble_ban_pct: float = 80.0,
        traffic_curb_pct: float = 0.0,
        industry_curb_pct: float = 0.0,
        baseline_pm25: float = 245.0,
        baseline_aqi: int = 380,
        wind_speed_kmh: float = 13.0,
        blh_m: float = 515.0,
        active_fires_df: pd.DataFrame = None
    ) -> dict:
        """
        Executes a rigorous digital twin scenario.
        Returns exact PM2.5/AQI reductions, downwind receptor impact, health ROI, and GRAP recommendations.
        """
        stubble_ban_pct = float(np.clip(stubble_ban_pct, 0.0, 100.0))
        traffic_curb_pct = float(np.clip(traffic_curb_pct, 0.0, 50.0))
        industry_curb_pct = float(np.clip(industry_curb_pct, 0.0, 50.0))

        # Get district profile weight
        profile = self.DISTRICT_PROFILES.get(target_district, self.DISTRICT_PROFILES["Sangrur"])
        plume_weight = profile["plume_weight"]
        
        # Calculate effective biomass curb factor
        # If blanket ban ("All Punjab" / "All North India"), plume weight scales accordingly
        fractional_stubble_reduction = (stubble_ban_pct / 100.0) * min(1.0, plume_weight)
        
        # Atmospheric Inversion Coupling Factor
        # Lower boundary layer height increases receptor sensitivity to emission cuts
        inversion_sensitivity = np.clip(900.0 / max(250.0, blh_m), 0.8, 1.8)
        
        # 1. Delta PM2.5 reductions across individual sectors
        # Biomass contribution component
        nominal_biomass_portion = baseline_pm25 * 0.62 * (inversion_sensitivity / 1.4)
        delta_pm25_biomass = nominal_biomass_portion * fractional_stubble_reduction
        
        # Vehicular contribution component (Odd-Even traffic curtailment)
        nominal_vehicular_portion = baseline_pm25 * 0.25
        delta_pm25_traffic = nominal_vehicular_portion * (traffic_curb_pct / 100.0)
        
        # Industrial contribution component (Brick kilns / power plant limits)
        nominal_industrial_portion = baseline_pm25 * 0.13
        delta_pm25_industry = nominal_industrial_portion * (industry_curb_pct / 100.0)
        
        total_delta_pm25 = float(np.round(delta_pm25_biomass + delta_pm25_traffic + delta_pm25_industry, 1))
        simulated_pm25 = float(np.round(max(25.0, baseline_pm25 - total_delta_pm25), 1))
        
        # 2. CPCB AQI Conversion for simulated values
        from models.aqi_model import calculate_sub_index
        simulated_aqi = int(round(calculate_sub_index(simulated_pm25, "pm25")))
        aqi_points_reduced = int(max(0, baseline_aqi - simulated_aqi))
        pct_improvement = float(round((total_delta_pm25 / max(1.0, baseline_pm25)) * 100.0, 1))
        
        # 3. Downwind Receptor Cities Impact Matrix
        receptor_results = []
        for city_name, city_info in self.RECEPTOR_CITIES.items():
            dist_factor = np.clip(1.0 - (city_info["distance_km"] - 190.0) / 400.0, 0.65, 1.0)
            city_biomass_share = city_info["biomass_share_nominal"]
            
            # City-specific baseline and reduction
            city_base_pm25 = float(round(city_info["urban_baseline_pm25"] + (baseline_pm25 - 72.0) * (city_info["distance_km"] / 310.0), 1))
            city_delta_pm25 = float(round(total_delta_pm25 * (city_biomass_share / 0.62) * (1.0 / dist_factor * 0.88), 1))
            city_sim_pm25 = float(round(max(20.0, city_base_pm25 - city_delta_pm25), 1))
            
            city_base_aqi = int(round(calculate_sub_index(city_base_pm25, "pm25")))
            city_sim_aqi = int(round(calculate_sub_index(city_sim_pm25, "pm25")))
            
            receptor_results.append({
                "city": city_name,
                "transit_eta_hours": city_info["transit_hours"],
                "baseline_pm25": city_base_pm25,
                "simulated_pm25": city_sim_pm25,
                "pm25_reduced": city_delta_pm25,
                "baseline_aqi": city_base_aqi,
                "simulated_aqi": city_sim_aqi,
                "aqi_reduced": max(0, city_base_aqi - city_sim_aqi),
                "pct_improvement": round((city_delta_pm25 / max(1.0, city_base_pm25)) * 100.0, 1)
            })

        # 4. Public Health & Economic ROI Model (WHO / GBD Relative Risk Model)
        # Exposure response coefficient: 0.38% increase in acute respiratory hospital admissions per 10 ug/m3 PM2.5
        ncr_population = 32_000_000 # 3.2 Crore population in Delhi-NCR
        baseline_weekly_admissions = int(round(ncr_population * 0.00018)) # ~5,760 respiratory emergencies/week
        
        # Risk reduction calculation
        beta_health = 0.0038
        relative_risk_reduction = 1.0 - np.exp(-beta_health * (total_delta_pm25 / 10.0))
        admissions_prevented = int(round(baseline_weekly_admissions * relative_risk_reduction))
        
        # Economic valuation (healthcare cost + lost workdays avoided at Rs. 28,000 per severe respiratory event)
        economic_savings_crores = float(round((admissions_prevented * 28000 * 4.2) / 10_000_000, 2))
        
        # 5. GRAP (Graded Response Action Plan) Governance Optimization
        def get_grap_stage(aqi):
            if aqi > 450:
                return {"stage": "GRAP Stage-IV (Severe+ Emergency)", "color": "#7f1d1d", "badge": "bg-red-950 text-red-400 border border-red-800", "restrictions": "Ban on entry of non-BS6 diesel trucks, construction halt, school closures."}
            elif aqi > 400:
                return {"stage": "GRAP Stage-III (Severe)", "color": "#ef4444", "badge": "bg-red-500/20 text-red-400 border border-red-500/40", "restrictions": "Strict ban on BS-III petrol & BS-IV diesel cars, mining ban."}
            elif aqi > 300:
                return {"stage": "GRAP Stage-II (Very Poor)", "color": "#f97316", "badge": "bg-orange-500/20 text-orange-400 border border-orange-500/40", "restrictions": "Daily water sprinkling on roads, diesel generator restrictions, parking fee hike."}
            elif aqi > 200:
                return {"stage": "GRAP Stage-I (Poor)", "color": "#eab308", "badge": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40", "restrictions": "Anti-smog guns at construction sites, waste burning ban."}
            else:
                return {"stage": "Normal Atmosphere (Acceptable)", "color": "#10b981", "badge": "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40", "restrictions": "Standard ambient air maintenance."}

        baseline_grap = get_grap_stage(baseline_aqi)
        simulated_grap = get_grap_stage(simulated_aqi)
        
        can_deescalate = simulated_grap["stage"] != baseline_grap["stage"]
        deescalation_message = (
            f"Policy intervention allows Delhi-NCR to safely de-escalate from {baseline_grap['stage']} down to {simulated_grap['stage']} within 48 hours."
            if can_deescalate else
            f"Simulated reduction provides significant respiratory relief ({total_delta_pm25} µg/m³), while remaining within {baseline_grap['stage']} threshold."
        )

        return {
            "scenario": {
                "target_district": target_district,
                "stubble_ban_pct": stubble_ban_pct,
                "traffic_curb_pct": traffic_curb_pct,
                "industry_curb_pct": industry_curb_pct,
                "wind_speed_kmh": wind_speed_kmh,
                "blh_m": blh_m
            },
            "delhi_ncr_summary": {
                "baseline_pm25": baseline_pm25,
                "simulated_pm25": simulated_pm25,
                "pm25_reduced": total_delta_pm25,
                "baseline_aqi": baseline_aqi,
                "simulated_aqi": simulated_aqi,
                "aqi_reduced": aqi_points_reduced,
                "pct_improvement": pct_improvement,
                "sector_breakdown_pm25": {
                    "biomass_saved": float(round(delta_pm25_biomass, 1)),
                    "vehicular_saved": float(round(delta_pm25_traffic, 1)),
                    "industrial_saved": float(round(delta_pm25_industry, 1))
                }
            },
            "receptor_cities": receptor_results,
            "health_and_economic_roi": {
                "admissions_prevented_per_week": admissions_prevented,
                "economic_savings_crores": economic_savings_crores,
                "health_risk_reduction_pct": float(round(relative_risk_reduction * 100.0, 1))
            },
            "grap_compliance": {
                "baseline": baseline_grap,
                "simulated": simulated_grap,
                "can_deescalate": can_deescalate,
                "recommendation": deescalation_message
            },
            "available_districts": list(self.DISTRICT_PROFILES.keys())
        }

if __name__ == "__main__":
    sim = PolicySimulator()
    res = sim.simulate_policy_intervention(target_district="Sangrur", stubble_ban_pct=100.0, baseline_pm25=280.0, baseline_aqi=410)
    print("Simulated Delhi Reduction:", res["delhi_ncr_summary"])
    print("Health ROI:", res["health_and_economic_roi"])
    print("GRAP Action:", res["grap_compliance"]["recommendation"])
