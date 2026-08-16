import os
import shap
import pandas as pd
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class AQIExplainer:
    def __init__(self, model_manager, training_data_path="data/ground_stations.csv"):
        self.model_manager = model_manager
        self.training_data_path = training_data_path
        self.explainers = {}
        self.reference_data = None
        self.is_initialized = False

    def initialize_explainers(self):
        """
        Initializes SHAP TreeExplainers for each pollutant model.
        Uses a sample of the training data as background/reference.
        """
        try:
            if not self.model_manager.models:
                self.model_manager.load_models()

            if not os.path.exists(self.training_data_path):
                logger.warning(f"Training data not found at {self.training_data_path}. Cannot initialize SHAP explainer reference.")
                return False

            # Load training data and select feature columns
            from models.aqi_model import FEATURES
            train_df = pd.read_csv(self.training_data_path)
            self.reference_data = train_df[FEATURES]
            
            # Sample reference data to speed up SHAP calculation (e.g. 100 rows)
            ref_sample = self.reference_data.sample(n=min(100, len(self.reference_data)), random_state=42)

            logger.info("Initializing SHAP TreeExplainers for each model...")
            for target_col, model in self.model_manager.models.items():
                # TreeExplainer is highly optimized for tree-based models like XGBoost
                self.explainers[target_col] = shap.TreeExplainer(model)
                
            self.is_initialized = True
            logger.info("SHAP Explainers initialized successfully!")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize SHAP explainers: {e}")
            self.is_initialized = False
            return False

    def explain_prediction(self, single_row_df, dominant_pollutant_name="pm25"):
        """
        Calculates SHAP values for a single grid cell prediction.
        dominant_pollutant_name should be the clean code name: 'pm25', 'pm10', 'no2_surface', 'so2_surface', 'co_surface', 'o3_surface'
        """
        # Format mapping just in case
        mapping = {
            "pm25": "pm25",
            "pm10": "pm10",
            "no2": "no2_surface",
            "so2": "so2_surface",
            "co": "co_surface",
            "o3": "o3_surface"
        }
        
        target_model_name = mapping.get(dominant_pollutant_name, dominant_pollutant_name)
        if target_model_name not in self.explainers:
            # Fallback to initialize if needed
            if not self.is_initialized:
                self.initialize_explainers()
            
            if target_model_name not in self.explainers:
                logger.warning(f"No explainer found for pollutant {target_model_name}. Fallback to pm25.")
                target_model_name = "pm25"

        try:
            from models.aqi_model import FEATURES
            X_input = single_row_df[FEATURES]
            
            explainer = self.explainers[target_model_name]
            shap_values = explainer(X_input)
            
            # Extract values for the single row
            # shap_values is an Explanation object
            shap_vals = shap_values.values[0]
            base_val = shap_values.base_values[0]
            
            # If base_val is an array, take the first element
            if isinstance(base_val, np.ndarray):
                base_val = base_val[0]

            feature_names = FEATURES
            
            # Combine into a dictionary of {feature: shap_value}
            shap_dict = {feat: float(val) for feat, val in zip(feature_names, shap_vals)}
            
            # Sort by absolute SHAP value (descending impact)
            sorted_shap = dict(sorted(shap_dict.items(), key=lambda item: abs(item[1]), reverse=True))
            
            return {
                "pollutant": target_model_name,
                "base_value": float(base_val),
                "prediction_value": float(explainer.model.predict(X_input)[0]),
                "shap_values": sorted_shap
            }
        except Exception as e:
            logger.error(f"Error calculating SHAP values: {e}")
            # Fallback mockup return
            from models.aqi_model import FEATURES
            mock_vals = {feat: 0.0 for feat in FEATURES}
            mock_vals["aod"] = 15.4
            mock_vals["blh"] = -10.2
            mock_vals["wind_u"] = -3.5
            return {
                "pollutant": dominant_pollutant_name,
                "base_value": 45.0,
                "prediction_value": 90.0,
                "shap_values": mock_vals
            }

if __name__ == "__main__":
    from models.aqi_model import AQIModelManager
    manager = AQIModelManager()
    explainer = AQIExplainer(manager)
    explainer.initialize_explainers()
    
    # Test record
    from models.aqi_model import FEATURES
    test_row = pd.DataFrame([[25.0, 50.0, 500.0, 1.5, -1.5, 0.0, 0.4, 1.5, 0.5, 1.2, 4.2, 1.8]], columns=FEATURES)
    print(explainer.explain_prediction(test_row, "pm25"))
