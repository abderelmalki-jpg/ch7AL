
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin, X, Camera, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addPrice } from './actions';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';

export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const storage = firestore ? getStorage(firestore.app) : null;

    const [isSubmittingPrice, startPriceTransition] = useTransition();

    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [photoDataUri, setPhotoDataUri] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    
    const [formErrors, setFormErrors] = useState<{productName?: string, price?: string, storeName?: string, userId?: string}>({});

    const [isLocating, setIsLocating] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    useEffect(() => {
        const nameParam = searchParams.get('name');
        const brandParam = searchParams.get('brand');
        const categoryParam = searchParams.get('category');
        const photoParam = searchParams.get('photoDataUri');

        if (nameParam) setProductName(nameParam);
        if (brandParam) setBrand(brandParam);
        if (categoryParam) setCategory(categoryParam);
        if (photoParam) setPhotoDataUri(photoParam);
    }, [searchParams]);

     useEffect(() => {
        let isMounted = true;

        async function setupCamera() {
          if (isCameraOn) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              setCameraError("L'accès à la caméra n'est pas supporté par ce navigateur.");
              return;
            }
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
              if(isMounted) {
                  streamRef.current = stream;
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                  }
                  setCameraError(null);
              }
            } catch (err: any) {
                if (isMounted) {
                  console.error('Erreur accès caméra:', err);
                  if (err.name === 'NotAllowedError') {
                       setCameraError("L'autorisation d'accès à la caméra est requise.");
                  } else if (err.name === 'AbortError' || err.name === 'NotReadableError') {
                       setCameraError("La caméra est utilisée par une autre application ou a rencontré un problème.");
                  }
                  else {
                       setCameraError("Une erreur est survenue lors de l'accès à la caméra.");
                  }
                  setIsCameraOn(false);
                }
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
          isMounted = false;
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
                setIsCameraOn(false);
                toast({
                    title: "Produit Identifié!",
                    description: `C'est un(e) ${result.name}.`,
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

    const uploadImage = async (dataUri: string, userId: string): Promise<string> => {
        if (!storage) throw new Error("Firebase Storage n'est pas initialisé.");
        
        const imagePath = `product-images/${userId}/${Date.now()}.jpg`;
        const imageRef = storageRef(storage, imagePath);

        const snapshot = await uploadString(imageRef, dataUri, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    }


    const handlePriceSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        
        const errors: {productName?: string, price?: string, storeName?: string, userId?: string} = {};
        if (!productName) errors.productName = "Le nom du produit est requis.";
        
        const parsedPrice = parseFloat(price.replace(',', '.'));
        if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
            errors.price = "Le prix doit être un nombre positif.";
        }

        if (!storeName) errors.storeName = "Le nom du magasin est requis.";
        if (!user || !firestore) {
            errors.userId = "Vous devez être connecté pour soumettre un prix.";
            toast({ variant: 'destructive', title: 'Utilisateur non connecté ou base de données indisponible' });
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        startPriceTransition(async () => {
            try {
                let imageUrl: string | undefined = undefined;
                if (photoDataUri && photoDataUri.startsWith('data:image')) {
                  imageUrl = await uploadImage(photoDataUri, user!.uid);
                } else if (photoDataUri) {
                  imageUrl = photoDataUri; // It's already a URL
                }

                const priceData = {
                    userId: user!.uid,
                    productName,
                    price: parsedPrice,
                    storeName,
                    address,
                    city,
                    neighborhood,
                    latitude,
                    longitude,
                    brand,
                    category,
                    imageUrl,
                };
            
                const result = await addPrice(firestore!, priceData);
                
                if (result.status === 'success') {
                    toast({
                        title: 'Succès !',
                        description: `Prix pour ${productName} ajouté avec succès ! (+10 points)`,
                        duration: 4000,
                    });
                    router.push('/dashboard');
                } else {
                    throw new Error(result.message);
                }

            } catch (error) {
                console.error("Erreur lors de l'ajout du prix:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erreur de soumission',
                    description: (error as Error).message || "Une erreur est survenue lors de l'ajout du prix.",
                });
            }
        });
    }

    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Géolocalisation non supportée par votre navigateur.' });
            return;
        }
    
        try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
    
            if (permissionStatus.state === 'denied') {
                toast({ 
                    variant: 'destructive', 
                    title: 'Permission refusée',
                    description: "Vous devez autoriser la géolocalisation dans les paramètres de votre navigateur." 
                });
                return;
            }
        } catch (e) {
            // Some browsers might not support navigator.permissions, we proceed cautiously
        }
    
        setIsLocating(true);
    
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);
                setAddress(`Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                toast({ title: 'Localisation obtenue !' });
                setIsLocating(false);
            },
            (error) => {
                let title = 'Erreur de localisation';
                let description = "Impossible d'obtenir votre position actuelle.";
    
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        title = 'Permission refusée';
                        description = "Vous avez refusé l'accès à la géolocalisation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        title = 'Position non disponible';
                        description = "Les informations de localisation ne sont pas disponibles.";
                        break;
                    case error.TIMEOUT:
                        title = 'Timeout';
                        description = "La demande de localisation a expiré.";
                        break;
                }
    
                toast({ variant: 'destructive', title, description });
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };
    
    const stopLocating = () => {
        setIsLocating(false);
        toast({ title: 'Recherche de localisation annulée.' });
    };

    const removeImage = () => {
        setPhotoDataUri('');
    }

    const CameraView = ({onBack, children, title}: {onBack: () => void, children: React.ReactNode, title: string}) => (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Button onClick={onBack} variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                     <CardTitle className="text-lg">{title}</CardTitle>
                     <div className="w-16"></div>
                </div>
            </CardHeader>
            <CardContent>
                {cameraError ? (
                     <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center p-4">
                        <div className="text-center text-white">
                            <p>{cameraError}</p>
                        </div>
                    </div>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    );
    
    if (isCameraOn) {
        return (
            <CameraView onBack={() => setIsCameraOn(false)} title={"Identifier avec l'IA"}>
                 <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button onClick={handleCapture} disabled={isIdentifying} className="w-full mt-4">
                    {isIdentifying ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyse en cours...
                        </>
                    ) : (
                        <>
                            <Camera className="mr-2 h-5 w-5" />
                            Identifier le Produit
                        </>
                    )}
                </Button>
            </CameraView>
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
                    Prenez une photo pour identifier un produit et ajouter son prix.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-6">
                    <Button onClick={() => setIsCameraOn(true)} size="lg" className="w-full h-auto py-4 flex-col gap-2">
                        <Camera className="h-6 w-6" />
                        <span>Prendre une photo</span>
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
                                <Image src={photoDataUri} alt="Aperçu du produit" fill className="object-contain" sizes="50vw" />
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
                                <Input id="price" name="price" type="text" inputMode="decimal" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="pl-4 pr-12" required/>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground text-sm">
                                    DH
                                </span>
                            </div>
                            {formErrors.price && <p className="text-sm font-medium text-destructive">{formErrors.price}</p>}
                        </div>
                    </div>
                    
                     <div className="space-y-2">
                        <Label htmlFor="storeName">Lieu (Hanout)</Label>
                        <Input id="storeName" name="storeName" placeholder="ex: Epicerie Al Amal" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                        {formErrors.storeName && <p className="text-sm font-medium text-destructive">{formErrors.storeName}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input id="city" name="city" placeholder="ex: Rabat" value={city} onChange={e => setCity(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Quartier</Label>
                            <Input id="neighborhood" name="neighborhood" placeholder="ex: Agdal" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Adresse ou point de repère</Label>
                        <div className="flex gap-2">
                            <Input id="address" name="address" placeholder="Près de la mosquée, etc." value={address} onChange={(e) => setAddress(e.target.value)} />
                             <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                                {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4 text-primary" />}
                                <span className="sr-only">Géolocaliser</span>
                            </Button>
                             {isLocating && (
                                <Button type="button" variant="ghost" size="icon" onClick={stopLocating}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Arrêter</span>
                                </Button>
                            )}
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
