
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { Store } from '@/lib/types';
import { MapClient } from './map-client';
import { Loader2 } from 'lucide-react';

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const firestore = useFirestore();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStores() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const storesRef = collection(firestore, 'stores');
        const querySnapshot = await getDocs(storesRef);
        const fetchedStores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        setStores(fetchedStores);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStores();
  }, [firestore]);
  
  const storesForMap = stores
    .filter(s => s.latitude && s.longitude)
    .map((s) => ({
      id: s.id,
      name: s.name,
      position: { lat: s.latitude!, lng: s.longitude! },
  }));

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex flex-col">
       <div className="p-4 border-b text-center">
         <h1 className="text-2xl font-headline font-bold">Magasins à proximité</h1>
      </div>
      <div className="flex-1">
        {isLoading ? (
            <div className="flex items-center justify-center h-full bg-muted/20">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : apiKey ? (
            <MapClient apiKey={apiKey} stores={storesForMap} />
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
