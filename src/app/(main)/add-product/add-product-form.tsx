'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSuggestions, addPrice, type SuggestionFormState, type AddPriceFormState } from './actions';
import { identifyProduct } from '@/ai/flows/identify-product-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb, MapPin, X, CheckCircle2, Camera, Zap, Sparkles, Info, Video } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();

    // Form states
    const initialPriceState: AddPriceFormState = { status: 'idle', message: '' };
    const [priceFormState, addPriceAction] = useActionState(addPrice, initialPriceState);

    const initialSuggestionState: SuggestionFormState = { message: '', suggestions: [] };
    const [suggestionState, suggestionAction] = useActionState(getSuggestions, initialSuggestionState);

    // Submission states
    const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

    // Form fields
    const [productName, setProductName] = useState(searchParams.get('name') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [photoDataUri, setPhotoDataUri] = useState(searchParams.get('photoDataUri') || '');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    // Location state
    const [isLocating, setIsLocating] = useState(false);
    
    // Camera and AI state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isIdentifying, setIsIdentifying] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

     useEffect(() => {
        let stream: MediaStream | null = null;
        async function getCameraPermission() {
          if (!isCameraOn) {
            if (videoRef.current && videoRef.current.srcObject) {
              const currentStream = videoRef.current.srcObject as MediaStream;
              currentStream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
            }
            return;
          };

          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError("L'accès à la caméra n'est pas supporté par ce navigateur.");
            return;
          }
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
        }
        getCameraPermission();
        return () => {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
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

    useEffect(() => {
        if (priceFormState.status === 'success') {
            toast({
                title: 'Succès !',
                description: priceFormState.message,
                duration: 4000,
            });
            setTimeout(() => router.push('/dashboard'), 1000);
        } else if (priceFormState.status === 'error') {
             toast({
                variant: 'destructive',
                title: 'Erreur de soumission',
                description: priceFormState.message,
            });
        }
        if(priceFormState.status !== 'idle') {
            setIsSubmittingPrice(false);
        }
    }, [priceFormState, router, toast]);

    const handlePriceSubmit = (formData: FormData) => {
        setIsSubmittingPrice(true);
        addPriceAction(formData);
    }
    
    const handleSuggestionSubmit = (formData: FormData) => {
        setIsSubmittingSuggestion(true);
        suggestionAction(formData);
    }

    useEffect(() => {
        if (suggestionState.message) {
            setIsSubmittingSuggestion(false);
        }
    }, [suggestionState]);

    const handleCopyToClipboard = (text: string) => {
        setProductName(text);
        toast({
            description: `Nom du produit mis à jour avec "${text}".`,
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

  return (
    <div className="space-y-8">
        
        {/* --- AI Camera Scanner --- */}
        <Card className="bg-primary/5">
             <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <Camera className="text-primary" />
                    Analyse par IA
                </CardTitle>
                <CardDescription>Utilisez votre caméra pour identifier un produit et remplir les champs automatiquement.</CardDescription>
            </CardHeader>
            <CardContent>
                {!isCameraOn && (
                     <Button onClick={() => setIsCameraOn(true)} className="w-full">
                        <Camera className="mr-2 h-4 w-4" /> Ouvrir la caméra
                    </Button>
                )}

                {isCameraOn && (
                    <div className="space-y-4">
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
                        <div className="flex gap-2">
                             <Button onClick={handleCapture} disabled={isIdentifying || !!cameraError} className="w-full">
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
                            <Button variant="outline" onClick={() => setIsCameraOn(false)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Fermer</span>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* --- Product & Price Form --- */}
        <form action={handlePriceSubmit} className="space-y-6">
            <input type="hidden" name="userId" value={user?.uid || ''} />
            <input type="hidden" name="brand" value={brand} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="latitude" value={latitude ?? ""} />
            <input type="hidden" name="longitude" value={longitude ?? ""} />
            <input type="hidden" name="photoDataUri" value={photoDataUri} />

            <h2 className="text-xl font-bold font-headline border-b pb-2">Détails du prix</h2>

            {priceFormState.errors?.userId && <p className="text-sm font-medium text-destructive">{priceFormState.errors.userId[0]}</p>}

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
            
            <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit</Label>
                <Input id="productName" name="productName" placeholder="ex: Canette de Coca-Cola" value={productName} onChange={(e) => setProductName(e.target.value)} required/>
                {priceFormState.errors?.productName && <p className="text-sm font-medium text-destructive">{priceFormState.errors.productName[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="price">Prix</Label>
                <div className="relative">
                     <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" className="pl-4 pr-12" required/>
                     <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground text-sm">
                        DH
                    </span>
                </div>
                 {priceFormState.errors?.price && <p className="text-sm font-medium text-destructive">{priceFormState.errors.price[0]}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="storeName">Lieu (Hanout)</Label>
                <Input id="storeName" name="storeName" placeholder="ex: Epicerie Al Amal" required />
                {priceFormState.errors?.storeName && <p className="text-sm font-medium text-destructive">{priceFormState.errors.storeName[0]}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="address">Adresse (Optionnel)</Label>
                <div className="flex gap-2">
                    <Input id="address" name="address" placeholder="Adresse du magasin" value={address} onChange={(e) => setAddress(e.target.value)} />
                    <Button type="button" variant="outline" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin"/> : <MapPin className="h-4 w-4" />}
                        <span className="sr-only">Géolocaliser</span>
                    </Button>
                </div>
            </div>

            <Button type="submit" disabled={isSubmittingPrice} className="w-full text-lg h-12">
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

        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl">
                    <Wand2 className="text-accent" /> Pas sûr du nom ? Demandez à l'IA
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSuggestionSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="product-description">Description du produit</Label>
                        <Textarea 
                            id="product-description" 
                            name="productDescription" 
                            placeholder="Décrivez le produit pour obtenir des suggestions de noms. Par exemple : 'Une boisson gazeuse populaire, saveur classique, dans une canette rouge.'"
                        />
                         {suggestionState.errors?.productDescription && (
                            <p className="text-sm font-medium text-destructive">{suggestionState.errors.productDescription[0]}</p>
                        )}
                    </div>
                    <Button type="submit" variant="outline" disabled={isSubmittingSuggestion}>
                        {isSubmittingSuggestion ? (
                             <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Recherche...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="mr-2 h-4 w-4"/>
                                Suggérer des noms
                            </>
                        )}
                    </Button>
                </form>
                
                {suggestionState.suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="font-semibold">{suggestionState.message}</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestionState.suggestions.map((name, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleCopyToClipboard(name)}
                                    className="bg-accent/20 text-accent-foreground py-1 px-3 rounded-full text-sm hover:bg-accent/30 transition-colors"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 {suggestionState.message && suggestionState.suggestions.length === 0 && !suggestionState.errors && (
                     <p className="mt-4 text-sm text-muted-foreground">{suggestionState.message}</p>
                 )}
            </CardContent>
        </Card>
    </div>
  );
}
