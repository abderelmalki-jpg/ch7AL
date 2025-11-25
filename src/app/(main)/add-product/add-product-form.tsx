
'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin, X, Camera, Zap, ArrowLeft, Barcode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { addPrice, findProductByBarcode } from './actions';
import { useZxing } from 'react-zxing';

export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();

    const [isSubmittingPrice, startPriceTransition] = useTransition();

    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [storeName, setStoreName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [barcode, setBarcode] = useState('');
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
    const [isScanning, setIsScanning] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const { ref: zxingRef } = useZxing({
        onResult: (result) => {
            if (result) {
                handleBarcodeScan(result.getText());
            }
        },
        paused: !isScanning,
    });

    useEffect(() => {
        const nameParam = searchParams.get('name');
        const brandParam = searchParams.get('brand');
        const categoryParam = searchParams.get('category');
        const photoParam = searchParams.get('photoDataUri');
        const actionParam = searchParams.get('action');

        if (nameParam) setProductName(nameParam);
        if (brandParam) setBrand(brandParam);
        if (categoryParam) setCategory(categoryParam);
        if (photoParam) setPhotoDataUri(photoParam);

        if (actionParam === 'camera') {
            setIsCameraOn(true);
        }
    }, [searchParams]);

     useEffect(() => {
        let isMounted = true;

        const stopCamera = () => {
             if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
             if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
             if(zxingRef.current){
                zxingRef.current.srcObject = null;
            }
        }

        async function setupCamera() {
          const videoEl = isScanning ? zxingRef.current : videoRef.current;
          if (isCameraOn || isScanning) {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
              setCameraError("L'accès à la caméra n'est pas supporté par ce navigateur.");
              return;
            }
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
              if(isMounted) {
                  streamRef.current = stream;
                  if (videoEl) {
                    videoEl.srcObject = stream;
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
                  setIsScanning(false);
                }
            }
          } else {
            stopCamera();
          }
        }

        setupCamera();

        return () => {
          isMounted = false;
          stopCamera();
        };
    }, [isCameraOn, isScanning, zxingRef]);


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
            } catch (e: any) {
                console.error(e);
                let description = "L'IA n'a pas pu identifier le produit. Veuillez réessayer.";
                if (e.message && e.message.includes('503')) {
                    description = "Le service d'identification est momentanément surchargé. Veuillez réessayer dans quelques instants.";
                }
                toast({
                    variant: "destructive",
                    title: "Erreur d'identification",
                    description: description,
                });
            } finally {
                setIsIdentifying(false);
            }
        } else {
            setIsIdentifying(false);
        }
    };

    function handleBarcodeScan(scannedCode: string | null){
        if (!scannedCode) return;
        
        setIsScanning(false);
        setBarcode(scannedCode);

        toast({
            title: "Code-barres scanné !",
            description: `Recherche du produit...`
        });

        startPriceTransition(async () => {
            const { product, error } = await findProductByBarcode(scannedCode);

            if (error) {
                toast({ variant: 'destructive', title: "Erreur", description: error });
            } else if (product) {
                setProductName(product.name || '');
                setBrand(product.brand || '');
                setCategory(product.category || '');
                if(product.imageUrl) setPhotoDataUri(product.imageUrl);
                toast({
                    title: "Produit trouvé !",
                    description: `${product.name} a été pré-rempli.`
                });
            } else {
                toast({
                    title: "Produit inconnu",
                    description: "Ce code-barres n'est pas dans notre base. Merci de remplir les informations."
                });
            }
        });
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
        if (!user) {
            errors.userId = "Vous devez être connecté pour soumettre un prix.";
            toast({ variant: 'destructive', title: 'Utilisateur non connecté' });
        }

        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        startPriceTransition(async () => {
            const priceData = {
                userId: user!.uid,
                userEmail: user!.email!,
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
                barcode,
                photoDataUri,
            };

            try {
                const result = await addPrice(priceData);
                
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
         <div className="bg-primary text-primary-foreground min-h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-6">
                <Button onClick={onBack} variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20">
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-bold">{title}</h1>
                <div className="w-10"></div>
            </div>
             <div className="flex-grow flex flex-col justify-center items-center">
                {cameraError ? (
                    <div className="w-full aspect-square bg-black/30 rounded-lg flex items-center justify-center p-4">
                        <div className="text-center">
                            <p>{cameraError}</p>
                        </div>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
    
    if (isCameraOn) {
        return (
            <CameraView onBack={() => setIsCameraOn(false)} title="Identifier avec l'IA">
                 <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative mb-4">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button onClick={handleCapture} disabled={isIdentifying} className="w-full h-14 text-lg bg-white/90 text-primary hover:bg-white">
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
            </CameraView>
        )
    }

    if (isScanning) {
        return (
             <CameraView onBack={() => setIsScanning(false)} title="Scanner un Code-barres">
                 <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
                    <video ref={zxingRef} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 border-4 border-white/50 rounded-lg" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-red-500 scan-line" />
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">Visez le code-barres</p>
                </div>
            </CameraView>
        )
    }

  return (
    <div className="space-y-4">
        <div className="bg-primary text-primary-foreground p-4 text-center">
            <h1 className="text-2xl font-bold">Ajouter un nouveau prix</h1>
            <p>Commencez par utiliser votre caméra ou remplissez le formulaire.</p>
        </div>
        
        <div className="p-4 grid grid-cols-2 gap-4">
            <Button onClick={() => setIsScanning(true)} size="lg" className="h-24 w-full flex-col items-center justify-center gap-2 text-lg bg-secondary hover:bg-secondary/90">
                <Barcode className="h-8 w-8" />
                <span>Scanner Code</span>
            </Button>
            <Button onClick={() => setIsCameraOn(true)} size="lg" className="h-24 w-full flex-col items-center justify-center gap-2 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                <Zap className="h-8 w-8" />
                <span>Analyser (IA)</span>
            </Button>
        </div>

        <div className="relative p-4">
            <div className="absolute inset-0 flex items-center px-4">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou remplir manuellement</span>
            </div>
        </div>

        <form onSubmit={handlePriceSubmit} className="space-y-6 p-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="brand">Marque (optionnel)</Label>
                    <Input id="brand" name="brand" placeholder="ex: Coca-Cola" value={brand} onChange={e => setBrand(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Catégorie (optionnel)</Label>
                    <Input id="category" name="category" placeholder="ex: Boisson gazeuse" value={category} onChange={e => setCategory(e.target.value)} />
                </div>
            </div>
            
            {barcode && (
                <div className="space-y-2">
                    <Label htmlFor="barcode">Code-barres</Label>
                     <Input id="barcode" name="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} readOnly className="bg-muted/70"/>
                </div>
            )}

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
    </div>
  );
}
