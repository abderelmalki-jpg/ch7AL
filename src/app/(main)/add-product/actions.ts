
'use server';

import { getAdminServices } from '@/firebase/server';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
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

// Fonction pour uploader l'image en utilisant le SDK Admin
async function uploadImage(dataUri: string, userId: string): Promise<string> {
    const { adminStorage } = getAdminServices();
    if (!adminStorage) throw new Error("Firebase Admin Storage n'est pas initialisé.");
    
    const imagePath = `product-images/${userId}/${Date.now()}.jpg`;
    const imageFile = adminStorage.bucket().file(imagePath);

    const base64EncodedImageString = dataUri.split(';base64,').pop();
    if (!base64EncodedImageString) {
        throw new Error('Data URI invalide');
    }
    const imageBuffer = Buffer.from(base64EncodedImageString, 'base64');
    
    await imageFile.save(imageBuffer, {
        metadata: { contentType: 'image/jpeg' },
    });
    
    // Rendre le fichier publiquement lisible pour y accéder via URL
    await imageFile.makePublic();

    // Retourner l'URL publique
    return imageFile.publicUrl();
}


// Fonction principale pour ajouter un prix
export async function addPrice(
  data: PriceInput
): Promise<{ status: 'success' | 'error'; message: string }> {
  
  const { adminDb } = getAdminServices();
  if (!adminDb) {
      return { status: 'error', message: "La base de données Admin n'est pas disponible. Vérifiez la configuration du serveur." };
  }

  const validatedFields = PriceSchema.safeParse(data);
  if (!validatedFields.success) {
    return { status: 'error', message: 'Données invalides.' };
  }
  
  // Correction : Créer une version des données SANS l'image pour les logs d'erreur
  const { photoDataUri: _, ...loggableData } = data;


  const {
    userId,
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
      imageUrl = await uploadImage(photoDataUri, userId);
    }
    
    await adminDb.runTransaction(async (transaction) => {
      // Admin SDK n'a pas serverTimestamp(), on utilise FieldValue
      const timestamp = FieldValue.serverTimestamp();

      // Utiliser un ID de produit normalisé pour éviter les doublons dus à la casse
      const productDocId = productName.trim().toLowerCase().replace(/\s+/g, '-');

      const storeRef = adminDb.collection('stores').doc(storeName.trim());
      const storeSnap = await transaction.get(storeRef);
      
      if (!storeSnap.exists) {
        transaction.set(storeRef, {
          name: storeName.trim(),
          address: address || null,
          city: city || null,
          neighborhood: neighborhood || null,
          latitude: latitude || null,
          longitude: longitude || null,
          createdAt: timestamp,
          updatedAt: timestamp,
          addedBy: userId,
        });
      }

      const productRef = adminDb.collection('products').doc(productDocId);
      const productSnap = await transaction.get(productRef);
      
      const productData: any = {
          name: productName.trim(),
          brand: brand || '',
          category: category || '',
          updatedAt: timestamp,
          uploadedBy: userId,
      };

      if (!productSnap.exists) {
        productData.createdAt = timestamp;
        if(imageUrl) productData.imageUrl = imageUrl;
        transaction.set(productRef, productData);
      } else {
        // Mettre à jour l'image seulement si elle n'existait pas
        if (imageUrl && !productSnap.data()?.imageUrl) {
            productData.imageUrl = imageUrl;
        }
        transaction.update(productRef, productData);
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
      transaction.update(userRef, {
        points: FieldValue.increment(10),
        contributions: FieldValue.increment(1),
      });
    });

    return { status: 'success', message: 'Prix ajouté avec succès !' };

  } catch (error: any) {
    console.error("🔥 Erreur Firestore dans l'action addPrice:", error);
    
    // CORRECTION CRITIQUE : Exclure le data URI de l'image des erreurs propagées
    // pour éviter l'erreur "Maximum call stack size exceeded".
    
    if (error.code === 'permission-denied' || (error.code === 7 && error.message.includes("permission-denied"))) {
        const permissionError = new FirestorePermissionError({
            path: `prices, products, stores, or users`,
            operation: 'write',
            requestResourceData: loggableData, // Utiliser les données SANS l'image
        });
        errorEmitter.emit('permission-error', permissionError);
    }

    // Retourner un message d'erreur générique mais informatif.
    // L'erreur spécifique (comme RangeError) est loggée côté serveur.
    const errorMessage = error instanceof RangeError 
        ? "Une erreur interne est survenue (stack size exceeded). L'incident a été enregistré."
        : error.message || "Une erreur inconnue est survenue lors de l'ajout du prix.";

    return { status: 'error', message: errorMessage };
  }
}
