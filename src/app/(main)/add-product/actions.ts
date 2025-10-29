'use server';

import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { z } from 'zod';
import { auth } from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, where, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getSdks } from '@/firebase';


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
    userId: z.string(),
    productName: z.string().min(1, 'Le nom du produit est requis.'),
    price: z.coerce.number().positive('Le prix doit être un nombre positif.'),
    storeName: z.string().min(1, 'Le nom du magasin est requis.'),
    address: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
_brand: z.string().optional(),
_category: z.string().optional(),
});

export type AddPriceFormState = {
    status: 'success' | 'error';
    message: string;
    errors?: {
        productName?: string[];
        price?: string[];
        storeName?: string[];
    }
}

async function getOrCreateStore(db: any, storeName: string, address?: string, latitude?: number, longitude?: number): Promise<string> {
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
        };
        if(latitude && longitude) {
            newStoreData.latitude = latitude;
            newStoreData.longitude = longitude;
        }

        const newStoreRef = await addDoc(storesRef, newStoreData);
        return newStoreRef.id;
    }
}


async function getOrCreateProduct(db: any, productName: string, brand?: string, category?: string): Promise<string> {
     const productsRef = collection(db, 'products');
    const q = query(productsRef, where("name", "==", productName));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newProductRef = await addDoc(productsRef, {
            name: productName,
            brand: brand || '',
            category: category || '',
            barcode: `generated-${Date.now()}`, // Placeholder barcode
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return newProductRef.id;
    }
}


export async function addPrice(prevState: AddPriceFormState, formData: FormData): Promise<AddPriceFormState> {
    
    const validatedFields = addPriceSchema.safeParse({
        userId: formData.get('userId'),
        productName: formData.get('productName'),
        price: formData.get('price'),
        storeName: formData.get('storeName'),
        address: formData.get('address'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        _brand: formData.get('brand'),
        _category: formData.get('category'),
    });

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'La validation a échoué.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    const { firestore: db } = getSdks();
    const { userId, productName, price, storeName, address, latitude, longitude, _brand, _category } = validatedFields.data;

    try {
        const storeId = await getOrCreateStore(db, storeName, address, latitude, longitude);
        const productId = await getOrCreateProduct(db, productName, _brand, _category);

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

        return {
            status: 'success',
            message: `Prix de ${price} DH pour ${productName} ajouté avec succès !`,
        };

    } catch (error) {
        console.error('Error adding price:', error);
        return {
            status: 'error',
            message: "Une erreur est survenue lors de l'ajout du prix."
        };
    }
}
