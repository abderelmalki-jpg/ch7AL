'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZxing } from 'react-zxing';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ScanLine, Video, VideoOff, Loader2, ArrowLeft } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ScannerPage() {
    const [isScanning, setIsScanning] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    const { ref } = useZxing({
        paused: !isScanning || isSearching,
        onResult(result) {
            const barcode = result.getText();
            setIsScanning(false);
            handleBarcodeScan(barcode);
        },
        onError(error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Erreur de caméra',
                description: "Impossible d'accéder à la caméra. Veuillez vérifier les autorisations."
            })
        }
    });

    const handleBarcodeScan = async (barcode: string) => {
        if (!firestore) return;
        setIsSearching(true);
        toast({
            title: 'Code-barres scanné !',
            description: `Recherche du produit pour : ${barcode}`,
        });

        try {
            const productsRef = collection(firestore, 'products');
            const q = query(productsRef, where('barcode', '==', barcode), limit(1));
            const querySnapshot = await getDocs(q);

            const params = new URLSearchParams();
            params.set('barcode', barcode);

            if (!querySnapshot.empty) {
                const productDoc = querySnapshot.docs[0];
                const product = { id: productDoc.id, ...productDoc.data() } as Product;
                toast({
                    title: 'Produit trouvé !',
                    description: `Redirection vers l'ajout de prix pour ${product.name}.`,
                });
                
                params.set('name', product.name);
                if(product.brand) params.set('brand', product.brand);
                if(product.category) params.set('category', product.category);
                if (product.imageUrl) {
                    params.set('photoDataUri', product.imageUrl);
                }
            } else {
                 toast({
                    variant: 'default',
                    title: 'Nouveau produit',
                    description: "Ce code-barres n'est pas dans notre base. Veuillez ajouter les détails du produit.",
                });
            }

            router.push(`/add-product?${params.toString()}`);

        } catch (error) {
            console.error('Erreur de recherche du code-barres :', error);
            toast({
                variant: 'destructive',
                title: 'Erreur de recherche',
                description: "Une erreur s'est produite lors de la recherche du produit.",
            });
            setIsSearching(false);
            setIsScanning(true);
        }
    };


    return (
        <div className="container mx-auto max-w-2xl px-4 py-8">
            <div className="mb-4">
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
            </div>
            <Card>
                 <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <ScanLine className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-2xl text-primary">Scanner un code-barres</CardTitle>
                            <CardDescription>
                                Pointez votre caméra vers un code-barres pour trouver un produit rapidement.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative">
                        <video ref={ref} className={cn('w-full h-full object-cover', { 'hidden': !isScanning })} />
                        {!isScanning && !isSearching && (
                            <div className="flex flex-col items-center justify-center h-full text-white bg-black/50">
                                <VideoOff className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-bold">Caméra en pause</h3>
                            </div>
                        )}
                        {isSearching && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
                                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                <p className="text-lg">Recherche du produit...</p>
                            </div>
                        )}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-1/3 border-2 border-dashed border-white/50 rounded-lg" />
                    </div>
                     <div className="mt-4">
                        <Button
                            onClick={() => setIsScanning(prev => !prev)}
                            variant="outline"
                            className="w-full"
                            disabled={isSearching}
                        >
                            {isScanning ? (
                                <>
                                    <VideoOff className="mr-2 h-5 w-5" /> Arrêter le scan
                                </>
                            ) : (
                                <>
                                    <Video className="mr-2 h-5 w-5" /> Reprendre le scan
                                </>
                            )}
                        </Button>
                    </div>
                    <Alert className="mt-4">
                        <ScanLine className="h-4 w-4" />
                        <AlertTitle>Comment ça marche ?</AlertTitle>
                        <AlertDescription>
                            Assurez-vous que le code-barres est bien éclairé et entièrement visible dans le cadre. Le scan est automatique.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
}
