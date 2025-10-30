
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
    const timestamp = FieldValue.serverTimestamp();

    // 1. Gérer la collection `stores`
    const storeRef = adminDb.collection('stores').doc(storeName);
    const storeDoc = await storeRef.get();
    
    let storeData:any = { name: storeName, updatedAt: timestamp };
    if (address) storeData.address = address;
    if (latitude && longitude) storeData.location = JSON.stringify({ lat: latitude, lng: longitude });

    if (!storeDoc.exists) {
        storeData = {
            ...storeData,
            addedBy: userEmail,
            createdAt: timestamp,
            city: '' // Vous pouvez ajouter une logique pour extraire la ville de l'adresse plus tard
        };
    }
    batch.set(storeRef, storeData, { merge: true });


    // 2. Gérer la collection `products`
    const productRef = adminDb.collection('products').doc(productName);
    const productDoc = await productRef.get();

    const productData: any = {
        name: productName,
        brand: brand || '',
        category: category || '',
        barcode: barcode || '',
        updatedAt: timestamp,
    };
     if (imageUrl) {
        productData.imageUrl = imageUrl;
    }
    if (!productDoc.exists) {
        productData.description = ''; // description initiale
        productData.uploadedBy = userEmail;
        productData.createdAt = timestamp;
    }
    batch.set(productRef, productData, { merge: true });
    
    // 3. Gérer la collection `priceRecords`
    const priceRecordRef = adminDb.collection('priceRecords').doc(); // ID auto-généré
    const locationData = {
        lat: latitude || null,
        lng: longitude || null,
        address: address || ''
    };
    const newPriceRecord = {
        barcode: barcode || '',
        createdAt: timestamp,
        currency: "MAD",
        location: JSON.stringify(locationData),
        price: Number(price),
        productId: productName, // Utilisation directe du nom du produit
        reportedBy: userEmail,
        storeName: storeName,
        updatedAt: timestamp,
        verificationCount: 0,
        verifiedBy: JSON.stringify([]), // Tableau vide sous forme de string
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

