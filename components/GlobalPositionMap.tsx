
import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import Card from './Card';
import { Tooltip } from 'recharts'; // Reuse recharts tooltip style if needed or custom

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface LocationData {
    name: string;
    coordinates: [number, number];
    liquidity: number; // USD equivalent
    currencies: string[];
}

const LOCATIONS: LocationData[] = [
    { name: "New York (HQ)", coordinates: [-74.006, 40.7128], liquidity: 15000000, currencies: ["USD"] },
    { name: "London", coordinates: [-0.1276, 51.5074], liquidity: 8500000, currencies: ["GBP", "EUR"] },
    { name: "Singapore", coordinates: [103.8198, 1.3521], liquidity: 5200000, currencies: ["SGD", "USD"] },
    { name: "Tokyo", coordinates: [139.6917, 35.6895], liquidity: 12000000, currencies: ["JPY"] },
    { name: "Frankfurt", coordinates: [8.6821, 50.1109], liquidity: 4100000, currencies: ["EUR"] },
    { name: "Sao Paulo", coordinates: [-46.6333, -23.5505], liquidity: 900000, currencies: ["BRL"] },
];

const GlobalPositionMap: React.FC = () => {
    const [tooltipContent, setTooltipContent] = useState("");
    const [selectedMarker, setSelectedMarker] = useState<LocationData | null>(null);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">Global Liquidity Map</h2>
            
            <Card className="p-0 bg-gray-900 border-gray-700 overflow-hidden relative h-[600px]">
                <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur p-3 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 uppercase font-bold">Total Global Liquidity</p>
                    <p className="text-2xl font-extrabold text-white">$45.7M</p>
                </div>

                {selectedMarker && (
                    <div className="absolute bottom-4 left-4 z-10 bg-gray-800/90 backdrop-blur p-4 rounded-xl border border-cyan-500/50 w-64 animate-fadeIn">
                        <h3 className="font-bold text-white text-lg mb-1">{selectedMarker.name}</h3>
                        <p className="text-2xl font-mono text-cyan-400 mb-3">${selectedMarker.liquidity.toLocaleString()}</p>
                        <div className="space-y-1">
                            <p className="text-xs text-gray-400 font-bold uppercase">Held Currencies</p>
                            <div className="flex gap-2">
                                {selectedMarker.currencies.map(c => (
                                    <span key={c} className="px-2 py-1 bg-gray-700 rounded text-xs text-white font-mono">{c}</span>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
                            <button className="text-xs text-cyan-400 hover:text-white transition">View Accounts</button>
                            <button className="text-xs text-cyan-400 hover:text-white transition">Initiate Transfer</button>
                        </div>
                    </div>
                )}

                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140 }}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                        geographies.map((geo) => (
                            <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill="#1f2937"
                            stroke="#374151"
                            strokeWidth={0.5}
                            style={{
                                default: { outline: "none" },
                                hover: { fill: "#374151", outline: "none" },
                                pressed: { fill: "#4b5563", outline: "none" },
                            }}
                            />
                        ))
                        }
                    </Geographies>
                    {LOCATIONS.map((loc) => {
                        // Scale marker size based on liquidity (logarithmic scale for visualization)
                        const size = Math.log(loc.liquidity) * 0.8;
                        const isSelected = selectedMarker?.name === loc.name;

                        return (
                            <Marker key={loc.name} coordinates={loc.coordinates} onClick={() => setSelectedMarker(loc)}>
                                <circle r={size} fill={isSelected ? "#06b6d4" : "rgba(6, 182, 212, 0.5)"} stroke="#fff" strokeWidth={1} className="cursor-pointer hover:fill-cyan-400 transition-colors" />
                                <circle r={size + 5} fill="transparent" stroke={isSelected ? "#06b6d4" : "transparent"} strokeWidth={1} className={isSelected ? "animate-ping" : ""} />
                            </Marker>
                        );
                    })}
                </ComposableMap>
            </Card>
        </div>
    );
};

export default GlobalPositionMap;
