import os
import pandas as pd
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def verify_pipeline():
    logger.info("=== Starting VayuDrishti Model Verification ===")
    
    # 1. Check if data exists
    if not (os.path.exists("data/grid_data.csv") and os.path.exists("data/ground_stations.csv")):
        logger.error("Simulation data files not found in data/ directory. Ensure the grid builder has completed.")
        return False
        
    # 2. Verify AQI model training and CPCB AQI calculation
    logger.info("--- Testing AQI Model (Stage 1 & 2) ---")
    from models.aqi_model import AQIModelManager
    model_manager = AQIModelManager()
    
    logger.info("Training models on ground station data...")
    val_results = model_manager.train_models()
    logger.info(f"Model validation complete. Spatial CV results: {val_results}")
    
    # Check that model files exist
    model_files = [f for f in os.listdir("models/saved") if f.endswith(".pkl")]
    logger.info(f"Saved model files: {model_files}")
    assert len(model_files) == 6, "Expected 6 trained model pickle files."
    
    # Load and predict on grid slice
    grid_df = pd.read_csv("data/grid_data.csv")
    sample_df = grid_df.head(100).copy()
    logger.info(f"Running predictions on a sample of {len(sample_df)} grid rows...")
    predictions = model_manager.predict_grid(sample_df)
    
    assert "aqi" in predictions.columns, "Predictions missing 'aqi' column."
    assert "aqi_category" in predictions.columns, "Predictions missing 'aqi_category' column."
    assert "sub_index_pm25" in predictions.columns, "Predictions missing pollutant sub-index columns."
    logger.info("AQI prediction check PASSED!")
    
    # 3. Verify Hotspot Detection
    logger.info("--- Testing DBSCAN Hotspot Detection ---")
    from models.hotspot_detection import HotspotDetector
    detector = HotspotDetector(hcho_percentile=90)
    
    # Take a specific day
    target_date = "2025-11-05"
    day_grid = grid_df[grid_df["date"] == target_date]
    fires_df = pd.read_csv("data/fire_events.csv")
    
    logger.info(f"Detecting hotspots for {target_date}...")
    hotspots = detector.detect_hotspots(day_grid, fires_df)
    
    assert "cluster_id" in hotspots.columns, "Hotspot output missing 'cluster_id'."
    assert "is_biomass_driven" in hotspots.columns, "Hotspot output missing 'is_biomass_driven'."
    logger.info(f"Detected {len(hotspots[hotspots['is_hotspot']])} hotspot grid cells. Check PASSED!")
    
    # 4. Verify Plume Transport and Lagged Correlation
    logger.info("--- Testing Wind Plume Trajectory & Correlation ---")
    from models.transport_model import WindTransportModel
    transport = WindTransportModel()
    
    # Trace plume from a fire point
    sample_fire = fires_df.iloc[0]
    u, v = 2.5, -2.5 # dummy wind components
    path = transport.project_plume_trajectory(sample_fire["latitude"], sample_fire["longitude"], u, v, hours=12)
    logger.info(f"Projected plume path coordinates (first 3): {path[:3]}")
    assert len(path) > 1, "Plume trajectory path should contain multiple points."
    
    # Lagged correlation analysis
    logger.info("Running lagged causal correlation analysis (Punjab fires -> Delhi AQI)...")
    lag_df, merged_df = transport.analyze_lagged_impact(grid_df, fires_df, upwind_state="Punjab", downwind_district="Delhi")
    logger.info(f"\nLag Analysis Results:\n{lag_df.to_string(index=False)}")
    assert len(lag_df) > 0, "Lag correlation table is empty."
    logger.info("Wind transport and correlation check PASSED!")
    
    # 5. Verify Source Attribution
    logger.info("--- Testing Source Attribution Model ---")
    from models.source_attribution import SourceAttributor
    attributor = SourceAttributor()
    
    sample_attributed = attributor.attribute_dataframe(sample_df)
    assert "source_biomass_pct" in sample_attributed.columns, "Attributed df missing biomass %."
    assert "source_vehicular_pct" in sample_attributed.columns, "Attributed df missing vehicular %."
    assert "source_industrial_pct" in sample_attributed.columns, "Attributed df missing industrial %."
    logger.info(f"Attribution check PASSED! Sample breakdown: Biomass {sample_attributed['source_biomass_pct'].iloc[0]}%, Vehicular {sample_attributed['source_vehicular_pct'].iloc[0]}%, Industrial {sample_attributed['source_industrial_pct'].iloc[0]}%")
    
    # 6. Verify SHAP Explainability
    logger.info("--- Testing SHAP Explainability ---")
    from models.explainability import AQIExplainer
    explainer = AQIExplainer(model_manager)
    explainer.initialize_explainers()
    
    test_row = sample_df.head(1)
    explanation = explainer.explain_prediction(test_row, "pm25")
    logger.info(f"SHAP Explanation Output (PM2.5): Base Value: {explanation['base_value']:.2f}, Prediction: {explanation['prediction_value']:.2f}")
    logger.info(f"Top contributing features: {list(explanation['shap_values'].items())[:3]}")
    assert len(explanation["shap_values"]) > 0, "SHAP values dict is empty."
    logger.info("SHAP explainability check PASSED!")
    
    logger.info("=== All VayuDrishti Pipeline Components Verified Successfully! ===")
    return True

if __name__ == "__main__":
    verify_pipeline()
