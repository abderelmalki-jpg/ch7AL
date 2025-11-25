
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, PlusCircle, LogIn, ShoppingBasket, ArrowRight, Star, Tag, Flame, MapPin, Sparkles, ArrowLeft, Trash2, ShieldAlert, ListPlus, Calendar, Store as StoreIcon, ArrowUpDown, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, getDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import type { Price, Store as StoreType } from '@/lib/types';
import { useState, Suspense, useRef, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { EmblaCarouselType as CarouselApi, EmblaPluginType as CarouselPlugin } from 'embla-carousel-react';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { handleVote } from '../product/vote-actions';

const ADMIN_EMAIL = 'abderelmalki@gmail.com';

const VoteButtons = ({ priceRecord }: { priceRecord: Price }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isVoting, setIsVoting] = useState(false);

    const onVote = async (voteType: 'upvote' | 'downvote') => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', description: "Vous devez être connecté pour voter."});
            return;
        };
        setIsVoting(true);
        const result = await handleVote(firestore, {
            priceId: priceRecord.id,
            userId: user.uid,
            voteType: voteType
        });
        if (result.status === 'error') {
             toast({ variant: 'destructive', title: 'Erreur de vote', description: result.message});
        }
        setIsVoting(false);
    }
    
    const hasUpvoted = user && priceRecord.upvotes?.includes(user.uid);
    const hasDownvoted = user && priceRecord.downvotes?.includes(user.uid);

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onVote('upvote')} disabled={isVoting} className={cn('h-10 w-12 flex gap-1', hasUpvoted && 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200 hover:text-green-700')}>
                <Flame className="h-5 w-5" />
                <span className="text-sm font-bold">{priceRecord.upvotes?.length || 0}</span>
            </Button>
        </div>
    )
}

function PriceDetailView({ record, store, onClose }: { record: Price, store: StoreType | null, onClose: () => void }) {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const firestore = useFirestore();
    const { t } = { t: (key: string) => key }; // Mock translation

    const isAdmin = user?.email === ADMIN_EMAIL;

    const handleDeletePrice = async () => {
        if (!isAdmin || !firestore || !record) return;
        try {
            await deleteDoc(doc(firestore, 'prices', record.id));
            toast({ title: "Prix supprimé" });
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur de suppression" });
        }
    }
    
    const handleAddToList = async () => {
      if (!firestore || !user || !record) return;
      try {
          await addDoc(collection(firestore, 'users', user.uid, 'shoppingList'), {
              productName: record.productName,
          });
          toast({ title: 'Ajouté à la liste !' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Erreur' });
      }
    };


    return (
        <div className="container mx-auto px-4 max-w-2xl py-6 space-y-4">
            <Button onClick={onClose} variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste
            </Button>
            
            <Card className="overflow-hidden">
                <div className="aspect-square w-full relative">
                    {record.imageUrl ? (
                        <Image src={record.imageUrl} alt={record.productName || ''} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                            <ShoppingBasket className="w-16 h-16"/>
                        </div>
                    )}
                </div>
                 <CardContent className="p-4 space-y-4">
                    <div className="bg-muted p-4 rounded-xl">
                        <h1 className="text-2xl font-bold font-headline">{record.productName}</h1>
                    </div>
                     <div className="bg-muted p-4 rounded-xl flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-secondary">{record.price?.toFixed(2)} MAD</span>
                    </div>

                     <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm p-3 bg-muted rounded-lg">
                            <StoreIcon className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">{record.storeName}</span>
                        </div>
                        {record.createdAt && <div className="flex items-center gap-3 text-sm p-3 bg-muted rounded-lg text-muted-foreground"><Calendar className="w-5 h-5" /><span>Publié le {(record.createdAt as any).toDate().toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'})}</span></div>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><h2 className="text-lg font-semibold">Ce prix est-il correct ?</h2></CardHeader>
                <CardContent>
                    <div className="bg-muted p-3 rounded-xl flex justify-center">
                        <VoteButtons priceRecord={record} />
                    </div>
                </CardContent>
            </Card>
            
            {isAdmin && (
                <Card className="border-destructive">
                    <CardHeader><h2 className="text-lg font-semibold text-destructive flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Zone Administrateur</h2></CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" />Supprimer cette contribution</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeletePrice} className="bg-destructive hover:bg-destructive/90">Oui, supprimer</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

type SortKey = 'productName' | 'price';
type SortDirection = 'asc' | 'desc';

function ProductList({ records, isLoading, onImageClick }: { records: Price[] | null, isLoading: boolean, onImageClick: (record: Price) => void }) {
  const { t } = { t: (key: string) => key }; // Mock translation
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    if (!records || !sortKey) {
      return records;
    }

    return [...records].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [records, sortKey, sortDirection]);

  
  if (isLoading) {
    return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-card rounded-lg">
                    <Skeleton className="h-20 w-20 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                </div>
            ))}
        </div>
    );
  }

  if (!sortedRecords || sortedRecords.length === 0) {
    return (
      <div className="col-span-full text-center text-sm text-muted-foreground py-8">
        Aucun produit à afficher ici pour le moment.
      </div>
    );
  }

  const SortableHeader = ({ sortKey: key, title }: { sortKey: SortKey, title: string }) => (
    <TableHead onClick={() => handleSort(key)} className="cursor-pointer hover:bg-muted">
        <div className="flex items-center gap-2">
            {t(title)}
            <ArrowUpDown className="h-4 w-4" />
        </div>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Image</TableHead>
          <SortableHeader sortKey="productName" title="product" />
          <TableHead onClick={() => handleSort('price')} className="cursor-pointer hover:bg-muted text-right">
             <div className="flex items-center justify-end gap-2">
                {t('price')}
                <ArrowUpDown className="h-4 w-4" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRecords.map((record) => (
          <TableRow key={record.id} onClick={() => onImageClick(record)} className="cursor-pointer">
            <TableCell>
              <div className="w-20 h-20 rounded-md bg-muted flex-shrink-0">
                {record.imageUrl ? (
                  <Image src={record.imageUrl} alt={record.productName || ''} width={80} height={80} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBasket className="w-8 h-8"/>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <p className="font-bold truncate">{record.productName}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><StoreIcon className="h-3 w-3"/>{record.storeName}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Calendar className="h-3 w-3"/>{record.createdAt ? (record.createdAt as any).toDate().toLocaleDateString('fr-FR') : ''}</p>
              <div className="md:hidden mt-2">
                 <VoteButtons priceRecord={record} />
              </div>
            </TableCell>
            <TableCell className="text-right">
                <p className="font-bold text-secondary text-lg">{record.price?.toFixed(2)} MAD</p>
                <div className="hidden md:block justify-end">
                    <VoteButtons priceRecord={record} />
                </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DashboardContent() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const userProfile = null; // Mock
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = { t: (key: string) => key }; // Mock translation
  
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [greeting, setGreeting] = useState('');
  
  const localAds = [
    {
        imageUrl: "https://res.cloudinary.com/dhjwimevi/image/upload/q_auto,f_auto,w_800/v1762353376/images_1_dm0yuv.jpg",
        link: "https://www.google.com/maps/dir/TACOS+%26+SMASH,+Rue+El+Amal%D8%8C+Meknes%E2%80%AD/4+Rue+El+Amal,+Meknes+50000/@33.8853808,-5.6520659,17462m/data=!3m2!1e3!4b1!4m13!4m12!1m5!1m1!1s0xda05b00270c49a5:0xf300af1bc01c190e!2m2!1d-5.569663!2d33.8852657!1m5!1m1!1s0xda05b00270c49a5:0xf300af1bc01c190e!2m2!1d-5.569663!2d33.8852657?entry=ttu&g_ep=EgoyMDI1MTEwMi4wIKXMDSoASAFQAw%3D%3D"
    },
    {
        imageUrl: "https://res.cloudinary.com/dhjwimevi/image/upload/q_auto,f_auto,w_800/v1762353376/images_3_bpeuja.jpg",
        link: "https://maps.app.goo.gl/KpADZcbgcTy6vNM57"
    },
    {
        imageUrl: "https://res.cloudinary.com/dhjwimevi/image/upload/q_auto,f_auto,w_800/v1762353376/images_q940ko.jpg",
        link: "https://maps.app.goo.gl/25eqF44TvCWXfrSQA"
    },
    {
        imageUrl: "https://res.cloudinary.com/dhjwimevi/image/upload/q_auto,f_auto,w_800/v1762354428/t%C3%A9l%C3%A9chargement_1_j4oa30.jpg",
        link: "https://maps.app.goo.gl/X7wniyaVqtf84kEYA"
    },
];

  const autoplay = useRef<CarouselPlugin>();
  
  useEffect(() => {
    import('embla-carousel-autoplay').then((plugin) => {
        autoplay.current = plugin.default({
            delay: 3000,
            stopOnInteraction: false,
        });
    });
  }, []);

  useEffect(() => {
    const hours = new Date().getHours();
    let greetingKey = 'Bonsoir';
    if (hours < 12) {
      greetingKey = 'Bonjour';
    } else if (hours < 18) {
      greetingKey = 'Bon après-midi';
    }
    setGreeting(greetingKey);
  }, []);

  const priceIdFromUrl = searchParams.get('priceId');
  
    useEffect(() => {
      // If the user is not logged in, redirect to the landing page.
      if (!isUserLoading && !user) {
        router.replace('/landing');
      }
    }, [isUserLoading, user, router]);


  useEffect(() => {
      const fetchPriceFromUrl = async () => {
          if (priceIdFromUrl && firestore && user) { // Only fetch if user is logged in
              const priceDocRef = doc(firestore, 'prices', priceIdFromUrl);
              const priceSnap = await getDoc(priceDocRef);
              if (priceSnap.exists()) {
                  handleImageClick(priceSnap.data() as Price);
              } else {
                  router.replace('/dashboard'); // Price not found, clean URL
              }
          }
      };
      fetchPriceFromUrl();
  }, [priceIdFromUrl, firestore, router, user]);


  const priceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null; // Prevent query if not logged in
    return query(collection(firestore, 'prices'), orderBy('createdAt', 'desc'), limit(12));
  }, [firestore, user]);

  const popularRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null; // Prevent query if not logged in
    return query(collection(firestore, 'prices'), orderBy('upvotes', 'desc'), limit(12));
  }, [firestore, user]);
  

  const { data: recentPriceRecords, isLoading: areDealsLoading } = useCollection<Price>(priceRecordsQuery);
  const { data: popularPriceRecords, isLoading: arePopularDealsLoading } = useCollection<Price>(popularRecordsQuery);
  
  const handleImageClick = async (record: Price) => {
    setSelectedPrice(record);
    if(firestore && record.storeId) {
        const storeSnap = await getDoc(doc(firestore, 'stores', record.storeId));
        if(storeSnap.exists()) {
            setSelectedStore({ id: storeSnap.id, ...storeSnap.data() } as StoreType);
        }
    }
  };
  
  const handleCloseDetail = () => {
    setSelectedPrice(null);
    setSelectedStore(null);
    router.replace('/dashboard', { scroll: false }); // Clean URL when closing
  }

  const isLoading = isUserLoading || (user && (areDealsLoading || arePopularDealsLoading));

  // For logged out users, show the loading skeleton, the useEffect will redirect them.
  if (isUserLoading || !user) {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse max-w-6xl">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    )
  }

  // If loading and not showing the detail view, show skeleton
  if (isLoading && !selectedPrice) {
    return (
        <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse max-w-6xl">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    )
  }

  // Logged-in user view
  return (
    <div className="bg-background min-h-screen py-6">
      <div className="container mx-auto px-4 space-y-8 max-w-4xl">
          
          {selectedPrice ? (
             <PriceDetailView 
                record={selectedPrice}
                store={selectedStore}
                onClose={handleCloseDetail}
            />
          ) : (
            <>
                <Card className="bg-card-foreground/5 dark:bg-card-foreground/10 border-none overflow-hidden">
                    <CardContent className="p-4 text-center">
                        <CardTitle className="font-headline text-2xl">{greeting}, {(userProfile as any)?.username || user?.email} !</CardTitle>
                        <CardDescription className="mt-1">{t('whatDoYouWantToDo')}</CardDescription>
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild size="lg" className="h-16 text-base" variant="default">
                        <Link href="/add-product">
                            <PlusCircle className="mr-3 h-6 w-6"/>
                            {t('addNewPrice')}
                        </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg" className="h-16 text-base">
                        <Link href="/shopping-list">
                            <ShoppingBasket className="mr-3 h-6 w-6"/>
                            {t('myList')}
                        </Link>
                    </Button>
                </div>

                <Carousel
                    opts={{
                    align: "start",
                    loop: true,
                    }}
                    plugins={autoplay.current ? [autoplay.current] : []}
                    className="w-full"
                >
                    <CarouselContent>
                    {localAds.map((ad, index) => (
                        <CarouselItem key={index} className="basis-full sm:basis-1/2">
                            <a href={ad.link} target="_blank" rel="noopener noreferrer">
                            <Card className="overflow-hidden shadow-none border-none group">
                                <CardContent className="flex aspect-video items-center justify-center p-0">
                                <Image
                                    src={ad.imageUrl}
                                    alt={`Publicité locale ${index + 1}`}
                                    width={400}
                                    height={225}
                                    className="object-cover w-full h-full rounded-lg transition-transform duration-300 group-hover:scale-105"
                                />
                                </CardContent>
                            </Card>
                            </a>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden sm:flex" />
                    <CarouselNext className="hidden sm:flex" />
                </Carousel>


                <div className="space-y-8">
                    <Tabs defaultValue="recent" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="recent">{t('latestPricesAdded')}</TabsTrigger>
                            <TabsTrigger value="popular">{t('mostPopular')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="recent" className="mt-6">
                        <Card>
                            <CardContent className="p-0">
                                <ProductList 
                                    records={recentPriceRecords}
                                    isLoading={isLoading}
                                    onImageClick={handleImageClick}
                                />
                            </CardContent>
                        </Card>
                        </TabsContent>
                        <TabsContent value="popular" className="mt-6">
                            <Card>
                            <CardContent className="p-0">
                                <ProductList 
                                    records={popularPriceRecords}
                                    isLoading={isLoading}
                                    onImageClick={handleImageClick}
                                />
                            </CardContent>
                        </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>{t('pricesMap')}</CardTitle>
                        <CardDescription>{t('exploreLatestContributions')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p className="text-center text-muted-foreground">Map component here</p>
                    </CardContent>
                </Card>
            </>
          )}
      </div>
    </div>
  );
}


export default function HomePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 space-y-6 animate-pulse max-w-6xl">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>}>
      <DashboardContent />
    </Suspense>
  )
}
