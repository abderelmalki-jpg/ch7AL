'use client';

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { useState } from 'react';

type Store = {
  id: number;
  name: string;
  position: { lat: number; lng: number };
}

const defaultStores: Store[] = [
  { id: 1, name: 'Hanout Omar', position: { lat: 33.9716, lng: -6.8498 } },
  { id: 2, name: 'Epicerie Al Amal', position: { lat: 33.9730, lng: -6.8520 } },
  { id: 3, name: 'Chez Hassan', position: { lat: 33.9700, lng: -6.8480 } },
];

interface MapClientProps {
    apiKey: string;
    stores?: Store[];
}

export function MapClient({ apiKey, stores = defaultStores }: MapClientProps) {
  const position = stores.length > 0 ? stores[0].position : { lat: 33.9716, lng: -6.8498 };
  const [openInfoWindow, setOpenInfoWindow] = useState<number | null>(null);

  if (!apiKey) return <div className="flex items-center justify-center h-full bg-muted-foreground/10"><p>La clé API Google Maps est manquante.</p></div>

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={position}
        defaultZoom={14}
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
