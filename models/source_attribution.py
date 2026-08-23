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
        Decomposes the source attribution into Biomass %, Vehicular %, and Industrial %
        using gas ratios and cell types.
        """
        if cell_type == "urban":
            base_v = 55.0
            base_i = 30.0
            base_b = 15.0
        elif cell_type == "industrial":
            base_v = 25.0
            base_i = 65.0
            base_b = 10.0
        elif cell_type == "agricultural":
            base_v = 45.0
            base_i = 35.0
            base_b = 20.0
        else: # rural/other
            base_v = 45.0
            base_i = 35.0
            base_b = 20.0

        excess_hcho = max(0.0, float(hcho_col) - 3.5)
        biomass_sig = excess_hcho * 2.5 + (float(smoke_impact) * 0.15)
        vehicular_sig = float(no2_col) * 3.5 + float(co_col) * 0.8
        industrial_sig = float(so2_col) * 6.0 + float(no2_col) * 0.5
        
        weight_b = base_b + biomass_sig * 3.0
        weight_v = base_v + vehicular_sig * 3.0
        weight_i = base_i + industrial_sig * 3.0
        
        if float(smoke_impact) > 30.0:
            smoke_factor = min(0.6, float(smoke_impact) / 200.0)
            weight_v *= (1.0 - smoke_factor)
            
        total = weight_b + weight_v + weight_i
        total = total if total > 0 else 1.0
        
        biomass_pct = (weight_b / total) * 100.0
        vehicular_pct = (weight_v / total) * 100.0
        industrial_pct = (weight_i / total) * 100.0
        
        p_b = round(biomass_pct, 1)
        p_v = round(vehicular_pct, 1)
        p_i = round(100.0 - (p_b + p_v), 1)
        
        return {
            "biomass_pct": p_b,
            "vehicular_pct": p_v,
            "industrial_pct": p_i
        }

    def attribute_dataframe(self, df):
        """
        Applies vectorized source attribution to a whole dataframe for ultra-fast startup.
        """
        smoke = df["smoke_impact"].values if "smoke_impact" in df.columns else np.zeros(len(df))
        cell_types = df["type"].values
        hcho = df["hcho_column"].values
        no2 = df["no2_column"].values
        so2 = df["so2_column"].values
        co = df["co_column"].values

        # Base weights vectorization
        base_v = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [55.0, 25.0, 45.0], default=45.0)
        base_i = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [30.0, 65.0, 35.0], default=35.0)
        base_b = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [15.0, 10.0, 20.0], default=20.0)

        # Biomass signal rises only when HCHO exceeds atmospheric background (>3.5) or smoke is present
        excess_hcho = np.maximum(0.0, hcho - 3.5)
        biomass_sig = excess_hcho * 2.5 + (smoke * 0.15)
        vehicular_sig = no2 * 3.5 + co * 0.8
        industrial_sig = so2 * 6.0 + no2 * 0.5

        weight_b = base_b + biomass_sig * 3.0
        weight_v = base_v + vehicular_sig * 3.0
        weight_i = base_i + industrial_sig * 3.0

        heavy_smoke_mask = smoke > 30.0
        smoke_factor = np.clip(smoke / 200.0, 0.0, 0.6)
        weight_v = np.where(heavy_smoke_mask, weight_v * (1.0 - smoke_factor), weight_v)

        total = weight_b + weight_v + weight_i
        total = np.where(total == 0, 1.0, total)

        b_pct = np.round((weight_b / total) * 100.0, 1)
        v_pct = np.round((weight_v / total) * 100.0, 1)
        i_pct = np.round(100.0 - (b_pct + v_pct), 1)

        out_df = df.copy()
        out_df["source_biomass_pct"] = b_pct
        out_df["source_vehicular_pct"] = v_pct
        out_df["source_industrial_pct"] = i_pct
        return out_df

if __name__ == "__main__":
    attributor = SourceAttributor()
    print("Clean rural (no fires):", attributor.compute_attribution(4.0, 0.87, 0.16, 0.37, "agricultural", 0.0))
    print("Heavy stubble smoke:", attributor.compute_attribution(14.0, 4.0, 0.8, 2.0, "agricultural", 150.0))
