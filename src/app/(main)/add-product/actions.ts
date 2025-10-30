
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
        // Le téléversement ne doit se produire que si une NOUVELLE image est capturée.
        imageUrl = await uploadImage(photoDataUri, userId); 
    }

    const priceRecordsRef = adminDb.collection('priceRecords');
    
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
        productId: productName, // Utilisation directe du nom du produit comme dans votre schéma
        reportedBy: userEmail, // Utilisation de l'email de l'utilisateur
        storeName: storeName,
        updatedAt: FieldValue.serverTimestamp(),
        verificationCount: 0,
        verifiedBy: JSON.stringify([]),
        // Le champ 'brand' n'est pas dans votre schéma `priceRecords` mais dans `products`
        // Nous l'omettons ici pour correspondre à votre structure `priceRecords`
    };

    await priceRecordsRef.add(newPriceRecord);

    // Optionnel : Vous pourriez vouloir mettre à jour un produit dans la collection `products`
    const productRef = adminDb.collection('products').doc(productName); // Utilise le nom comme ID
    await productRef.set({
        name: productName,
        brand: brand || '',
        category: category || '',
        barcode: barcode || '',
        imageUrl: imageUrl, // Mettre à jour l'image du produit
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    
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
