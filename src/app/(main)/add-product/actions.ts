
'use server';

import { getAdminServices } from '@/firebase/server';
import { z } from 'zod';
import { FieldValue, Filter } from 'firebase-admin/firestore';
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
  barcode: z.string().optional(),
  photoDataUri: z.string().optional(),
});

type PriceInput = z.infer<typeof PriceSchema>;

// Fonction pour uploader l'image en utilisant le SDK Admin
async function uploadImage(dataUri: string, userId: string): Promise<string> {
    const { adminStorage } = await getAdminServices();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!adminStorage) throw new Error("Firebase Admin Storage n'est pas initialisé.");
    if (!bucketName) {
        throw new Error("Le nom du bucket de stockage Firebase n'est pas défini dans les variables d'environnement.");
    }
    
    // Utilisation explicite du bucket
    const bucket = adminStorage.bucket(bucketName);
    const imagePath = `product-images/${userId}/${Date.now()}.jpg`;
    const imageFile = bucket.file(imagePath);

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
  
  const { adminDb } = await getAdminServices();
  if (!adminDb) {
      return { status: 'error', message: "La base de données Admin n'est pas disponible. Vérifiez la configuration du serveur." };
  }

  const validatedFields = PriceSchema.safeParse(data);
  if (!validatedFields.success) {
    return { status: 'error', message: 'Données invalides.' };
  }
  
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
    barcode,
    photoDataUri,
  } = validatedFields.data;

  try {
    let imageUrl: string | undefined = undefined;
    if (photoDataUri && photoDataUri.startsWith('data:image')) {
      imageUrl = await uploadImage(photoDataUri, userId);
    }
    
    await adminDb.runTransaction(async (transaction) => {
      const timestamp = FieldValue.serverTimestamp();
      
      let productRef;
      let productSnap;

      // Prioriser la recherche par code-barres s'il est fourni
      if (barcode) {
        const productQuery = adminDb.collection('products').where('barcode', '==', barcode).limit(1);
        const querySnapshot = await transaction.get(productQuery);
        if (!querySnapshot.empty) {
            productRef = querySnapshot.docs[0].ref;
            productSnap = querySnapshot.docs[0];
        }
      }

      // Si non trouvé par code-barres, chercher ou créer par nom
      if (!productRef) {
        const productDocId = productName.trim().toLowerCase().replace(/\s+/g, '-');
        productRef = adminDb.collection('products').doc(productDocId);
        productSnap = await transaction.get(productRef);
      }


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
      
      const productData: any = {
          name: productName.trim(),
          brand: brand || '',
          category: category || '',
          updatedAt: timestamp,
          uploadedBy: userId,
      };

      if (barcode) {
        productData.barcode = barcode;
      }

      if (!productSnap || !productSnap.exists) {
        productData.createdAt = timestamp;
        if(imageUrl) productData.imageUrl = imageUrl;
        transaction.set(productRef, productData);
      } else {
        if (imageUrl && !productSnap.data()?.imageUrl) {
            productData.imageUrl = imageUrl;
        }
        transaction.update(productRef, productData);
      }

      const priceRef = adminDb.collection('prices').doc();
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
    
    // Create a safe data object for logging, excluding the large data URI
    const { photoDataUri: _removed, ...safeData } = data;

    if (error.code === 'permission-denied' || (error.code === 7 && error.message.includes("permission-denied"))) {
        const permissionError = new FirestorePermissionError({
            path: `prices, products, stores, or users`,
            operation: 'write',
            requestResourceData: safeData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }

    const errorMessage = error.message || "Une erreur inconnue est survenue lors de l'ajout du prix.";

    return { status: 'error', message: errorMessage };
  }
}

// Action to find a product by its barcode
export async function findProductByBarcode(barcode: string): Promise<{product: any | null, error: string | null}> {
    const { adminDb } = await getAdminServices();
    if (!adminDb) {
      return { product: null, error: "La base de données Admin n'est pas disponible." };
    }
    try {
        const productQuery = adminDb.collection('products').where('barcode', '==', barcode).limit(1);
        const snapshot = await productQuery.get();
        
        if (snapshot.empty) {
            return { product: null, error: null };
        }
        
        const productDoc = snapshot.docs[0];
        const product = { id: productDoc.id, ...productDoc.data() };

        return { product, error: null };
    } catch (e: any) {
        console.error("Erreur lors de la recherche par code-barres:", e);
        return { product: null, error: "Une erreur est survenue lors de la recherche du produit." };
    }
}
