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
        
        Rationals:
        - HCHO is a key tracer for VOCs emitted during biomass combustion.
        - NO2 is a tracer for high-temperature fossil-fuel combustion (vehicles, power plants).
        - SO2 is a tracer for sulfur-rich fuels (coal burning in industrial plants).
        - CO is a general combustion indicator.
        """
        # 1. Establish baselines based on land use / cell type
        if cell_type == "urban":
            base_v = 60.0
            base_i = 25.0
            base_b = 15.0
        elif cell_type == "industrial":
            base_v = 25.0
            base_i = 65.0
            base_b = 10.0
        elif cell_type == "agricultural":
            base_v = 20.0
            base_i = 15.0
            base_b = 65.0
        else: # rural/other
            base_v = 40.0
            base_i = 30.0
            base_b = 30.0

        # 2. Extract signals from columns (normalized/scaled inputs)
        # HCHO is primarily biomass marker in this region
        biomass_sig = hcho_col * 2.5 + (smoke_impact * 0.08)
        # NO2 is vehicular
        vehicular_sig = no2_col * 3.5 + co_col * 0.8
        # SO2 is industrial
        industrial_sig = so2_col * 6.0 + no2_col * 0.5
        
        # 3. Add signals to baselines
        weight_b = base_b + biomass_sig * 12.0
        weight_v = base_v + vehicular_sig * 4.0
        # Industrial areas shouldn't spike massively in biomass unless smoke is present
        weight_i = base_i + industrial_sig * 5.0
        
        # Adjust vehicular down in heavy smoke conditions (since smoke overwhelms local traffic)
        if smoke_impact > 30.0:
            weight_v *= (1.0 - min(0.6, smoke_impact / 200.0))
            
        # Sum weights and normalize to 100%
        total = weight_b + weight_v + weight_i
        
        biomass_pct = (weight_b / total) * 100.0
        vehicular_pct = (weight_v / total) * 100.0
        industrial_pct = (weight_i / total) * 100.0
        
        # Safety rounding to ensure exactly 100% sum
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
        base_v = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [60.0, 25.0, 20.0], default=40.0)
        base_i = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [25.0, 65.0, 15.0], default=30.0)
        base_b = np.select([cell_types == "urban", cell_types == "industrial", cell_types == "agricultural"], [15.0, 10.0, 65.0], default=30.0)

        biomass_sig = hcho * 2.5 + (smoke * 0.08)
        vehicular_sig = no2 * 3.5 + co * 0.8
        industrial_sig = so2 * 6.0 + no2 * 0.5

        weight_b = base_b + biomass_sig * 12.0
        weight_v = base_v + vehicular_sig * 4.0
        weight_i = base_i + industrial_sig * 5.0

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
    # Test urban cell with high smoke
    print("Urban (with smoke):", attributor.compute_attribution(4.5, 2.0, 0.5, 1.2, "urban", 120.0))
    # Test urban cell (no smoke)
    print("Urban (no smoke):", attributor.compute_attribution(1.2, 2.5, 0.6, 0.8, "urban", 0.0))
    # Test industrial cell
    print("Industrial:", attributor.compute_attribution(1.0, 1.8, 4.0, 1.5, "industrial", 0.0))
