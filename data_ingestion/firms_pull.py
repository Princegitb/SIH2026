import os
import requests
import logging
import io
import pandas as pd

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class FIRMSIngestor:
    def __init__(self):
        self.map_key = os.environ.get("FIRMS_MAP_KEY")
        self.base_url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

    def pull_fire_data(self, bbox, date_str: str, source: str = "VIIRS_SNPP_NRT", range_days: int = 1):
        """
        Retrieves active fire points from NASA FIRMS.
        bbox format: [min_lon, min_lat, max_lon, max_lat]
        source options: 'MODIS_C6_1_NRT', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT'
        """
        if not self.map_key:
            logger.info("NASA FIRMS Map Key not found. Skipping live fire data pull.")
            return None

        # Bounding box format for FIRMS: min_lon, min_lat, max_lon, max_lat (same as bbox)
        bbox_str = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
        url = f"{self.base_url}/{self.map_key}/{source}/{bbox_str}/{range_days}/{date_str}"

        try:
            logger.info(f"FIRMS: Querying fire data from {source} for bbox {bbox_str} on {date_str}")
            response = requests.get(url, timeout=45)
            response.raise_for_status()
            
            # FIRMS returns CSV format
            csv_data = response.text
            if "invalid key" in csv_data.lower():
                logger.error("NASA FIRMS reported: Invalid API Map Key.")
                return None
                
            df = pd.read_csv(io.StringIO(csv_data))
            logger.info(f"Successfully retrieved {len(df)} active fire records from FIRMS.")
            return df
        except Exception as e:
            logger.warning(f"Initial FIRMS request attempt timed out/failed: {e}. Retrying with extended timeout...")
            try:
                response = requests.get(url, timeout=60)
                response.raise_for_status()
                df = pd.read_csv(io.StringIO(response.text))
                logger.info(f"Successfully retrieved {len(df)} active fire records on retry.")
                return df
            except Exception as retry_err:
                logger.error(f"Failed to retrieve fire data after retry: {retry_err}")
                return None

if __name__ == "__main__":
    ingestor = FIRMSIngestor()
    # Delhi bbox approx
    bbox = [76.8, 28.2, 77.4, 28.9]
    ingestor.pull_fire_data(bbox, "2025-10-01")
