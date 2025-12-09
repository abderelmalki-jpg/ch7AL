
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, ShoppingBasket, List, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import type { Price, Product, UserProfile, Contribution, Store } from '@/lib/types';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { HomeClient } from '../home-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContributionCard } from './contribution-card';
import { MapClient } from '../map/map-client';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


// Define the shape of your detailed contribution
type DetailedContribution = Contribution & {
    product?: Product;
    user?: UserProfile;
    store?: Store;
};

function HomePageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('recent');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedContribution, setSelectedContribution] = useState<DetailedContribution | null>(null);

    // Queries
    const recentQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'prices'), orderBy('createdAt', 'desc'), limit(10)) : null,
      [firestore]
    );
    const popularQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'prices'), orderBy('voteScore', 'desc'), limit(10)) : null,
      [firestore]
    );

    // Data fetching
    const { data: recentPrices, isLoading: isLoadingRecent } = useCollection<Price>(recentQuery);
    const { data: popularPrices, isLoading: isLoadingPopular } = useCollection<Price>(popularQuery);
    const [detailedPrices, setDetailedPrices] = useState<Record<string, DetailedContribution[]>>({ recent: [], popular: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";


    useEffect(() => {
        if (!firestore) return;

        const fetchDetailsForPrices = async (prices: Price[], key: 'recent' | 'popular') => {
            setIsLoadingDetails(true);
            const detailed = await Promise.all(
                (prices || []).map(async (price) => {
                    const [productSnap, storeSnap, userSnap] = await Promise.all([
                        price.productId ? getDoc(doc(firestore, 'products', price.productId)) : Promise.resolve(null),
                        price.storeId ? getDoc(doc(firestore, 'stores', price.storeId)) : Promise.resolve(null),
                        price.userId ? getDoc(doc(firestore, 'users', price.userId)) : Promise.resolve(null)
                    ]);
                    
                    const product = productSnap?.exists() ? { id: productSnap.id, ...productSnap.data() } as Product : undefined;
                    const store = storeSnap?.exists() ? { id: storeSnap.id, ...storeSnap.data() } as Store : undefined;
                    const user = userSnap?.exists() ? { id: userSnap.id, ...userSnap.data() } as UserProfile : undefined;
                    
                    return {
                        ...price,
                        id: price.id,
                        productName: product?.name || price.productId,
                        storeName: store?.name || price.storeId,
                        price: price.price,
                        date: price.createdAt ? (price.createdAt as any).toDate() : new Date(),
                        imageUrl: product?.imageUrl,
                        user: user,
                        product: product,
                        store: store,
                        latitude: store?.latitude || null,
                        longitude: store?.longitude || null,
                    } as DetailedContribution;
                })
            );
            setDetailedPrices(prev => ({...prev, [key]: detailed}));
            setIsLoadingDetails(false);
        };
        
        if (activeTab === 'recent' && recentPrices) {
            fetchDetailsForPrices(recentPrices, 'recent');
        } else if (activeTab === 'popular' && popularPrices) {
            fetchDetailsForPrices(popularPrices, 'popular');
        }

    }, [firestore, recentPrices, popularPrices, activeTab]);

    const isLoading = isLoadingRecent || isLoadingPopular || isLoadingDetails;
    const currentPrices = detailedPrices[activeTab as 'recent' | 'popular'] || [];
    
    const storesForMap = currentPrices
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
            id: p.storeId,
            name: p.storeName,
            position: { lat: p.latitude!, lng: p.longitude! }
        }));


    const handleCardClick = (contribution: DetailedContribution) => {
        setSelectedContribution(contribution);
    };

    if (selectedContribution) {
        return <div className="container mx-auto px-4 py-6"><ContributionCard contribution={selectedContribution} apiKey={apiKey} onBack={() => setSelectedContribution(null)} /></div>;
    }

    const FilterControls = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Trier par</h3>
                <div className="flex flex-col gap-2">
                    <Button variant={activeTab === 'recent' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('recent')} className="justify-start">Récents</Button>
                    <Button variant={activeTab === 'popular' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('popular')} className="justify-start">Populaires</Button>
                </div>
            </div>
             <div>
                <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">Vue</h3>
                <div className="flex flex-col gap-2">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="justify-start"><List className="mr-2 h-4 w-4"/>Liste</Button>
                    <Button variant={viewMode === 'map' ? 'secondary' : 'ghost'} onClick={() => setViewMode('map')} className="justify-start"><MapIcon className="mr-2 h-4 w-4"/>Carte</Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold"><HomeClient /></h1>
                    <p className="text-muted-foreground">Qu'allez-vous faire aujourd'hui ?</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block md:w-56 lg:w-64 flex-shrink-0">
                       <Link href="/add-product" passHref>
                         <Button size="lg" className="w-full h-12 mb-6 bg-green-500 hover:bg-green-600 text-white">
                           <PlusCircle className="mr-2 h-5 w-5" />
                           Ajouter un prix
                         </Button>
                       </Link>
                       <h2 className="text-lg font-bold mb-4">Les Bons Plans</h2>
                       <FilterControls />
                    </aside>
                    
                    {/* Mobile Sheet Trigger */}
                    <div className="md:hidden flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold">Les Bons Plans</h2>
                        <Sheet>
                          <SheetTrigger asChild>
                             <Button variant="outline" size="sm">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Filtrer & Trier
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="left">
                            <SheetHeader>
                              <SheetTitle>Filtres</SheetTitle>
                            </SheetHeader>
                            <div className="py-4">
                               <FilterControls />
                            </div>
                          </SheetContent>
                        </Sheet>
                    </div>

                    {/* Main Content */}
                    <main className="flex-1">
                        {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                            </div>
                        ) : viewMode === 'list' ? (
                            currentPrices.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {currentPrices.map(item => (
                                        <div key={item.id} onClick={() => handleCardClick(item)} className="cursor-pointer">
                                            <div className="bg-card p-3 rounded-lg flex flex-col h-full group border">
                                                <div className="w-full h-24 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                                                    {item.imageUrl ? (
                                                        <Image src={item.imageUrl} alt={item.productName || 'Produit'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw"/>
                                                    ) : (
                                                        <ShoppingBasket className="w-8 h-8 text-muted-foreground m-auto"/>
                                                    )}
                                                </div>
                                                <div className="flex-grow mt-2">
                                                    <p className="font-semibold leading-tight text-sm truncate">{item.productName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{item.storeName}</p>
                                                </div>
                                                <div className="flex justify-between items-end mt-1">
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.date, { addSuffix: true, locale: fr })}</p>
                                                    <div className="font-bold text-primary text-base whitespace-nowrap">
                                                        {item.price.toFixed(2)} DH
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/50 rounded-lg">
                                    <p>Aucun bon plan à afficher pour le moment.</p>
                                </div>
                            )
                        ) : (
                            <div className="h-96 md:h-[60vh] w-full rounded-lg overflow-hidden border">
                               {storesForMap.length > 0 ? (
                                    <MapClient apiKey={apiKey} stores={storesForMap} />
                               ): (
                                    <div className="flex items-center justify-center h-full bg-muted">
                                        <p className="text-muted-foreground">Aucune localisation à afficher.</p>
                                    </div>
                               )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}


export default function HomePage() {
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
            <Skeleton className="h-10 w-2/3 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-2" />
            <div className="flex gap-8 mt-8">
                 <div className="w-56 hidden md:block space-y-4">
                     <Skeleton className="h-8 w-1/2" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                 </div>
                 <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  )
}

    