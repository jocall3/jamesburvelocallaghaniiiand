import random
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any

# --- Configuration ---
# Base configuration for synthetic data generation
BASE_PRICES = {
    "GCP_Compute": 100.00,
    "GCP_Storage": 50.00,
    "GCP_Networking": 200.00,
    "API_Usage_Standard": 10.00,
    "API_Usage_Premium": 50.00,
}
PRICE_VOLATILITY = 0.05  # Max percentage fluctuation
CUSTOMER_COUNT = 50
API_SERVICES = [
    "bigquery.googleapis.com",
    "cloudfunctions.googleapis.com",
    "storage-component.googleapis.com",
    "logging.googleapis.com",
    "aiplatform.googleapis.com",  # Added a modern service as an example
    "cloudbilling.googleapis.com",
]
CUSTOMER_SEGMENTS = ["SMB", "Enterprise", "Startup", "Developer"]

# --- Helper Functions ---

def generate_random_float(base: float, volatility: float) -> float:
    """Generates a price with slight random fluctuation."""
    fluctuation = base * volatility * (random.uniform(-1, 1))
    return max(0.01, base + fluctuation)

def get_current_timestamp_ms() -> int:
    """Returns the current time in milliseconds since epoch."""
    return int(time.time() * 1000)

def get_recent_timestamp_ms(minutes_back: int = 60) -> int:
    """Returns a timestamp from the recent past."""
    now = datetime.now()
    past_time = now - timedelta(minutes=minutes_back)
    return int(past_time.timestamp() * 1000)

# --- Market Data Generation ---

class MarketDataGenerator:
    def __init__(self):
        self.base_metadata = self._initialize_metadata()
        self.customer_data = self._initialize_customers()

    def _initialize_metadata(self) -> Dict[str, Any]:
        """Sets up initial static/semi-static metadata."""
        metadata = {
            "timestamp_ms": get_current_timestamp_ms(),
            "api_services_list": API_SERVICES,
            "base_prices": BASE_PRICES,
        }
        return metadata

    def _initialize_customers(self) -> List[Dict[str, Any]]:
        """Creates synthetic customer profiles."""
        customers = []
        for i in range(1, CUSTOMER_COUNT + 1):
            segment = random.choice(CUSTOMER_SEGMENTS)
            customer_id = f"cust_{i:03d}"
            
            # Assign different service adoption rates based on segment
            adoption_rate = 0.3 if segment == "Startup" else (0.8 if segment == "Enterprise" else 0.5)
            
            customer_services = {}
            for service in API_SERVICES:
                if random.random() < adoption_rate:
                    base_price_key = "GCP_Compute" if "bigquery" in service else (
                        "API_Usage_Premium" if "storage" in service else "API_Usage_Standard"
                    )
                    
                    customer_services[service] = {
                        "base_cost_unit": BASE_PRICES.get(base_price_key, 1.0),
                        "adoption_level": random.uniform(0.1, 1.5) # Multiplier for usage/demand
                    }

            customers.append({
                "customer_id": customer_id,
                "segment": segment,
                "services": customer_services
            })
        return customers

    def generate_market_snapshot(self) -> Dict[str, Any]:
        """
        Generates a comprehensive synthetic market snapshot suitable for 
        feeding a causality engine for anomaly detection or forecasting.
        """
        snapshot_time = get_current_timestamp_ms()
        
        market_data = {
            "metadata": {
                "generation_time_ms": snapshot_time,
                "source": "Synthetic_Market_Generator_v1",
            },
            "price_feed": {},
            "usage_demand_feed": [],
            "customer_profiles": self.customer_data # Can be static or updated periodically
        }

        # 1. Generate Price Feed (Simulating external market factors)
        for service, base_price in BASE_PRICES.items():
            market_data["price_feed"][service] = generate_random_float(base_price, PRICE_VOLATILITY)

        # 2. Generate Usage Demand Feed (Simulating customer activity)
        for customer in self.customer_data:
            cust_id = customer["customer_id"]
            segment = customer["segment"]
            
            for service, config in customer["services"].items():
                
                # Base usage volume, scaled by adoption level and segment impact
                base_volume = random.randint(100, 1000) * config["adoption_level"]
                
                # Segment specific amplification (e.g., Enterprises have higher variance/volume)
                if segment == "Enterprise":
                    volume = base_volume * random.uniform(1.5, 3.0)
                    time_factor = random.uniform(0.9, 1.1) # Slight fluctuation around real time
                elif segment == "Startup":
                    volume = base_volume * random.uniform(0.5, 1.2)
                    time_factor = random.uniform(0.8, 1.2)
                else:
                    volume = base_volume * random.uniform(0.9, 1.1)
                    time_factor = 1.0
                
                # Simulate usage occurring over a random short time window
                usage_time = snapshot_time - random.randint(1000, 60000) 

                record = {
                    "timestamp_ms": usage_time,
                    "customer_id": cust_id,
                    "service_name": service,
                    "usage_volume": int(volume),
                    "cost_per_unit_predicted": generate_random_float(config["base_cost_unit"], PRICE_VOLATILITY / 2),
                    "segment": segment
                }
                market_data["usage_demand_feed"].append(record)
                
        # Shuffle the demand feed to mimic real-time arrival order
        random.shuffle(market_data["usage_demand_feed"])
        
        return market_data

# --- Execution Block (for testing/direct execution) ---
if __name__ == '__main__':
    print("Initializing Market Data Generator...")
    generator = MarketDataGenerator()
    
    # Generate 3 consecutive snapshots to observe change over time
    for i in range(3):
        snapshot = generator.generate_market_snapshot()
        
        print(f"\n--- Snapshot {i+1} ---")
        print(f"Time: {datetime.fromtimestamp(snapshot['metadata']['generation_time_ms'] / 1000)}")
        print(f"Total Demand Events: {len(snapshot['usage_demand_feed'])}")
        
        # Display a sample price and demand event
        sample_price_key = random.choice(list(snapshot['price_feed'].keys()))
        print(f"Sample Price ({sample_price_key}): ${snapshot['price_feed'][sample_price_key]:.2f}")
        
        if snapshot['usage_demand_feed']:
            sample_demand = snapshot['usage_demand_feed'][0]
            print(f"Sample Demand Event:")
            print(f"  Customer: {sample_demand['customer_id']} ({sample_demand['segment']})")
            print(f"  Service: {sample_demand['service_name']}")
            print(f"  Volume: {sample_demand['usage_volume']}")
            print(f"  Predicted Unit Cost: ${sample_demand['cost_per_unit_predicted']:.4f}")
        
        time.sleep(0.5) # Simulate time passing between data captures