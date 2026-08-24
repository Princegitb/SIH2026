import numpy as np
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class SourceAttributor:
    def __init__(self):
        pass

    def compute_attribution(self, hcho_col, no2_col, so2_col, co_col, cell_type="rural", smoke_impact=0.0):
        """
        Chemical Mass Balance (CMB) trace-gas ratio decomposition:
        - Biomass Burning: Driven by HCHO and CO, cross-damped by high SO2 (which indicates industrial combustion).
        - Vehicular Exhaust: Driven by NO2 and CO, scaled by urban density.
        - Industrial Point Sources: Driven by SO2 and high NO2 point sources.
        Guarantees 100% mass conservation and non-negative apportionment.
        """
        # Land-use prior base weights
        if cell_type == "urban":
            base_v, base_i, base_b = 52.0, 32.0, 16.0
        elif cell_type == "industrial":
            base_v, base_i, base_b = 22.0, 68.0, 10.0
        elif cell_type == "agricultural":
            base_v, base_i, base_b = 40.0, 35.0, 25.0
        else: # rural/other
            base_v, base_i, base_b = 42.0, 36.0, 22.0

        hcho = max(0.0, float(hcho_col))
        no2 = max(0.0, float(no2_col))
        so2 = max(0.0, float(so2_col))
        co = max(0.0, float(co_col))
        smoke = max(0.0, float(smoke_impact))

        # 1. Chemical decoupling: Excess HCHO above natural background (>3.2)
        excess_hcho = max(0.0, hcho - 3.2)
        
        # Industrial SO2 damping factor: If SO2 is high, some HCHO is from industrial solvents, not farm fires
        ind_so2_damping = np.clip(1.0 - (so2 / 2.5), 0.35, 1.0)
        
        biomass_sig = (excess_hcho * 2.8 * ind_so2_damping) + (smoke * 0.18)
        vehicular_sig = (no2 * 3.2) + (co * 0.9)
        industrial_sig = (so2 * 6.5) + (no2 * 0.6)
        
        weight_b = base_b + biomass_sig * 3.2
        weight_v = base_v + vehicular_sig * 2.8
        weight_i = base_i + industrial_sig * 3.0
        
        # Severe smoke transport suppresses local vehicular relative percentage
        if smoke > 25.0:
            suppress_factor = min(0.65, smoke / 180.0)
            weight_v *= (1.0 - suppress_factor)
            weight_i *= (1.0 - suppress_factor * 0.5)
            
        total = weight_b + weight_v + weight_i
        total = total if total > 0 else 1.0
        
        p_b = round((weight_b / total) * 100.0, 1)
        p_v = round((weight_v / total) * 100.0, 1)
        p_i = round(100.0 - (p_b + p_v), 1)
        
        return {
            "biomass_pct": max(0.0, p_b),
            "vehicular_pct": max(0.0, p_v),
            "industrial_pct": max(0.0, p_i)
        }

    def attribute_dataframe(self, df):
        """
        Applies vectorized Chemical Mass Balance attribution to a whole dataframe.
        """
        smoke = df["smoke_impact"].values if "smoke_impact" in df.columns else np.zeros(len(df))
        cell_types = df["type"].values
        hcho = np.maximum(0.0, df["hcho_column"].values)
        no2 = np.maximum(0.0, df["no2_column"].values)
        so2 = np.maximum(0.0, df["so2_column"].values)
        co = np.maximum(0.0, df["co_column"].values)

        # Base weights vectorization
        base_v = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [52.0, 22.0, 40.0], default=42.0)
        base_i = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [32.0, 68.0, 35.0], default=36.0)
        base_b = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [16.0, 10.0, 25.0], default=22.0)

        excess_hcho = np.maximum(0.0, hcho - 3.2)
        ind_damping = np.clip(1.0 - (so2 / 2.5), 0.35, 1.0)
        
        biomass_sig = (excess_hcho * 2.8 * ind_damping) + (smoke * 0.18)
        vehicular_sig = (no2 * 3.2) + (co * 0.9)
        industrial_sig = (so2 * 6.5) + (no2 * 0.6)

        weight_b = base_b + biomass_sig * 3.2
        weight_v = base_v + vehicular_sig * 2.8
        weight_i = base_i + industrial_sig * 3.0

        heavy_smoke_mask = smoke > 25.0
        smoke_factor = np.clip(smoke / 180.0, 0.0, 0.65)
        weight_v = np.where(heavy_smoke_mask, weight_v * (1.0 - smoke_factor), weight_v)
        weight_i = np.where(heavy_smoke_mask, weight_i * (1.0 - smoke_factor * 0.5), weight_i)

        total = weight_b + weight_v + weight_i
        total = np.where(total == 0, 1.0, total)

        b_pct = np.round((weight_b / total) * 100.0, 1)
        v_pct = np.round((weight_v / total) * 100.0, 1)
        i_pct = np.round(100.0 - (b_pct + v_pct), 1)

        out_df = df.copy()
        out_df["source_biomass_pct"] = np.maximum(0.0, b_pct)
        out_df["source_vehicular_pct"] = np.maximum(0.0, v_pct)
        out_df["source_industrial_pct"] = np.maximum(0.0, i_pct)
        return out_df

if __name__ == "__main__":
    attributor = SourceAttributor()
    print("Clean rural (no fires):", attributor.compute_attribution(4.0, 0.87, 0.16, 0.37, "agricultural", 0.0))
    print("Heavy stubble smoke:", attributor.compute_attribution(14.0, 4.0, 0.8, 2.0, "agricultural", 150.0))
