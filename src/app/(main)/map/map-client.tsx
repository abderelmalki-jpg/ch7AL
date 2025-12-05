
'use client';

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { useState } from 'react';

type StoreForMap = {
  id: string; 
  name: string;
  position: { lat: number; lng: number };
}

interface MapClientProps {
    apiKey: string;
    stores?: StoreForMap[];
}

export function MapClient({ apiKey, stores }: MapClientProps) {
  // Gracefully handle missing or placeholder API keys
  if (!apiKey || apiKey.startsWith("your-") || apiKey.startsWith("AIza")) {
    return (
        <div className="flex items-center justify-center h-full bg-muted/20">
            <div className="text-center text-muted-foreground p-4">
                <p className="font-bold">Carte non disponible</p>
                <p className="text-sm">
                  Veuillez fournir une clé API Google Maps valide dans votre fichier `.env`.
                   Si la clé est déjà présente, vérifiez qu'elle est correctement configurée dans votre console Google Cloud pour autoriser ce domaine.
                </p>
            </div>
        </div>
    );
  }

  const [openInfoWindow, setOpenInfoWindow] = useState<string | null>(null);

  const defaultCenter = stores && stores.length > 0 
    ? stores[0].position 
    : { lat: 33.9716, lng: -6.8498 };

  const validStores = stores && stores.length > 0 ? stores : [];


  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={12}
        mapId="ch3rel-map"
        gestureHandling={'cooperative'}
        disableDefaultUI={false}
        zoomControl={true}
      >
        {validStores.map(store => (
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

        {openInfoWindow && validStores.find(s => s.id === openInfoWindow) && (
            <InfoWindow 
                position={validStores.find(s => s.id === openInfoWindow)!.position}
                onCloseClick={() => setOpenInfoWindow(null)}
            >
                <p className="font-bold">{validStores.find(s => s.id === openInfoWindow)!.name}</p>
            </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
}
