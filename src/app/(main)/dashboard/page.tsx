
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, ShoppingBasket, ArrowRight, Flame, MapPin, Store as StoreIcon, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDocs, doc } from 'firebase/firestore';
import type { Price, Product, UserProfile, Contribution } from '@/lib/types';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { HomeClient } from '../home-client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ContributionCard } from './contribution-card';

// Define the shape of your detailed contribution
type DetailedContribution = Contribution & {
    product?: Product;
    user?: UserProfile;
    store?: any; // Define a proper Store type if you have one
};

function HomePageContent() {
    const firestore = useFirestore();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('recent');
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

    useEffect(() => {
        if (!firestore) return;

        const fetchDetailsForPrices = async (prices: Price[], key: 'recent' | 'popular') => {
            setIsLoadingDetails(true);
            const detailed = await Promise.all(
                (prices || []).map(async (price) => {
                    const [productSnap, storeSnap, userSnap] = await Promise.all([
                        getDocs(query(collection(firestore, 'products'), where('name', '==', price.productId))), // Assuming productId is name for now
                        getDocs(query(collection(firestore, 'stores'), where('name', '==', price.storeId))),
                        getDocs(query(collection(firestore, 'users'), where('uid', '==', price.userId)))
                    ]);
                    
                    const product = !productSnap.empty ? { id: productSnap.docs[0].id, ...productSnap.docs[0].data() } as Product : undefined;
                    const store = !storeSnap.empty ? { id: storeSnap.docs[0].id, ...storeSnap.docs[0].data() } : undefined;
                    const user = !userSnap.empty ? { id: userSnap.docs[0].id, ...userSnap.docs[0].data() } as UserProfile : undefined;
                    
                    return {
                        ...price,
                        id: price.id,
                        productName: product?.name || price.productId,
                        storeName: store?.name || price.storeId,
                        price: price.price,
                        date: price.createdAt ? formatDistanceToNow(price.createdAt.toDate(), { addSuffix: true, locale: fr }) : 'N/A',
                        imageUrl: product?.imageUrl,
                        user: user,
                        product: product,
                        store: store,
                        latitude: store?.latitude || 0,
                        longitude: store?.longitude || 0,
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

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";


    const handleCardClick = (contribution: DetailedContribution) => {
        setSelectedContribution(contribution);
    };

    if (selectedContribution) {
        return <ContributionCard contribution={selectedContribution} apiKey={apiKey} onBack={() => setSelectedContribution(null)} />;
    }

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold"><HomeClient /></h1>
                <p className="text-muted-foreground">Qu'allez-vous faire aujourd'hui ?</p>
            </div>

            <Button asChild size="lg" className="w-full h-14 text-lg">
                <Link href="/add-product?action=camera">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Contribuer
                </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-full h-14 text-lg">
                <Link href="/search">
                    <Search className="mr-2 h-5 w-5" />
                    Rechercher un produit..
                </Link>
            </Button>
            
            <div className="space-y-4">
                 <h2 className="text-xl font-bold text-center">Les Bons Plans</h2>
                 <div className="flex gap-2 justify-center">
                    <Button variant={activeTab === 'recent' ? 'default' : 'outline'} onClick={() => setActiveTab('recent')}>Récents</Button>
                    <Button variant={activeTab === 'popular' ? 'default' : 'outline'} onClick={() => setActiveTab('popular')}>Populaires</Button>
                 </div>
                 {isLoading ? (
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                     </div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {currentPrices.map(item => (
                            <div key={item.id} onClick={() => handleCardClick(item)} className="cursor-pointer">
                                <div className="bg-card p-3 rounded-lg flex flex-col h-full group">
                                     <div className="w-full h-24 bg-muted rounded-md relative overflow-hidden flex-shrink-0">
                                        {item.imageUrl ? (
                                            <Image src={item.imageUrl} alt={item.productName || 'Produit'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <ShoppingBasket className="w-8 h-8 text-muted-foreground m-auto"/>
                                        )}
                                    </div>
                                    <div className="flex-grow mt-2">
                                        <p className="font-semibold leading-tight text-sm truncate">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.storeName}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                        <div className="font-bold text-primary text-base whitespace-nowrap">
                                            {item.price.toFixed(2)} MAD
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
            <Skeleton className="h-16 w-full mt-4" />
            <Skeleton className="h-16 w-full" />
             <div className="pt-6">
                <Skeleton className="h-8 w-1/3 mb-4 mx-auto" />
                <div className="grid grid-cols-2 gap-4">
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
