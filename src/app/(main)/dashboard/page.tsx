
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, ShoppingBasket, ArrowRight, Flame, MapPin, Store as StoreIcon, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Price, Product, UserProfile } from '@/lib/types';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { HomeClient } from '../home-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

function RecentPricesList() {
    const firestore = useFirestore();
    const router = useRouter();

    const pricesQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'prices'), orderBy('createdAt', 'desc'), limit(5)) : null,
      [firestore]
    );

    const { data: prices, isLoading } = useCollection<Price>(pricesQuery);
    
    // We need to fetch product and store details for each price
    const [detailedPrices, setDetailedPrices] = useState<(Price & { productName?: string, imageUrl?: string })[]>([]);

    useEffect(() => {
        if (!prices || !firestore) return;

        const fetchDetails = async () => {
            const pricesWithDetails = await Promise.all(
                prices.map(async (price) => {
                    let productName, imageUrl;
                    try {
                        const productRef = (await import('firebase/firestore')).doc(firestore, 'products', price.productId);
                        const productSnap = await (await import('firebase/firestore')).getDoc(productRef);
                        if (productSnap.exists()) {
                            const productData = productSnap.data() as Product;
                            productName = productData.name;
                            imageUrl = productData.imageUrl;
                        }
                    } catch(e) {
                        console.error(`Failed to fetch product ${price.productId}`, e);
                    }
                    return { ...price, productName: productName || 'Produit inconnu', imageUrl: imageUrl };
                })
            );
            setDetailedPrices(pricesWithDetails);
        };

        fetchDetails();
    }, [prices, firestore]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-lg">
                        <Skeleton className="h-16 w-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (!detailedPrices || detailedPrices.length === 0) {
        return (
            <div className="text-center py-8 px-4 bg-card rounded-lg">
                <p className="text-muted-foreground">Aucun prix n'a été ajouté récemment.</p>
                <Button variant="link" asChild className="mt-2">
                    <Link href="/add-product">Soyez le premier à contribuer !</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {detailedPrices.map(item => (
                <div key={item.id} className="bg-card p-3 rounded-lg flex gap-4 items-center">
                    <div className="w-16 h-16 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                         {item.imageUrl ? (
                             <Image src={item.imageUrl} alt={item.productName || 'Produit'} fill className="object-cover" />
                         ) : (
                             <ShoppingBasket className="w-8 h-8 text-muted-foreground m-auto"/>
                         )}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold leading-tight">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                            { (item.createdAt as any)?.seconds ? formatDistanceToNow((item.createdAt as any).toDate(), { addSuffix: true, locale: fr }) : ''}
                        </p>
                    </div>
                    <div className="font-bold text-lg text-primary whitespace-nowrap">
                        {item.price.toFixed(2)} MAD
                    </div>
                </div>
            ))}
        </div>
    );
}


function DashboardContent() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/auth');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
      return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse max-w-6xl">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
             <div className="pt-6">
                <Skeleton className="h-8 w-1/3 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold"><HomeClient /></h1>
            <p className="text-muted-foreground">Qu'allez-vous faire aujourd'hui ?</p>
        </div>

        <Button asChild size="lg" className="w-full h-14 text-lg">
            <Link href="/add-product">
                <PlusCircle className="mr-2 h-5 w-5" />
                Contribuer
            </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full h-14 text-lg">
            <Link href="/search">
                <Search className="mr-2 h-5 w-5" />
                Rechercher un produit..
            </Link>
        </Button>

        <div className="text-center">
            <h2 className="text-xl font-bold mb-3">Derniers prix ajoutés</h2>
            <RecentPricesList />
        </div>
    </div>
  );
}


export default function HomePage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  )
}

    