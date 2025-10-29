
'use server';

import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { z } from 'zod';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, type Firestore } from 'firebase/firestore';
import { getDb } from '@/firebase/server';
import { getStorage } from 'firebase-admin/storage';


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
    const storage = getStorage();
    const bucket = storage.bucket();

    const fileExtension = photoDataUri.substring("data:image/".length, photoDataUri.indexOf(";base64"));
    const fileName = `products/${userId}/${Date.now()}.${fileExtension}`;
    const file = bucket.file(fileName);

    const buffer = Buffer.from(photoDataUri.split(',')[1], 'base64');
    
    await file.save(buffer, {
        metadata: {
            contentType: `image/${fileExtension}`,
        },
    });
    
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // Far future expiration
    });

    return url;
}


export async function addPrice(prevState: AddPriceFormState, formData: FormData): Promise<AddPriceFormState> {
    const db = getDb();
    
    const validatedFields = addPriceSchema.safeParse({
        userId: formData.get('userId'),
        productName: formData.get('productName'),
        price: formData.get('price'),
        storeName: formData.get('storeName'),
        address: formData.get('address'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        brand: formData.get('brand'),
        category: formData.get('category'),
        photoDataUri: formData.get('photoDataUri'),
    });

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
        if (photoDataUri) {
            imageUrl = await uploadImageToStorage(photoDataUri, userId);
        }

        const storeId = await getOrCreateStore(db, storeName, address, latitude, longitude);
        const productId = await getOrCreateProduct(db, productName, brand, category, imageUrl);

        const pricesRef = collection(db, 'prices');
        await addDoc(pricesRef, {
            userId,
            productId,
            storeId,
            price,
            createdAt: serverTimestamp(),
            verified: false,
            reports: 0
        });

        // Update user's points and contributions
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: increment(10),
            contributions: increment(1)
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
