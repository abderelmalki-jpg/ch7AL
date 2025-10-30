
'use server';

import { adminDb, adminStorage } from "@/firebase/server";
import { FieldValue }from "firebase-admin/firestore";

// S'assure que les services ont été correctement initialisés
function checkFirebaseServices() {
    if (!adminDb || !adminStorage) {
        throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    }
}

async function uploadImage(dataUri: string, userId: string): Promise<string> {
    checkFirebaseServices();
    const bucket = adminStorage.bucket();
    
    const mimeType = dataUri.substring("data:".length, dataUri.indexOf(";base64"));
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const filePath = `product-images/${userId}/${Date.now()}.${fileExtension}`;
    
    const base64Data = dataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const file = bucket.file(filePath);
    await file.save(buffer, {
        metadata: {
            contentType: mimeType
        }
    });

    // Rendre le fichier public et obtenir l'URL
    await file.makePublic();
    return file.publicUrl();
}

export async function addPrice(data: any) {
  try {
    checkFirebaseServices();
    const { userEmail, productName, price, storeName, address, latitude, longitude, brand, category, barcode, photoDataUri, userId } = data;

    let imageUrl: string | undefined = undefined;
    if (photoDataUri && photoDataUri.startsWith('data:image')) {
        imageUrl = await uploadImage(photoDataUri, userId); 
    }

    const batch = adminDb.batch();

    // 1. Gérer la collection `stores`
    const storeRef = adminDb.collection('stores').doc(storeName);
    const storeData = {
        name: storeName,
        address: address || '',
        location: JSON.stringify({ lat: latitude || null, lng: longitude || null }),
        updatedAt: FieldValue.serverTimestamp(),
    };
    // Créer le magasin s'il n'existe pas, sinon mettre à jour `updatedAt`
    batch.set(storeRef, { 
      ...storeData,
      // `addedBy` et `createdAt` uniquement à la création
      addedBy: userEmail,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });


    // 2. Gérer la collection `products`
    const productRef = adminDb.collection('products').doc(productName);
    const newProductData: any = {
        name: productName,
        brand: brand || '',
        category: category || '',
        barcode: barcode || '',
        updatedAt: FieldValue.serverTimestamp(),
        uploadedBy: userEmail
    };

    if (imageUrl) {
        newProductData.imageUrl = imageUrl;
    }
    // Utiliser `set` avec `merge: true` pour créer/mettre à jour
    batch.set(productRef, newProductData, { merge: true });
    
    // 3. Gérer la collection `priceRecords`
    const priceRecordRef = adminDb.collection('priceRecords').doc(); // ID auto-généré
    const locationData = {
        lat: latitude || null,
        lng: longitude || null,
        address: address || ''
    };
    const newPriceRecord = {
        barcode: barcode || '',
        createdAt: FieldValue.serverTimestamp(),
        currency: "MAD",
        location: JSON.stringify(locationData),
        price: Number(price),
        productId: productName, // Utilisation directe du nom du produit
        reportedBy: userEmail,
        storeName: storeName,
        updatedAt: FieldValue.serverTimestamp(),
        verificationCount: 0,
        verifiedBy: JSON.stringify([]),
    };
    batch.set(priceRecordRef, newPriceRecord);
    
    // 4. Mettre à jour les points de l'utilisateur
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, {
        points: FieldValue.increment(10),
        contributions: FieldValue.increment(1)
    });

    // Exécuter toutes les opérations en une seule transaction
    await batch.commit();
    
    return { status: "success", message: "Prix ajouté avec succès !" };

  } catch (error) {
    console.error("🔥 Erreur Firebase dans l'action addPrice:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue côté serveur.";
    return { status: "error", message: errorMessage };
  }
}
