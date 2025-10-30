'use server';

import { adminDb, adminStorage } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

// S'assure que les services ont été correctement initialisés
function checkFirebaseServices() {
    if (!adminDb || !adminStorage) {
        throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    }
}

async function getOrCreateStore(storeName: string, address?: string, latitude?: number, longitude?: number): Promise<string> {
    checkFirebaseServices();
    const storesRef = adminDb.collection('stores');
    let query = storesRef.where("name", "==", storeName);
    if(address) {
        query = query.where("address", "==", address);
    }
    
    const querySnapshot = await query.limit(1).get();

    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
    } else {
        const newStoreData: any = {
            name: storeName,
            address: address || '',
            createdAt: FieldValue.serverTimestamp(),
        };
        if(latitude && longitude) {
            newStoreData.latitude = latitude;
            newStoreData.longitude = longitude;
        }

        const newStoreRef = await storesRef.add(newStoreData);
        return newStoreRef.id;
    }
}

async function getOrCreateProduct(productName: string, brand?: string, category?: string, barcode?: string, imageUrl?: string): Promise<string> {
    checkFirebaseServices();
    const productsRef = adminDb.collection('products');
    let query = productsRef.where("name", "==", productName);
     if(brand) {
        query = query.where("brand", "==", brand);
    }

    const querySnapshot = await query.limit(1).get();

    if (!querySnapshot.empty) {
        const productDoc = querySnapshot.docs[0];
        const productId = productDoc.id;
        
        const updateData: { imageUrl?: string, barcode?: string, updatedAt: FieldValue } = { updatedAt: FieldValue.serverTimestamp()};
        if (imageUrl && !productDoc.data().imageUrl) {
            updateData.imageUrl = imageUrl;
        }
        if (barcode && !productDoc.data().barcode) {
             updateData.barcode = barcode;
        }
        
        if (Object.keys(updateData).length > 1) { // more than just timestamp
            await adminDb.collection('products').doc(productId).update(updateData);
        }
        return productId;
    } else {
        const newProductRef = await productsRef.add({
            name: productName,
            brand: brand || '',
            category: category || '',
            barcode: barcode || '',
            imageUrl: imageUrl || '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return newProductRef.id;
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
    const { userId, productName, price, storeName, address, latitude, longitude, brand, category, barcode, photoDataUri } = data;

    let imageUrl: string | undefined = undefined;
    if (photoDataUri && photoDataUri.startsWith('data:image')) {
        imageUrl = await uploadImage(photoDataUri, userId);
    } else if (photoDataUri) {
        imageUrl = photoDataUri; // C'est déjà une URL
    }

    const storeId = await getOrCreateStore(storeName, address, latitude, longitude);
    const productId = await getOrCreateProduct(productName, brand, category, barcode, imageUrl);
    
    // Utiliser la collection "prices" pour la cohérence
    const pricesRef = adminDb.collection('prices');

    await pricesRef.add({
        userId,
        productId,
        storeId,
        price: Number(price),
        createdAt: FieldValue.serverTimestamp(),
        upvotes: [],
        downvotes: [],
        voteScore: 0,
        verified: false,
    });
    
    // Mettre à jour les points de l'utilisateur
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
        points: FieldValue.increment(10),
        contributions: FieldValue.increment(1)
    });
    
    return { status: "success", message: "Prix ajouté avec succès !" };

  } catch (error) {
    console.error("🔥 Erreur Firebase dans l'action addPrice:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue côté serveur.";
    return { status: "error", message: errorMessage };
  }
}
