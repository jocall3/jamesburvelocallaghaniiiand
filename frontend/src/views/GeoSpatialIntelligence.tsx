```tsx
import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Box, Typography, Paper, Switch, FormControlLabel, CircularProgress, Alert } from '@mui/material';

// --- Map Configuration ---
const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 34.052235,
  lng: -118.243683, // Centered on Los Angeles
};

// A professional, low-saturation map style
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  ],
};


// --- Mock Data ---

// Portfolio Properties
const mockProperties = [
  { id: 1, position: { lat: 34.05, lng: -118.25 }, address: '123 Downtown Ave, Los Angeles, CA', value: 2500000, type: 'Commercial' },
  { id: 2, position: { lat: 34.10, lng: -118.30 }, address: '456 Hollywood Blvd, Los Angeles, CA', value: 1800000, type: 'Residential' },
  { id: 3, position: { lat: 33.95, lng: -118.40 }, address: '789 LAX Gateway, Los Angeles, CA', value: 3200000, type: 'Industrial' },
  { id: 4, position: { lat: 34.06, lng: -118.41 }, address: '101 Century Park, Los Angeles, CA', value: 5500000, type: 'Commercial' },
  { id: 5, position: { lat: 34.03, lng: -118.22 }, address: '222 Arts District, Los Angeles, CA', value: 1200000, type: 'Mixed-Use' },
];

// Transaction Heatmap Data: Generating random points around the center
const generateHeatmapData = (center: { lat: number, lng: number }, count: number, radius: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    const lat = center.lat + (Math.random() - 0.5) * radius * 2;
    const lng = center.lng + (Math.random() - 0.5) * radius * 2;
    data.push(new window.google.maps.LatLng(lat, lng));
  }
  return data;
};

// --- Component ---

const GeoSpatialIntelligence: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<(typeof mockProperties[0]) | null>(null);
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Use `useMemo` to prevent re-creating libraries array on every render
  const libraries = useMemo<("visualization")[]>(() => ['visualization'], []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
  
  const heatmapData = useMemo(() => {
    // Check if google maps is loaded before generating data
    if (isLoaded && window.google) {
        return generateHeatmapData(center, 500, 0.2);
    }
    return [];
  }, [isLoaded]);


  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const handlePortfolioToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowPortfolio(event.target.checked);
  };

  const handleHeatmapToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowHeatmap(event.target.checked);
  };

  if (loadError) {
    return (
        <Box sx={{ p: 4 }}>
            <Alert severity="error">
                Error loading Google Maps. Please check the API key and network connection. Message: {loadError.message}
            </Alert>
        </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', width: '100%' }}> {/* Adjust height based on app bar if any */}
      <Paper
        elevation={4}
        sx={{
          width: 320,
          p: 3,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          backgroundColor: '#f8f9fa'
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#343a40' }}>
          Geo-Spatial Intelligence
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Real Estate Portfolio Analysis
        </Typography>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: '#495057' }}>Layers</Typography>
          <FormControlLabel
            control={<Switch checked={showPortfolio} onChange={handlePortfolioToggle} color="primary" />}
            label="Portfolio Assets"
          />
          <FormControlLabel
            control={<Switch checked={showHeatmap} onChange={handleHeatmapToggle} color="primary" />}
            label="Transaction Heatmap"
          />
        </Box>
      </Paper>

      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        {!isLoaded ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Map...</Typography>
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={11}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {showPortfolio && mockProperties.map((property) => (
              <Marker
                key={property.id}
                position={property.position}
                onClick={() => setSelectedProperty(property)}
                title={property.address}
              />
            ))}

            {selectedProperty && (
              <InfoWindow
                position={selectedProperty.position}
                onCloseClick={() => setSelectedProperty(null)}
              >
                <Box sx={{ p: 1, maxWidth: 250 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{selectedProperty.address}</Typography>
                  <Typography variant="body2">Type: {selectedProperty.type}</Typography>
                  <Typography variant="body2">
                    Value: ${selectedProperty.value.toLocaleString()}
                  </Typography>
                </Box>
              </InfoWindow>
            )}

            {showHeatmap && heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 25,
                  opacity: 0.7,
                }}
              />
            )}
          </GoogleMap>
        )}
      </Box>
    </Box>
  );
};

export default GeoSpatialIntelligence;
```