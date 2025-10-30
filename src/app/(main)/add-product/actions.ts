'use server';

import { adminDb, adminStorage } from "@/firebase/server";
import { FieldValue } from "firebase-admin/firestore";

async function getOrCreateStore(storeName: string, address?: string, latitude?: number, longitude?: number): Promise<string> {
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
            await adminDb.collection('products').doc(productId).set(updateData, { merge: true });
        }
        return productId;
    } else {
        const newProductRef = await productsRef.add({
            name: productName,
            brand: brand || '',
            category: category || '',
            barcode: barcode || `generated-${Date.now()}`,
            imageUrl: imageUrl || '',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        return newProductRef.id;
    }
}

async function uploadImage(dataUri: string, userId: string): Promise<string> {
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

    // Make the file public and get the URL
    await file.makePublic();
    return file.publicUrl();
}

export async function addPrice(data: any) {
  try {
    const { userId, productName, price, storeName, address, latitude, longitude, brand, category, barcode, photoDataUri } = data;

    let imageUrl: string | undefined = undefined;
    if (photoDataUri && photoDataUri.startsWith('data:image')) {
        imageUrl = await uploadImage(photoDataUri, userId);
    } else if (photoDataUri) {
        imageUrl = photoDataUri; // It's already a URL from a previous search/product
    }

    const storeId = await getOrCreateStore(storeName, address, latitude, longitude);
    const productId = await getOrCreateProduct(productName, brand, category, barcode, imageUrl);

    const transaction = adminDb.runTransaction(async (t) => {
        const priceDocRef = adminDb.collection('priceRecords').doc();
        const userRef = adminDb.collection('users').doc(userId);

        t.set(priceDocRef, {
            userId,
            productId,
            storeId,
            price: Number(price),
            createdAt: FieldValue.serverTimestamp(),
            storeName, // Denormalized for easier display
            productName, // Denormalized for easier display
            ...(barcode && { barcode }),
            ...(imageUrl && {productImageUrl: imageUrl}) // Maybe useful
        });

        t.update(userRef, {
            points: FieldValue.increment(10),
            contributions: FieldValue.increment(1)
        });
    });

    await transaction;
    
    return { status: "success", message: "Prix ajouté avec succès !" };

  } catch (error) {
    console.error("🔥 Erreur Firebase:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue côté serveur.";
    return { status: "error", message: errorMessage };
  }
}

    