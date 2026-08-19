import os
import requests
import logging
import pandas as pd
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class CPCBIngestor:
    def __init__(self):
        self.api_key = os.environ.get("OPENAQ_API_KEY")
        self.base_url = "https://api.openaq.org/v3"

    def pull_ground_data(self, city: str, start_date: str, end_date: str):
        """
        Retrieves ground-station pollutant concentrations (PM2.5, PM10, NO2, SO2, CO, O3)
        from OpenAQ API (as an open alternative for CPCB ground data).
        """
        if not self.api_key:
            logger.info("OpenAQ API Key not found. Skipping live ground data pull.")
            return None

        headers = {"X-API-Key": self.api_key}
        try:
            logger.info(f"OpenAQ: Querying ground measurements for {city} between {start_date} and {end_date}")
            response = requests.get(f"{self.base_url}/locations", headers=headers, params={"limit": 50}, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            if not results:
                logger.warning(f"No ground data returned for {city}")
                return None
                
            # Parse into a Pandas DataFrame
            records = []
            for r in results:
                records.append({
                    "station": r["location"],
                    "parameter": r["parameter"],
                    "value": r["value"],
                    "unit": r["unit"],
                    "timestamp": r["date"]["utc"],
                    "latitude": r["coordinates"]["latitude"],
                    "longitude": r["coordinates"]["longitude"]
                })
            df = pd.DataFrame(records)
            logger.info(f"Successfully retrieved {len(df)} ground measurement records.")
            return df
        except Exception as e:
            logger.error(f"Failed to retrieve ground data: {e}")
            return None

if __name__ == "__main__":
    ingestor = CPCBIngestor()
    # Test for Delhi
    ingestor.pull_ground_data("Delhi", "2025-10-01", "2025-10-02")
