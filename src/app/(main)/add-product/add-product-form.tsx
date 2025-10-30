
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb, MapPin, X, CheckCircle2, Camera, Zap, Sparkles, ScanLine, ArrowLeft } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';


export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();

    // Submission states
    const [isSubmittingPrice, startPriceTransition] = useTransition();

    // Form fields
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [photoDataUri, setPhotoDataUri] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    
    // UI Errors
    const [formErrors, setFormErrors] = useState<{productName?: string, price?: string, storeName?: string, userId?: string}>({});

    // Location state
    const [isLocating, setIsLocating] = useState(false);
    
    // Camera and AI state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const nameParam = searchParams.get('name');
    const brandParam = searchParams.get('brand');
    const categoryParam = searchParams.get('category');
    const photoParam = searchParams.get('photoDataUri');

    useEffect(() => {
        if (nameParam) setProductName(nameParam);
        if (brandParam) setBrand(brandParam);
        if (categoryParam) setCategory(categoryParam);
        if (photoParam) setPhotoDataUri(photoParam);
    }, [nameParam, brandParam, categoryParam, photoParam]);

     useEffect(() => {
        async function setupCamera() {
          if (isCameraOn) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              setCameraError("L'accès à la caméra n'est pas supporté par ce navigateur.");
              return;
            }
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
              setCameraError(null);
            } catch (err: any) {
              console.error('Erreur accès caméra:', err);
              if (err.name === 'NotAllowedError') {
                   setCameraError("L'autorisation d'accès à la caméra est requise.");
              } else {
                   setCameraError("Une erreur est survenue lors de l'accès à la caméra.");
              }
              setIsCameraOn(false);
            }
          } else {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
             if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
          }
        }

        setupCamera();

        return () => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
        };
    }, [isCameraOn]);


    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsIdentifying(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if(context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            
            try {
                const result = await identifyProduct({ photoDataUri: dataUri });
                setProductName(result.name);
                setBrand(result.brand);
                setCategory(result.category);
                setPhotoDataUri(dataUri);
                setIsCameraOn(false); // Turn off camera after capture
                toast({
                    title: "Produit Identifié!",
                    description: `C'est un(e) ${result.name}.`,
                    icon: <Sparkles className="text-accent" />
                })
            } catch (e) {
                console.error(e);
                toast({
                    variant: "destructive",
                    title: "Erreur d'identification",
                    description: "L'IA n'a pas pu identifier le produit. Réessayez.",
                });
            }
        }
        setIsIdentifying(false);
    };


    const handlePriceSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        const errors: {productName?: string, price?: string, storeName?: string, userId?: string} = {};
        if (!productName) errors.productName = "Le nom du produit est requis.";
        if (!price || isNaN(Number(price)) || Number(price) <= 0) errors.price = "Le prix doit être un nombre positif.";
        if (!storeName) errors.storeName = "Le nom du magasin est requis.";
        if (!user) errors.userId = "Vous devez être connecté.";

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        startPriceTransition(() => {
            (async () => {
                 const response = await fetch('/api/add-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user!.uid,
                        productName,
                        price: Number(price),
                        storeName,
                        address: address || undefined,
                        latitude: latitude || undefined,
                        longitude: longitude || undefined,
                        brand: brand || undefined,
                        category: category || undefined,
                        photoDataUri: photoDataUri || undefined
                    }),
                });

                const result = await response.json();

                if (result.status === 'success') {
                    setProductName('');
                    setPrice('');
                    setStoreName('');
                    setAddress('');
                    setLatitude(null);
                    setLongitude(null);
                    setBrand('');
                    setCategory('');
                    setPhotoDataUri('');
                    
                    toast({
                        title: 'Succès !',
                        description: result.message,
                        duration: 4000,
                    });
                    router.push('/dashboard');
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Erreur de soumission',
                        description: result.message || "Une erreur inconnue est survenue.",
                    });
                }
            })().catch((err) => {
                console.error("Erreur inattendue lors de l'ajout du prix:", err);
                toast({
                    variant: 'destructive',
                    title: 'Erreur Serveur',
                    description: "Une erreur inattendue est survenue. Veuillez réessayer."
                })
            });
        });
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Géolocalisation non supportée' });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);
                setAddress(`Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                setIsLocating(false);
                toast({ title: 'Localisation obtenue !', icon: <CheckCircle2 className="text-green-500" /> });
            },
            () => {
                setIsLocating(false);
                toast({ variant: 'destructive', title: 'Erreur de localisation' });
            }
        );
    };

    const removeImage = () => {
        setPhotoDataUri('');
    }
    
    if (isCameraOn) {
        return (
             <Card>
                <CardHeader>
                    <div className="flex gap-2">
                        <Button onClick={() => setIsCameraOn(false)} variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Retour
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
                        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                        <canvas ref={canvasRef} className="hidden" />
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                                <div className="text-center text-white p-4">
                                    <p>{cameraError}</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <Button onClick={handleCapture} disabled={isIdentifying || !!cameraError} className="w-full mt-4 bg-accent hover:bg-accent/90">
                        {isIdentifying ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Analyse en cours...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-5 w-5" />
                                Identifier le Produit
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        )
    }

  return (
    <div className="space-y-8">
        <Card className="overflow-hidden">
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                         <Camera className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="font-headline text-3xl text-primary">Ajouter un prix</CardTitle>
                <CardDescription>
                    Identifiez un produit avec votre caméra ou scannez son code-barres.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button onClick={() => setIsCameraOn(true)} size="lg" className="h-auto py-4 flex-col gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Camera className="h-6 w-6" />
                        <span>Analyse IA</span>
                    </Button>
                     <Button asChild size="lg" className="h-auto py-4 flex-col gap-2">
                        <Link href="/scanner">
                            <ScanLine className="h-6 w-6" />
                             <span>Code-barres</span>
                        </Link>
                    </Button>
                </div>
                 <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Ou remplir manuellement</span>
                    </div>
                </div>

                <form onSubmit={handlePriceSubmit} className="space-y-6">
                    {formErrors.userId && <p className="text-sm font-medium text-destructive">{formErrors.userId}</p>}

                    {photoDataUri && (
                        <div className="space-y-2">
                            <Label>Aperçu de l'image</Label>
                            <div className="relative aspect-video w-full max-w-sm mx-auto rounded-lg overflow-hidden border">
                                <Image src={photoDataUri} alt="Aperçu du produit" fill className="object-contain" />
                                 <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={removeImage}
                                >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Supprimer l'image</span>
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="productName">Nom du produit</Label>
                            <Input id="productName" name="productName" placeholder="ex: Canette de Coca-Cola" value={productName} onChange={(e) => setProductName(e.target.value)} required/>
                            {formErrors.productName && <p className="text-sm font-medium text-destructive">{formErrors.productName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix</Label>
                            <div className="relative">
                                <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="pl-4 pr-12" required/>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground text-sm">
                                    DH
                                </span>
                            </div>
                            {formErrors.price && <p className="text-sm font-medium text-destructive">{formErrors.price}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Lieu (Hanout)</Label>
                            <Input id="storeName" name="storeName" placeholder="ex: Epicerie Al Amal" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                            {formErrors.storeName && <p className="text-sm font-medium text-destructive">{formErrors.storeName}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse (Optionnel)</Label>
                            <div className="flex gap-2">
                                <Input id="address" name="address" placeholder="Adresse du magasin" value={address} onChange={(e) => setAddress(e.target.value)} />
                                <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4 text-primary" />}
                                    <span className="sr-only">Géolocaliser</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={isSubmittingPrice || !user} className="w-full text-lg h-12">
                        {isSubmittingPrice ? (
                            <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Ajout en cours...
                            </>
                        ) : (
                            "Ajouter le prix"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}

    