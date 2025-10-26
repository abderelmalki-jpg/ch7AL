import { MapClient } from './map-client';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-headline font-bold mb-4">Magasins à proximité</h1>
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          <h2 className="font-bold">La clé API Google Maps est manquante.</h2>
          <p>Veuillez ajouter `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` à votre fichier .env.local pour voir la carte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col">
       <div className="p-4 border-b">
         <h1 className="text-2xl font-headline font-bold text-center">Magasins à proximité</h1>
      </div>
      <div className="flex-1">
        <MapClient apiKey={apiKey} />
      </div>
    </div>
  );
}
