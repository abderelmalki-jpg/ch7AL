
'use server';

import { 
    doc, 
    runTransaction, 
    collection, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    increment,
    type Firestore
} from 'firebase/firestore';
import { z } from 'zod';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Schéma de validation pour les données du formulaire
const PriceSchema = z.object({
  userId: z.string().min(1),
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
  imageUrl: z.string().optional(),
});

type PriceInput = z.infer<typeof PriceSchema>;

// Fonction principale pour ajouter un prix en utilisant le SDK CLIENT
export async function addPrice(
  db: Firestore,
  data: PriceInput
): Promise<{ status: 'success' | 'error'; message: string }> {

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
    imageUrl,
  } = validatedFields.data;

  try {
    await runTransaction(db, async (transaction) => {
      const productsCollection = collection(db, 'products');
      const storesCollection = collection(db, 'stores');
      const pricesCollection = collection(db, 'prices');
      const usersCollection = collection(db, 'users');

      let productRef;
      let productSnap;

      // Prioriser la recherche par code-barres s'il est fourni
      if (barcode) {
        const productQuery = query(productsCollection, where('barcode', '==', barcode), where('name', '==', productName.trim()));
        const querySnapshot = await transaction.get(productQuery);
        if (!querySnapshot.empty) {
            productRef = querySnapshot.docs[0].ref;
            productSnap = querySnapshot.docs[0];
        }
      }

      // Si non trouvé par code-barres, chercher ou créer par nom
      if (!productRef) {
        const productDocId = productName.trim().toLowerCase().replace(/\s+/g, '-');
        productRef = doc(productsCollection, productDocId);
        productSnap = await transaction.get(productRef);
      }

      const storeRef = doc(storesCollection, storeName.trim());
      const storeSnap = await transaction.get(storeRef);
      
      if (!storeSnap.exists()) {
        transaction.set(storeRef, {
          name: storeName.trim(),
          address: address || null,
          city: city || null,
          neighborhood: neighborhood || null,
          latitude: latitude || null,
          longitude: longitude || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          addedBy: userId,
        });
      }
      
      const productData: any = {
          name: productName.trim(),
          brand: brand || '',
          category: category || '',
          updatedAt: serverTimestamp(),
          uploadedBy: userId,
      };

      if (barcode) {
        productData.barcode = barcode;
      }
      
      if (imageUrl) {
        productData.imageUrl = imageUrl;
      }

      if (!productSnap || !productSnap.exists()) {
        productData.createdAt = serverTimestamp();
        transaction.set(productRef, productData);
      } else {
        // Only update image if it doesn't exist
        const existingData = productSnap.data();
        if (imageUrl && !existingData.imageUrl) {
            transaction.update(productRef, { imageUrl, updatedAt: serverTimestamp() });
        } else {
            transaction.update(productRef, { updatedAt: serverTimestamp() });
        }
      }

      const priceRef = doc(pricesCollection);
      transaction.set(priceRef, {
        productId: productRef.id,
        storeId: storeRef.id,
        userId: userId,
        price: price,
        createdAt: serverTimestamp(),
        verified: false,
        upvotes: [],
        downvotes: [],
        voteScore: 0,
      });

      const userRef = doc(usersCollection, userId);
      transaction.update(userRef, {
        points: increment(10),
        contributions: increment(1),
      });
    });

    return { status: 'success', message: 'Prix ajouté avec succès !' };

  } catch (error: any) {
    console.error("🔥 Erreur Firestore dans l'action addPrice:", error);
    
    // Create a safe data object for logging, excluding the large data URI
    const { imageUrl: _removed, ...safeData } = data;

    if (error.code === 'permission-denied') {
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

// Action to find a product by its barcode using CLIENT SDK
export async function findProductByBarcode(db: Firestore, barcode: string): Promise<{product: any | null, error: string | null}> {
    try {
        const productQuery = query(collection(db, 'products'), where('barcode', '==', barcode));
        const snapshot = await getDocs(productQuery);
        
        if (snapshot.empty) {
            return { product: null, error: null };
        }
        
        const productDoc = snapshot.docs[0];
        const product = { id: productDoc.id, ...productDoc.data() };

        return { product, error: null };
    } catch (e: any) {
        console.error("Erreur lors de la recherche par code-barres:", e);
        if (e.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: `products`,
                operation: 'list',
                requestResourceData: { barcode },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        return { product: null, error: "Une erreur est survenue lors de la recherche du produit." };
    }
}

    