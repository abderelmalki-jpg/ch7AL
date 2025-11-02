
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
    
    await runTransaction(firestore, async (transaction) => {
      const timestamp = serverTimestamp();

      const storeRef = doc(firestore, 'stores', storeName.trim());
      const storeSnap = await transaction.get(storeRef);
      let storeId = storeRef.id;

      if (!storeSnap.exists()) {
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

      const productRef = doc(firestore, 'products', productName.trim());
      const productSnap = await transaction.get(productRef);
      let productId = productRef.id;

      if (!productSnap.exists()) {
        const productData: any = {
            name: productName.trim(),
            brand: brand || '',
            category: category || '',
            createdAt: timestamp,
            updatedAt: timestamp,
            uploadedBy: userId,
        };
        if(imageUrl) productData.imageUrl = imageUrl;
        transaction.set(productRef, productData);
      } else if (imageUrl && !productSnap.data().imageUrl) {
        transaction.update(productRef, { imageUrl: imageUrl, updatedAt: timestamp });
      }

      const priceRef = doc(collection(firestore, 'prices'));
      transaction.set(priceRef, {
        productId: productId,
        storeId: storeId,
        userId: userId,
        price: price,
        createdAt: timestamp,
        verified: false,
        upvotes: [],
        downvotes: [],
        voteScore: 0,
      });

      const userRef = doc(firestore, 'users', userId);
      transaction.update(userRef, {
        points: increment(10),
        contributions: increment(1),
      });
    });

    return { status: 'success', message: 'Prix ajouté avec succès !' };
  } catch (error: any) {
    console.error("🔥 Erreur Firestore dans l'action addPrice:", error);
    
    if (error.code === 'permission-denied') {
        const { photoDataUri, ...errorData } = data;
        const permissionError = new FirestorePermissionError({
            path: `prices, products, stores, or users`,
            operation: 'write',
            requestResourceData: { ...errorData, photoDataUri: 'OMITTED_FOR_LOGGING' },
        });
        errorEmitter.emit('permission-error', permissionError);
    }

    const errorMessage = error.message || "Une erreur inconnue est survenue.";
    return { status: 'error', message: errorMessage };
  }
}
