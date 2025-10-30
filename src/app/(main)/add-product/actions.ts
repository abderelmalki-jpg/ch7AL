
'use server';

import { z } from 'zod';
import { serverTimestamp, increment } from 'firebase/firestore';
import { getDb, getStorageAdmin } from '@/firebase/server';

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

async function getOrCreateStore(db: FirebaseFirestore.Firestore, storeName: string, address?: string, latitude?: number, longitude?: number): Promise<string> {
    const storesRef = db.collection('stores');
    const q = storesRef.where("name", "==", storeName);
    
    const querySnapshot = await q.get();

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

        const newStoreRef = await storesRef.add(newStoreData);
        return newStoreRef.id;
    }
}


async function getOrCreateProduct(db: FirebaseFirestore.Firestore, productName: string, brand?: string, category?: string, imageUrl?: string): Promise<string> {
    const productsRef = db.collection('products');
    const q = productsRef.where("name", "==", productName).where("brand", "==", brand || '');
    
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        const productId = productDoc.id;
        if (imageUrl && !productDoc.data().imageUrl) {
            await db.collection('products').doc(productId).update({ imageUrl });
        }
        return productId;
    } else {
        const newProductRef = await productsRef.add({
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
    const storage = getStorageAdmin().bucket();
    
    const mimeType = photoDataUri.substring("data:".length, photoDataUri.indexOf(";base64"));
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const filePath = `products/${userId}/${Date.now()}.${fileExtension}`;
    const file = storage.file(filePath);

    const buffer = Buffer.from(photoDataUri.split(',')[1], 'base64');

    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
        },
    });

    await file.makePublic();
    return file.publicUrl();
}


export async function addPrice(
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
    
    const db = getDb();

    try {
        let imageUrl: string | undefined = undefined;
        if (photoDataUri && photoDataUri.startsWith('data:image')) {
            imageUrl = await uploadImageToStorage(photoDataUri, userId);
        } else if (photoDataUri) {
            imageUrl = photoDataUri; // It's already a URL
        }

        const storeId = await getOrCreateStore(db, storeName, address, latitude, longitude);
        const productId = await getOrCreateProduct(db, productName, brand, category, imageUrl);

        await db.runTransaction(async (transaction) => {
            const priceDocRef = db.collection('prices').doc();
            const userRef = db.collection('users').doc(userId);

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

            const userDoc = await transaction.get(userRef);
            if(userDoc.exists) {
                transaction.update(userRef, {
                    points: increment(10),
                    contributions: increment(1)
                });
            }
        });

        return {
            status: 'success',
            message: `Prix pour ${productName} ajouté avec succès chez ${storeName} ! (+10 points)`,
        };

    } catch (error) {
        console.error('Error adding price:', error);
        let errorMessage = "Une erreur est survenue lors de l'ajout du prix à la base de données.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return {
            status: 'error',
            message: errorMessage
        };
    }
}

    