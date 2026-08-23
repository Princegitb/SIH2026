import logging
import numpy as np

logger = logging.getLogger("VayuShetra-InsightEngine")

class AtmosphericInsightEngine:
    """
    Dynamic Atmospheric Intelligence Synthesis Engine.
    Evaluates multidimensional satellite, meteorological, and chemical metrics
    to generate data-driven atmospheric diagnostics, causal attributions, and public health advisories.
    """
    def __init__(self):
        pass

    def generate_insight(self, district_data: dict, fire_count: int = 0, dominant_source: str = None) -> dict:
        """
        Synthesizes atmospheric and dispersion data into real intelligence diagnostics.
        """
        aqi = int(district_data.get("aqi", 150))
        pm25 = float(district_data.get("pm25", 75.0))
        pm10 = float(district_data.get("pm10", 140.0))
        blh = float(district_data.get("blh", 600.0))
        wind_u = float(district_data.get("wind_u", 2.0))
        wind_v = float(district_data.get("wind_v", -1.5))
        wind_spd = float(district_data.get("wind_speed", np.sqrt(wind_u**2 + wind_v**2) * 3.6))
        hcho = float(district_data.get("hcho_column", 3.0))
        district = str(district_data.get("district", "Delhi-NCR"))

        # 1. Thermal Inversion & Atmospheric Compression Assessment
        if blh < 250:
            inv_status = "Critical Surface Inversion"
            inv_impact = f"Planetary Boundary Layer severely compressed to {int(blh)}m, creating a lid that traps ground emissions."
        elif blh < 480:
            inv_status = "Moderate Boundary Compression"
            inv_impact = f"Boundary Layer Height ({int(blh)}m) limits vertical particulate mixing, promoting localized accumulation."
        else:
            inv_status = "Favorable Atmospheric Dispersion"
            inv_impact = f"Healthy vertical boundary layer ({int(blh)}m) permits active vertical dilution and convective transport."

        # 2. Wind Transport & Directional Advection
        angle = np.degrees(np.arctan2(wind_u, wind_v))
        if angle < 0:
            angle += 360
        
        # Wind cardinal direction
        cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        card_idx = int((angle + 11.25) / 22.5) % 16
        wind_dir = cardinals[card_idx]

        if wind_spd < 7.0:
            dispersion_summary = f"Stagnant surface air ({wind_spd:.1f} km/h from {wind_dir}) preventing horizontal pollutant clearance."
        elif "NW" in wind_dir or "WNW" in wind_dir or "NNW" in wind_dir:
            dispersion_summary = f"Prevailing North-Westerly corridor ({wind_spd:.1f} km/h) transporting transboundary smoke plumes downwind."
        else:
            dispersion_summary = f"Moderate regional wind flow ({wind_spd:.1f} km/h from {wind_dir}) providing continuous lateral advection."

        # 3. Chemical Source Fingerprint
        if dominant_source is None:
            if hcho > 4.5 or fire_count > 40:
                dominant_source = "Biomass / Stubble Smoke"
            elif pm25 / max(1.0, pm10) > 0.65:
                dominant_source = "Vehicular Exhaust & Combustion"
            else:
                dominant_source = "Industrial / Fugitive Dust"

        # 4. Synthesized Intelligence Headline & Summary
        if aqi > 300:
            headline = f"Severe Air Quality Alert in {district} ({aqi} AQI)"
            recommendation = "Activate emergency anti-dust measures, enforce industrial emission caps, and recommend N95 respirators outdoors."
        elif aqi > 200:
            headline = f"Elevated Pollution Trap in {district} ({aqi} AQI)"
            recommendation = "Restrict open biomass burning, optimize traffic signaling to reduce idle emissions, and protect vulnerable populations."
        elif aqi > 100:
            headline = f"Moderate Atmospheric Load in {district} ({aqi} AQI)"
            recommendation = "Maintain regular street mechanical sweeping and monitor upwind active fire hot spots."
        else:
            headline = f"Satisfactory Atmospheric Conditions in {district} ({aqi} AQI)"
            recommendation = "Air quality conforms to national standards; maintain standard baseline ambient monitoring."

        full_diagnostic = f"{headline}: {inv_impact} {dispersion_summary} Primary driver: {dominant_source} with {fire_count} active satellite fire detections upstream."

        return {
            "headline": headline,
            "summary": full_diagnostic,
            "recommendation": recommendation,
            "inversion_status": inv_status,
            "boundary_layer_height_m": int(blh),
            "wind_flow": f"{wind_spd:.1f} km/h from {wind_dir}",
            "dominant_source": dominant_source,
            "fire_hotspot_count": fire_count
        }

insight_engine = AtmosphericInsightEngine()
