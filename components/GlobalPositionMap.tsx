import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationData {
  name: string;
  coordinates: [number, number];
  liquidity: number;
  currencies: string[];
}

const LOCATIONS: LocationData[] = [
  { name: "New York (HQ)", coordinates: [40.7128, -74.006], liquidity: 15000000, currencies: ["USD"] },
  { name: "London", coordinates: [51.5074, -0.1276], liquidity: 8500000, currencies: ["GBP", "EUR"] },
  { name: "Singapore", coordinates: [1.3521, 103.8198], liquidity: 5200000, currencies: ["SGD", "USD"] },
  { name: "Tokyo", coordinates: [35.6895, 139.6917], liquidity: 12000000, currencies: ["JPY"] },
  { name: "Frankfurt", coordinates: [50.1109, 8.6821], liquidity: 4100000, currencies: ["EUR"] },
  { name: "Sao Paulo", coordinates: [-23.5505, -46.6333], liquidity: 900000, currencies: ["BRL"] },
];

const GlobalPositionMap: React.FC = () => {
  const [selectedMarker, setSelectedMarker] = useState<LocationData | null>(null);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white tracking-wider">Global Liquidity Map</h2>
      <div className="relative h-[600px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          className="h-full w-full rounded-xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {LOCATIONS.map((loc) => (
            <Marker
              key={loc.name}
              position={loc.coordinates}
              eventHandlers={{
                click: () => setSelectedMarker(loc),
              }}
            >
              {selectedMarker?.name === loc.name && (
                <Popup
                  position={loc.coordinates}
                  onClose={() => setSelectedMarker(null)}
                >
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900">{loc.name}</h3>
                    <p className="font-mono text-green-600">
                      ${loc.liquidity.toLocaleString()}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {loc.currencies.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 bg-gray-200 rounded font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default GlobalPositionMap;