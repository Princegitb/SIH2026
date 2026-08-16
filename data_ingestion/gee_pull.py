import os
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class GEEIngestor:
    def __init__(self):
        self.is_authenticated = False
        self.initialize_gee()

    def initialize_gee(self):
        """
        Attempts to initialize Earth Engine using environment variables or local credentials.
        """
        try:
            import ee
            # Check for GEE service account in environment
            service_account = os.environ.get("GEE_SERVICE_ACCOUNT")
            private_key_path = os.environ.get("GEE_PRIVATE_KEY_PATH")

            if service_account and private_key_path:
                logger.info("Authenticating to GEE via Service Account...")
                ee.Initialize(
                    ee.ServiceAccountCredentials(service_account, private_key_path)
                )
                self.is_authenticated = True
                logger.info("GEE Initialization Successful!")
            else:
                logger.info("Attempting default GEE initialization...")
                ee.Initialize()
                self.is_authenticated = True
                logger.info("GEE Initialization Successful!")
        except Exception as e:
            logger.warning(
                f"Could not initialize Google Earth Engine: {e}\n"
                "Please configure GEE credentials (GEE_SERVICE_ACCOUNT & GEE_PRIVATE_KEY_PATH) in .env "
                "or run 'gcloud auth application-default login' locally. "
                "Running in offline simulator mode by default."
            )
            self.is_authenticated = False

    def pull_aod_data(self, bbox, start_date: str, end_date: str):
        """
        Pulls MODIS MCD19A2 AOD data for a bounding box and date range.
        bbox format: [min_lon, min_lat, max_lon, max_lat]
        """
        if not self.is_authenticated:
            logger.info("GEE Offline Mode: Skipping AOD data pull.")
            return None
        
        try:
            import ee
            logger.info(f"GEE: Pulling AOD data from MODIS/061/MCD19A2_GRANULES for {start_date} to {end_date}")
            region = ee.Geometry.Rectangle(bbox)
            
            # Select AOD bands (Optical_Depth_047 and Optical_Depth_055)
            collection = (
                ee.ImageCollection("MODIS/061/MCD19A2_GRANULES")
                .filterBounds(region)
                .filterDate(start_date, end_date)
                .select(["Optical_Depth_047", "Optical_Depth_055"])
            )
            
            # Example reduction - in a full pipeline, we would export this to Cloud Storage or drive
            mean_aod = collection.mean().clip(region)
            # Returns ee.Image or dictionary metadata info
            return mean_aod.getInfo()
        except Exception as e:
            logger.error(f"Failed to pull AOD from GEE: {e}")
            return None

    def pull_tropomi_gas(self, gas: str, bbox, start_date: str, end_date: str):
        """
        Pulls Sentinel-5P TROPOMI trace gas column density.
        gas options: 'HCHO', 'NO2', 'SO2', 'CO', 'O3'
        """
        if not self.is_authenticated:
            logger.info(f"GEE Offline Mode: Skipping TROPOMI {gas} data pull.")
            return None

        gas_collections = {
            "HCHO": ("COPERNICUS/S5P/OFFL/L3_HCHO", "tropospheric_HCHO_column_number_density"),
            "NO2": ("COPERNICUS/S5P/OFFL/L3_NO2", "NO2_column_number_density"),
            "SO2": ("COPERNICUS/S5P/OFFL/L3_SO2", "SO2_column_number_density"),
            "CO": ("COPERNICUS/S5P/OFFL/L3_CO", "CO_column_number_density"),
            "O3": ("COPERNICUS/S5P/OFFL/L3_O3", "O3_column_number_density")
        }

        if gas not in gas_collections:
            logger.error(f"Unsupported gas: {gas}. Select from {list(gas_collections.keys())}")
            return None

        dataset_id, band_name = gas_collections[gas]

        try:
            import ee
            logger.info(f"GEE: Pulling TROPOMI {gas} from {dataset_id} for {start_date} to {end_date}")
            region = ee.Geometry.Rectangle(bbox)
            
            collection = (
                ee.ImageCollection(dataset_id)
                .filterBounds(region)
                .filterDate(start_date, end_date)
                .select([band_name])
            )
            
            mean_gas = collection.mean().clip(region)
            return mean_gas.getInfo()
        except Exception as e:
            logger.error(f"Failed to pull TROPOMI {gas} from GEE: {e}")
            return None

if __name__ == "__main__":
    # Test client initialization
    ingestor = GEEIngestor()
    # Test bbox for Delhi NCR approx
    bbox = [76.8, 28.2, 77.4, 28.9]
    ingestor.pull_aod_data(bbox, "2025-10-01", "2025-10-05")
