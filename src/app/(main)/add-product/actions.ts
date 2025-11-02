
'use server';

import {
  doc,
  runTransaction,
  increment,
  type Firestore,
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, type FirebaseStorage } from 'firebase/storage';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { adminDb } from '@/firebase/server';

// Schéma de validation pour les données du formulaire
const PriceSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
  productName: z.string().min(1, 'Le nom du produit est requis.'),
  price: z.number().positive('Le prix doit être un nombre positif.'),
  storeName: z.string().min(1, 'Le nom du magasin est requis.'),
  address: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  brand: z.string().optional(),
  category: z.string().optional(),
  photoDataUri: z.string().optional(),
});

type PriceInput = z.infer<typeof PriceSchema>;

// Fonction pour uploader l'image
async function uploadImage(storage: FirebaseStorage, dataUri: string, userId: string): Promise<string> {
  const imagePath = `product-images/${userId}/${Date.now()}.jpg`;
  const imageRef = ref(storage, imagePath);
  
  const snapshot = await uploadString(imageRef, dataUri, 'data_url');
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

// Fonction principale pour ajouter un prix
export async function addPrice(
  firestore: Firestore,
  storage: FirebaseStorage,
  data: PriceInput
): Promise<{ status: 'success' | 'error'; message: string }> {

  const validatedFields = PriceSchema.safeParse(data);
  if (!validatedFields.success) {
    return { status: 'error', message: 'Données invalides.' };
  }

  const {
    userId,
    userEmail,
    productName,
    price,
    storeName,
    address,
    city,
    neighborhood,
    latitude,
    longitude,
    brand,
    category,
    photoDataUri,
  } = validatedFields.data;

  try {
    let imageUrl: string | undefined = undefined;
    if (photoDataUri && photoDataUri.startsWith('data:image')) {
      imageUrl = await uploadImage(storage, photoDataUri, userId);
    }
    
    if (!adminDb) {
      throw new Error("L'admin Firestore n'est pas initialisé.");
    }
    
    await adminDb.runTransaction(async (transaction) => {
      const timestamp = serverTimestamp();

      // IMPORTANT: Use product name in lowercase as the document ID for consistency
      const productDocId = productName.trim().toLowerCase();

      const storeRef = adminDb.collection('stores').doc(storeName.trim());
      const storeSnap = await transaction.get(storeRef);
      
      if (!storeSnap.exists) {
        transaction.set(storeRef, {
          name: storeName.trim(),
          address: address || '',
          city: city || '',
          neighborhood: neighborhood || '',
          latitude: latitude || null,
          longitude: longitude || null,
          createdAt: timestamp,
          updatedAt: timestamp,
          addedBy: userId,
        });
      }

      const productRef = adminDb.collection('products').doc(productDocId);
      const productSnap = await transaction.get(productRef);
      
      if (!productSnap.exists) {
        const productData: any = {
            name: productName.trim(), // Keep original casing for display
            brand: brand || '',
            category: category || '',
            createdAt: timestamp,
            updatedAt: timestamp,
            uploadedBy: userId,
        };
        if(imageUrl) productData.imageUrl = imageUrl;
        transaction.set(productRef, productData);
      } else if (imageUrl && !productSnap.data()?.imageUrl) {
        transaction.update(productRef, { imageUrl: imageUrl, updatedAt: timestamp });
      }

      const priceRef = adminDb.collection('prices').doc(); // Auto-generate ID
      transaction.set(priceRef, {
        productId: productRef.id,
        storeId: storeRef.id,
        userId: userId,
        price: price,
        createdAt: timestamp,
        verified: false,
        upvotes: [],
        downvotes: [],
        voteScore: 0,
      });

      const userRef = adminDb.collection('users').doc(userId);
      // Use Firestore's special FieldValue for atomic increments
      const FieldValue = require('firebase-admin').firestore.FieldValue;
      transaction.update(userRef, {
        points: FieldValue.increment(10),
        contributions: FieldValue.increment(1),
      });
    });

    return { status: 'success', message: 'Prix ajouté avec succès !' };
  } catch (error: any) {
    console.error("🔥 Erreur Firestore dans l'action addPrice:", error);
    
    // We remove the large data URI from the log to prevent call stack errors
    const { photoDataUri: _, ...loggableData } = data;
    
    if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: `prices, products, stores, or users`,
            operation: 'write',
            requestResourceData: loggableData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }

    const errorMessage = error.message || "Une erreur inconnue est survenue.";
    return { status: 'error', message: errorMessage };
  }
}
