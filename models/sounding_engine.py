import numpy as np
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class AtmosphericSoundingEngine:
    """
    3D Atmospheric Volume & Sounding Profile Engine.
    Generates vertical meteorological soundings T(z), Planetary Boundary Layer (PBL) inversion lid geometry,
    and 3D Lagrangian streamline coordinates for Three.js volumetric rendering.
    """
    def __init__(self):
        pass

    def generate_atmospheric_profile(
        self,
        blh_m: float = 480.0,
        surface_temp_c: float = 16.5,
        wind_speed_kmh: float = 14.0,
        frp_total: float = 185.0,
        smoke_intensity_ug: float = 240.0
    ) -> dict:
        """
        Generates 3D altitude slices, Skew-T temperature profile, and 3D streamline points.
        """
        blh_m = float(max(200.0, min(1800.0, blh_m)))
        surface_temp = float(surface_temp_c)
        
        # 1. Vertical Sounding Profile T(z) from 0m to 2500m
        altitudes = np.linspace(0, 2500, 51) # Every 50m
        temps = []
        humidities = []
        wind_speeds = []
        pm25_altitudes = []

        inversion_base = float(max(100.0, blh_m * 0.75))
        inversion_top = float(blh_m * 1.25)
        inversion_strength = float(np.clip((1200.0 - blh_m) / 120.0, 1.5, 7.5)) # Stronger inversion in winter

        for z in altitudes:
            z_f = float(z)
            # Temperature profile: Nocturnal radiation inversion
            if z_f < inversion_base:
                # Slight warming or neutral in surface layer
                t_z = surface_temp + (z_f / inversion_base) * 1.5
                rh_z = 78.0 - (z_f / inversion_base) * 12.0
                pm_z = smoke_intensity_ug * (1.0 - 0.15 * (z_f / inversion_base))
                w_z = wind_speed_kmh * (0.4 + 0.6 * (z_f / inversion_base))
            elif z_f <= inversion_top:
                # Inversion zone: Temperature increases with height (dT/dz > 0)
                inv_progress = (z_f - inversion_base) / max(1.0, (inversion_top - inversion_base))
                t_z = surface_temp + 1.5 + (inv_progress * inversion_strength)
                rh_z = 66.0 - inv_progress * 24.0
                # Smog trapped immediately underneath lid
                pm_z = smoke_intensity_ug * (0.85 - 0.65 * inv_progress)
                w_z = wind_speed_kmh * (1.0 + 0.35 * inv_progress)
            else:
                # Free Troposphere: Standard dry adiabatic lapse rate (-6.5 C/km)
                dz_above = z_f - inversion_top
                t_top = surface_temp + 1.5 + inversion_strength
                t_z = t_top - (dz_above / 1000.0) * 6.5
                rh_z = max(15.0, 42.0 - (dz_above / 1000.0) * 18.0)
                # Free atmosphere is clean
                pm_z = max(8.0, smoke_intensity_ug * 0.12 * np.exp(-dz_above / 350.0))
                w_z = wind_speed_kmh * 1.45

            temps.append(round(t_z, 2))
            humidities.append(round(rh_z, 1))
            wind_speeds.append(round(w_z, 1))
            pm25_altitudes.append(round(pm_z, 1))

        # 2. Key Atmospheric Altitude Strata
        layers = [
            {
                "id": "surface_canopy",
                "name": "Surface Breathing Zone",
                "alt_range": "0 - 150m",
                "altitude_m": 75,
                "pm25_avg": round(float(np.mean(pm25_altitudes[:4])), 1),
                "temp_c": temps[0],
                "description": "Human exposure layer. Traps toxic coarse & fine particulates at breathing height.",
                "color": "#ef4444",
                "status": "Hazardous Ground Exposure"
            },
            {
                "id": "nocturnal_mixing",
                "name": "Nocturnal Mixing Layer",
                "alt_range": "150 - 450m",
                "altitude_m": 300,
                "pm25_avg": round(float(np.mean(pm25_altitudes[4:10])), 1),
                "temp_c": temps[6],
                "description": "Dense thermal pool where advected smoke accumulates overnight.",
                "color": "#f97316",
                "status": "Severe Smog Accumulation"
            },
            {
                "id": "inversion_cap",
                "name": "PBL Inversion Lid (Thermal Cap)",
                "alt_range": f"{int(inversion_base)} - {int(inversion_top)}m",
                "altitude_m": int(blh_m),
                "pm25_avg": round(pm25_altitudes[int(blh_m / 50)], 1),
                "temp_c": temps[int(blh_m / 50)],
                "description": f"Impenetrable atmospheric ceiling (BLH: {int(blh_m)}m). Prevents vertical plume dispersion.",
                "color": "#a855f7",
                "status": "Inversion Trap Active"
            },
            {
                "id": "advection_jet",
                "name": "Plume Transport Advection Channel",
                "alt_range": f"{int(inversion_top)} - 1200m",
                "altitude_m": 900,
                "pm25_avg": round(float(np.mean(pm25_altitudes[15:25])), 1),
                "temp_c": temps[18],
                "description": "Fast NW planetary winds (22 km/h) carrying buoyant smoke from Punjab towards Delhi-NCR.",
                "color": "#0ea5e9",
                "status": "High-Speed Advection"
            },
            {
                "id": "free_troposphere",
                "name": "Free Troposphere Boundary",
                "alt_range": "1200 - 2500m+",
                "altitude_m": 1800,
                "pm25_avg": round(float(np.mean(pm25_altitudes[30:])), 1),
                "temp_c": temps[36],
                "description": "Pristine upper atmosphere unaffected by surface biomass emissions.",
                "color": "#10b981",
                "status": "Pristine / Unpolluted"
            }
        ]

        # 3. 3D Regional Streamlines (Coordinates for Three.js 3D curves)
        # Origin Punjab -> Haryana -> Delhi receptor basin
        # Normalized 3D coordinates: x (-50 to +50), z_alt (0 to 40), y (-30 to +30)
        streamlines = []
        origin_nodes = [
            {"name": "Sangrur Source", "x": -42, "y": 28, "frp": 140},
            {"name": "Amritsar Source", "x": -48, "y": 38, "frp": 110},
            {"name": "Ludhiana Source", "x": -36, "y": 32, "frp": 95}
        ]

        for orig in origin_nodes:
            # 3D Curve points
            pts = []
            # Start at ground
            pts.append({"x": orig["x"], "y": orig["y"], "z": 0.5, "desc": "Fire Ground Ignition"})
            # Briggs plume lofting up to ~1150m (normalized ~18 units)
            loft_z = min(22.0, (orig["frp"] / 140.0) * 18.0)
            pts.append({"x": orig["x"] + 10, "y": orig["y"] - 8, "z": loft_z, "desc": "Thermal Buoyancy Lofting"})
            # Advection along Haryana transit
            pts.append({"x": -15, "y": 10, "z": loft_z * 0.9, "desc": "Patiala/Ambala Transit"})
            pts.append({"x": 5, "y": -5, "z": loft_z * 0.75, "desc": "Karnal Transport Corridor"})
            # Descent & Inversion compression over Delhi-NCR
            lid_norm_z = (blh_m / 2500.0) * 40.0
            pts.append({"x": 28, "y": -22, "z": min(lid_norm_z * 0.85, 7.5), "desc": "Delhi-NCR Inversion Trap"})
            
            streamlines.append({
                "origin": orig["name"],
                "frp": orig["frp"],
                "points": pts
            })

        # 4. Regional 3D Landmarks
        landmarks = [
            {"name": "Sangrur (Punjab)", "x": -42, "y": 28, "type": "origin", "color": "#ef4444"},
            {"name": "Ludhiana (Punjab)", "x": -36, "y": 32, "type": "origin", "color": "#ef4444"},
            {"name": "Patiala (Punjab)", "x": -26, "y": 20, "type": "transit", "color": "#f97316"},
            {"name": "Ambala (Haryana)", "x": -18, "y": 14, "type": "transit", "color": "#f97316"},
            {"name": "Karnal (Haryana)", "x": 0, "y": 0, "type": "transit", "color": "#eab308"},
            {"name": "Panipat (Haryana)", "x": 12, "y": -10, "type": "transit", "color": "#eab308"},
            {"name": "Delhi-NCR (Receptor)", "x": 28, "y": -22, "type": "receptor", "color": "#8b5cf6"},
            {"name": "Gurugram (Receptor)", "x": 24, "y": -28, "type": "receptor", "color": "#8b5cf6"},
            {"name": "Noida (Receptor)", "x": 35, "y": -20, "type": "receptor", "color": "#8b5cf6"}
        ]

        return {
            "telemetry": {
                "blh_m": int(blh_m),
                "inversion_base_m": int(inversion_base),
                "inversion_top_m": int(inversion_top),
                "inversion_strength_c": round(inversion_strength, 1),
                "surface_temp_c": surface_temp,
                "surface_pm25_ug": smoke_intensity_ug,
                "inversion_status": "Severe Nocturnal Trap" if blh_m < 500 else ("Moderate Inversion" if blh_m < 850 else "High Ventilation / Dispersed")
            },
            "sounding_profile": {
                "altitudes_m": [int(a) for a in altitudes],
                "temperatures_c": temps,
                "humidities_pct": humidities,
                "wind_speeds_kmh": wind_speeds,
                "pm25_concentrations": pm25_altitudes
            },
            "layers": layers,
            "streamlines": streamlines,
            "landmarks": landmarks
        }

if __name__ == "__main__":
    engine = AtmosphericSoundingEngine()
    prof = engine.generate_atmospheric_profile(blh_m=480.0, surface_temp_c=16.0, smoke_intensity_ug=260.0)
    print("Inversion Telemetry:", prof["telemetry"])
    print("Altitude Strata Count:", len(prof["layers"]))
    print("Streamlines Count:", len(prof["streamlines"]))
