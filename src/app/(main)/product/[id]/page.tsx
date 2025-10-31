
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import type { Product, Price as PriceType, Store } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Loader2, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PriceWithStore extends PriceType {
    storeName: string;
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    const firestore = useFirestore();
    const [product, setProduct] = useState<Product | null>(null);
    const [prices, setPrices] = useState<PriceWithStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const productId = params.id;

    useEffect(() => {
        if (!firestore || !productId) return;

        const fetchProductAndPrices = async () => {
            setIsLoading(true);
            try {
                // Fetch product details
                const productRef = doc(firestore, 'products', productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
                }

                // Fetch prices for this product
                const pricesQuery = query(
                    collection(firestore, 'prices'),
                    where('productId', '==', productId),
                    orderBy('createdAt', 'desc')
                );
                const pricesSnap = await getDocs(pricesQuery);

                const pricesData = await Promise.all(pricesSnap.docs.map(async (priceDoc) => {
                    const price = { id: priceDoc.id, ...priceDoc.data() } as PriceType;
                    const storeSnap = await getDoc(doc(firestore, 'stores', price.storeId));
                    const storeName = storeSnap.exists() ? (storeSnap.data() as Store).name : 'Magasin inconnu';
                    return { ...price, storeName: storeName };
                }));
                
                setPrices(pricesData as PriceWithStore[]);

            } catch (error) {
                console.error("Erreur lors de la récupération des détails du produit:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductAndPrices();

    }, [firestore, productId]);
    
    const getFormattedDate = (timestamp: any) => {
        let date: Date;
        if (timestamp instanceof Timestamp) {
            date = timestamp.toDate();
        } else if (timestamp && typeof timestamp.seconds === 'number') {
            date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
        } else {
            return "Date invalide";
        }
        return format(date, "d MMMM yyyy", { locale: fr });
    };


    if (isLoading) {
        return (
            <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row gap-6 items-start">
                        <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
                        <div className="space-y-3 flex-1">
                            <Skeleton className="h-9 w-3/4" />
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/2" />
                        </div>
                    </CardHeader>
                </Card>
                 <Skeleton className="h-10 w-48" />
                 <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        );
    }
    
    if (!product) {
        return <div className="text-center py-16">Produit non trouvé.</div>;
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
             <Card>
                <CardHeader>
                   <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-64 h-64 relative bg-muted rounded-lg flex-shrink-0">
                             {product.imageUrl ? (
                                <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-contain"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                             <h1 className="font-headline text-3xl md:text-4xl text-primary">{product.name}</h1>
                             <p className="text-lg text-muted-foreground">{product.brand}</p>
                             {product.category && <Badge variant="outline">{product.category}</Badge>}
                        </div>
                   </div>
                </CardHeader>
            </Card>

            <div>
                <h2 className="text-2xl font-headline font-bold text-foreground mb-4 text-center">
                    Prix signalés
                </h2>

                {prices.length > 0 ? (
                    <div className="space-y-4">
                        {prices.map(price => (
                            <Card key={price.id} className="flex items-center justify-between p-4">
                                <div className="space-y-1">
                                    <p className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground"/> {price.storeName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        le {getFormattedDate(price.createdAt)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">{price.price.toFixed(2)} DH</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Aucun prix n'a encore été soumis pour ce produit.</p>
                        <Button variant="link" className="mt-2">Soyez le premier à contribuer !</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
