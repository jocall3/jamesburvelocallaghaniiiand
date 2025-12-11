```typescript
import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface Asset {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface GlobalAssetMapProps {
  assets: Asset[];
  googleMapsApiKey: string;
}

const GlobalAssetMap: React.FC<GlobalAssetMapProps> = ({ assets, googleMapsApiKey }) => {
  const mapStyles = {
    height: '400px',
    width: '100%',
  };

  const defaultCenter = {
    lat: 0,
    lng: 0,
  };

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={2}
        center={defaultCenter}
      >
        {assets.map((asset) => (
          <Marker
            key={asset.id}
            position={{ lat: asset.latitude, lng: asset.longitude }}
            title={asset.name}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default GlobalAssetMap;
```