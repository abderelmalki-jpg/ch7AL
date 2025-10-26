'use client';

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { useState } from 'react';

const stores = [
  { id: 1, name: 'Hanout Omar', position: { lat: 33.9716, lng: -6.8498 } },
  { id: 2, name: 'Epicerie Al Amal', position: { lat: 33.9730, lng: -6.8520 } },
  { id: 3, name: 'Chez Hassan', position: { lat: 33.9700, lng: -6.8480 } },
];

export function MapClient({ apiKey }: { apiKey: string }) {
  const position = { lat: 33.9716, lng: -6.8498 };
  const [openInfoWindow, setOpenInfoWindow] = useState<number | null>(null);

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={position}
        defaultZoom={15}
        mapId="souk-price-map"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        {stores.map(store => (
            <AdvancedMarker 
                key={store.id} 
                position={store.position}
                onClick={() => setOpenInfoWindow(openInfoWindow === store.id ? null : store.id)}
            >
              <Pin 
                background={'hsl(var(--primary))'} 
                borderColor={'white'} 
                glyphColor={'white'}
              />
            </AdvancedMarker>
        ))}

        {openInfoWindow && stores.find(s => s.id === openInfoWindow) && (
            <InfoWindow 
                position={stores.find(s => s.id === openInfoWindow)?.position}
                onCloseClick={() => setOpenInfoWindow(null)}
            >
                <p className="font-bold">{stores.find(s => s.id === openInfoWindow)?.name}</p>
            </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
