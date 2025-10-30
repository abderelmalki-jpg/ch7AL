

'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useFirestore } from '@/firebase';
import { collection, getDocs, limit, orderBy, query, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Contribution, Product, Store, UserProfile, Price } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Search, PlusCircle, Loader2 } from "lucide-react";
import { MapClient } from "../map/map-client";
import { ContributionCard } from "./contribution-card";
import { HomeClient } from '../home-client';


export default function DashboardPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const firestore = useFirestore();
  const [recentContributions, setRecentContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentContributions() {
      if (!firestore) return;
      
      setIsLoading(true);
      try {
        const pricesRef = collection(firestore, 'prices');
        const q = query(pricesRef, orderBy('createdAt', 'desc'), limit(6));
        const priceSnap = await getDocs(q);

        const contributionsPromises = priceSnap.docs.map(async (priceDoc) => {
          const priceData = priceDoc.data() as Price;

          const [productSnap, storeSnap, userSnap] = await Promise.all([
            getDoc(doc(firestore, 'products', priceData.productId)),
            getDoc(doc(firestore, 'stores', priceData.storeId)),
            getDoc(doc(firestore, 'users', priceData.userId)),
          ]);
          
          const product = productSnap.exists() ? { id: productSnap.id, ...productSnap.data() } as Product : null;
          const store = storeSnap.exists() ? { id: storeSnap.id, ...storeSnap.data() } as Store : null;
          const user = userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } as UserProfile : null;

          let contributionDate: Date;
          if (priceData.createdAt instanceof Timestamp) {
            contributionDate = priceData.createdAt.toDate();
          } else if (priceData.createdAt && typeof priceData.createdAt.seconds === 'number') {
            contributionDate = new Timestamp(priceData.createdAt.seconds, priceData.createdAt.nanoseconds).toDate();
          } else if (typeof priceData.createdAt === 'string') {
            contributionDate = new Date(priceData.createdAt);
          } else {
            contributionDate = new Date(); // Fallback
          }

          return {
            id: priceDoc.id,
            productName: product?.name || 'Produit inconnu',
            storeName: store?.name || 'Magasin inconnu',
            price: priceData.price,
            date: contributionDate.toISOString(),
            latitude: store?.latitude || 0,
            longitude: store?.longitude || 0,
            imageUrl: product?.imageUrl || undefined,
            userId: priceData.userId,
            product,
            store,
            user,
            upvotes: priceData.upvotes || [],
            downvotes: priceData.downvotes || [],
            voteScore: priceData.voteScore || 0,
          };
        });

        const contributions = await Promise.all(contributionsPromises);
        setRecentContributions(contributions);

      } catch (error) {
        console.error("Erreur de chargement des contributions:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecentContributions();
  }, [firestore]);
  
  const storesForMap = recentContributions
    .filter(c => c.latitude && c.longitude)
    .map((c) => ({
      id: c.id,
      name: c.storeName,
      position: { lat: c.latitude, lng: c.longitude },
  }));


  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-8">
      
      {/* Header and Quick Actions */}
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold mb-2">
          <HomeClient />
        </h1>
        <p className="text-muted-foreground mb-6">Que voulez-vous faire aujourd'hui ?</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
           <Button asChild size="lg" className="h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/add-product">
                <PlusCircle className="mr-2 h-5 w-5" />
                Ajouter un prix
            </Link>
          </Button>
          <Button asChild size="lg" className="h-14 text-lg">
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" />
              Rechercher un prix
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Contributions */}
      <div>
        <h2 className="text-2xl font-headline font-bold text-foreground mb-4 text-center">
          Derniers ajouts
        </h2>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : recentContributions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentContributions.map((contribution) => (
              <ContributionCard key={contribution.id} contribution={contribution} apiKey={apiKey} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Aucune contribution pour le moment.</p>
              <Button variant="link" asChild>
                <Link href="/add-product">Soyez le premier à ajouter un prix !</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Map of recent stores */}
      <div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4 text-center">
            Derniers magasins répertoriés
          </h2>
          <Card>
              <CardContent className="p-0">
                  <div className="h-[400px] w-full rounded-lg overflow-hidden">
                    {apiKey ? (
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
              </CardContent>
          </Card>
      </div>

    </div>
  );
}
