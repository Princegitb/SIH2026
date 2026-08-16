import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class ERA5Ingestor:
    def __init__(self):
        self.has_cdsapi = False
        try:
            import cdsapi
            self.client = cdsapi.Client()
            self.has_cdsapi = True
        except ImportError:
            logger.warning(
                "The 'cdsapi' package is not installed. To pull weather data, install it via 'pip install cdsapi'. "
                "You must also set up your CDS API key in ~/.cdsapirc. Running in offline simulator mode by default."
            )
        except Exception as e:
            logger.warning(f"Could not initialize Copernicus CDS client: {e}. Running in offline simulator mode.")

    def pull_meteorological_data(self, bbox, year: str, months: list, output_path: str):
        """
        Submits a request to the Copernicus CDS to download ERA5 reanalysis weather data.
        Variables:
            - 10m_u_component_of_wind (u10)
            - 10m_v_component_of_wind (v10)
            - boundary_layer_height (blh)
            - 2m_temperature (t2m)
            - 2m_dewpoint_temperature (for relative humidity calculation)
            - total_precipitation (tp)
        """
        if not self.has_cdsapi:
            logger.info("Copernicus CDS Offline Mode: Skipping weather data pull.")
            return None

        # Format coordinates for CDS API [North, West, South, East]
        # Bounding box is [min_lon, min_lat, max_lon, max_lat] -> [max_lat, min_lon, min_lat, max_lon]
        cds_area = [bbox[3], bbox[0], bbox[1], bbox[2]]

        try:
            logger.info(f"CDS: Requesting ERA5 data for year {year}, months {months}...")
            self.client.retrieve(
                "reanalysis-era5-single-levels",
                {
                    "product_type": "reanalysis",
                    "format": "netcdf",
                    "variable": [
                        "10m_u_component_of_wind",
                        "10m_v_component_of_wind",
                        "boundary_layer_height",
                        "2m_temperature",
                        "2m_dewpoint_temperature",
                        "total_precipitation"
                    ],
                    "year": year,
                    "month": [str(m).zfill(2) for m in months],
                    "day": [str(d).zfill(2) for d in range(1, 32)],
                    "time": ["00:00", "06:00", "12:00", "18:00"],
                    "area": cds_area,
                },
                output_path
            )
            logger.info(f"Successfully downloaded weather NetCDF file to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Failed to retrieve ERA5 data: {e}")
            return None

if __name__ == "__main__":
    ingestor = ERA5Ingestor()
    # Test bbox for Delhi approx
    bbox = [76.8, 28.2, 77.4, 28.9]
    ingestor.pull_meteorological_data(bbox, "2025", [10, 11], "data/weather_test.nc")
