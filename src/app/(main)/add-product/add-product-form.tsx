'use client';

import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSuggestions, addPrice, type SuggestionFormState, type AddPriceFormState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Loader2, Lightbulb, MapPin, X, CheckCircle2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  // We can't use useFormStatus from 'react-dom' here because there are two forms.
  // Instead, we will manage a loading state manually.
  // This part of the code needs to be adjusted based on which form is submitting.
  // For simplicity, let's assume the parent component handles loading state.
  return null;
}

export function AddProductForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();

    // Form state for adding a price
    const initialPriceState: AddPriceFormState = { status: 'idle', message: '' };
    const [priceFormState, addPriceAction] = useFormState(addPrice, initialPriceState);

    // Form state for AI suggestions
    const initialSuggestionState: SuggestionFormState = { message: '', suggestions: [] };
    const [suggestionState, suggestionAction] = useFormState(getSuggestions, initialSuggestionState);

    const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

    const [productName, setProductName] = useState(searchParams.get('name') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [photoDataUri, setPhotoDataUri] = useState(searchParams.get('photoDataUri') || '');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (priceFormState.status === 'success') {
            toast({
                title: 'Succès !',
                description: priceFormState.message,
                duration: 4000,
            });
            // Redirect to dashboard after a short delay to allow user to see the toast
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
            toast({ variant: 'destructive', title: 'Géolocalisation non supportée', description: 'Votre navigateur ne supporte pas la géolocalisation.' });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);
                // Simple feedback for now. A reverse geocoding API could provide a full address.
                setAddress(`Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                setIsLocating(false);
                toast({ title: 'Localisation obtenue !', description: "L'adresse a été mise à jour.", icon: <CheckCircle2 className="text-green-500" /> });
            },
            () => {
                setIsLocating(false);
                toast({ variant: 'destructive', title: 'Erreur de localisation', description: 'Impossible de récupérer votre position. Vérifiez les autorisations de votre navigateur.' });
            }
        );
    };

    const removeImage = () => {
        setPhotoDataUri('');
        // We also need to remove it from the URL query params
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('photoDataUri');
        newParams.delete('name');
        newParams.delete('brand');
        newParams.delete('category');
        router.replace(`/add-product?${newParams.toString()}`, { scroll: false });
    }

  return (
    <div className="space-y-8">
        <form action={handlePriceSubmit} className="space-y-6">
            <input type="hidden" name="userId" value={user?.uid || ''} />
            <input type="hidden" name="brand" value={brand} />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="latitude" value={latitude ?? ""} />
            <input type="hidden" name="longitude" value={longitude ?? ""} />
            <input type="hidden" name="photoDataUri" value={photoDataUri} />

            {priceFormState.errors?.userId && <p className="text-sm font-medium text-destructive">{priceFormState.errors.userId[0]}</p>}

            {photoDataUri && (
                <div className="space-y-2">
                    <Label>Aperçu de l'image</Label>
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
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
                 {priceFormSate.errors?.price && <p className="text-sm font-medium text-destructive">{priceFormState.errors.price[0]}</p>}
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="brandDisplay">Marque</Label>
                    <Input id="brandDisplay" placeholder="ex: Coca-Cola" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="categoryDisplay">Catégorie</Label>
                    <Input id="categoryDisplay" placeholder="ex: Boissons" value={category} onChange={(e) => setCategory(e.target.value)} />
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
