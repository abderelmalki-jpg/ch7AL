
'use server';

import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { z } from 'zod';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, type Firestore, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getSdks, initializeFirebase } from '@/firebase';


// --- AI Suggestions Action ---
const suggestionSchema = z.object({
    productDescription: z.string().min(10, { message: 'La description doit contenir au moins 10 caractères.' }),
});

export type SuggestionFormState = {
    message: string;
    suggestions: string[];
    errors?: {
        productDescription?: string[];
    }
}

export async function getSuggestions(
    prevState: SuggestionFormState,
    formData: FormData
): Promise<SuggestionFormState> {
    const validatedFields = suggestionSchema.safeParse({
        productDescription: formData.get('productDescription'),
    });

    if (!validatedFields.success) {
        return {
            message: 'La validation a échoué.',
            suggestions: [],
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { suggestedProductNames } = await suggestAlternativeProducts({
            productDescription: validatedFields.data.productDescription,
        });

        if (suggestedProductNames && suggestedProductNames.length > 0) {
            return {
                message: 'Voici quelques suggestions :',
                suggestions: suggestedProductNames,
            };
        } else {
             return {
                message: 'Impossible de générer des suggestions basées sur la description.',
                suggestions: [],
            };
        }
    } catch (error) {
        console.error("AI Suggestion Error:", error);
        return {
            message: 'Une erreur est survenue lors de la génération des suggestions.',
            suggestions: [],
        };
    }
}


// --- Add Price Action ---
const addPriceSchema = z.object({
    userId: z.string().min(1, 'ID utilisateur manquant.'),
    productName: z.string().min(1, 'Le nom du produit est requis.'),
    price: z.coerce.number().positive('Le prix doit être un nombre positif.'),
    storeName: z.string().min(1, 'Le nom du magasin est requis.'),
    address: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    brand: z.string().optional(),
    category: z.string().optional(),
    photoDataUri: z.string().optional(),
});

export type AddPriceFormState = {
    status: 'idle' | 'success' | 'error';
    message: string;
    errors?: {
        userId?: string[];
        productName?: string[];
        price?: string[];
        storeName?: string[];
    }
}

async function getOrCreateStore(db: Firestore, storeName: string, address?: string, latitude?: number, longitude?: number): Promise<string> {
    const storesRef = collection(db, 'stores');
    const q = query(storesRef, where("name", "==", storeName));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newStoreData: any = {
            name: storeName,
            address: address || '',
            createdAt: serverTimestamp(),
            rating: 0,
            totalRatings: 0,
        };
        if(latitude && longitude) {
            newStoreData.latitude = latitude;
            newStoreData.longitude = longitude;
        }

        const newStoreRef = await addDoc(storesRef, newStoreData);
        return newStoreRef.id;
    }
}


async function getOrCreateProduct(db: Firestore, productName: string, brand?: string, category?: string, imageUrl?: string): Promise<string> {
     const productsRef = collection(db, 'products');
    const q = query(productsRef, where("name", "==", productName), where("brand", "==", brand || ''));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const productId = querySnapshot.docs[0].id;
        // If an image is provided and the product doesn't have one, update it.
        if (imageUrl && !querySnapshot.docs[0].data().imageUrl) {
            await updateDoc(doc(db, 'products', productId), { imageUrl });
        }
        return productId;
    } else {
        const newProductRef = await addDoc(productsRef, {
            name: productName,
            brand: brand || '',
            category: category || '',
            barcode: `generated-${Date.now()}`, // Placeholder barcode
            imageUrl: imageUrl || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return newProductRef.id;
    }
}

async function uploadImageToStorage(photoDataUri: string, userId: string): Promise<string> {
    // This now relies on the client-side Firebase instance
    const { firebaseApp } = initializeFirebase();
    const storage = getStorage(firebaseApp);
    
    const fileExtension = photoDataUri.substring("data:image/".length, photoDataUri.indexOf(";base64"));
    const imageRef = ref(storage, `products/${userId}/${Date.now()}.${fileExtension}`);

    await uploadString(imageRef, photoDataUri, 'data_url');
    const url = await getDownloadURL(imageRef);
    return url;
}


export async function addPrice(
    db: Firestore, 
    data: z.infer<typeof addPriceSchema>
): Promise<AddPriceFormState> {
    
    const validatedFields = addPriceSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'La validation a échoué. Veuillez vérifier les champs.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { userId, productName, price, storeName, address, latitude, longitude, brand, category, photoDataUri } = validatedFields.data;

    if (!userId) {
         return {
            status: 'error',
            message: "Vous devez être connecté pour ajouter un prix.",
            errors: { userId: ["Utilisateur non authentifié."]}
        };
    }

    try {
        let imageUrl: string | undefined = undefined;
        if (photoDataUri && photoDataUri.startsWith('data:image')) {
            imageUrl = await uploadImageToStorage(photoDataUri, userId);
        } else if (photoDataUri) {
            imageUrl = photoDataUri; // It's already a URL
        }

        const storeId = await getOrCreateStore(db, storeName, address, latitude, longitude);
        const productId = await getOrCreateProduct(db, productName, brand, category, imageUrl);

        await runTransaction(db, async (transaction) => {
            const priceDocRef = doc(collection(db, 'prices')); // Create a new doc ref for the price
            const userRef = doc(db, 'users', userId);

            // 1. Add the new price
            transaction.set(priceDocRef, {
                userId,
                productId,
                storeId,
                price,
                createdAt: serverTimestamp(),
                verified: false,
                reports: 0,
                upvotes: [],
                downvotes: [],
                voteScore: 0,
            });

            // 2. Update user's points and contributions
            transaction.update(userRef, {
                points: increment(10),
                contributions: increment(1)
            });
        });

        return {
            status: 'success',
            message: `Prix pour ${productName} ajouté avec succès chez ${storeName} ! (+10 points)`,
        };

    } catch (error) {
        console.error('Error adding price:', error);
        return {
            status: 'error',
            message: "Une erreur est survenue lors de l'ajout du prix à la base de données."
        };
    }
}

    
