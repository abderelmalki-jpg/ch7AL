import { MapClient } from './map-client';
import { Card, CardContent } from '@/components/ui/card';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col">
       <div className="p-4 border-b">
         <h1 className="text-2xl font-headline font-bold text-center">Magasins à proximité</h1>
      </div>
      <div className="flex-1">
        {apiKey ? (
            <MapClient apiKey={apiKey} />
        ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="text-center text-muted-foreground p-4">
                    <p className="font-bold">Carte non disponible</p>
                    <p className="text-sm">Veuillez fournir une clé API Google Maps dans votre fichier `.env` pour afficher la carte.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
