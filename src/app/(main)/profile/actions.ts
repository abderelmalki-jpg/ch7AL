'use server';

import { adminDb, adminStorage } from "@/firebase/server";
import { getAuth } from "firebase-admin/auth";

// S'assure que les services ont été correctement initialisés
function checkFirebaseServices() {
    if (!adminDb || !adminStorage) {
        throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    }
}

/**
 * Uploads a profile picture to Firebase Storage and updates the user's profile.
 * @param userId The user's ID.
 * @param dataUri The image data URI.
 * @returns The public URL of the uploaded image.
 */
async function uploadAndUpdateProfilePicture(userId: string, dataUri: string): Promise<string> {
    checkFirebaseServices();
    const bucket = adminStorage.bucket();
    
    const mimeType = dataUri.substring("data:".length, dataUri.indexOf(";base64"));
    const fileExtension = mimeType.split('/')[1] || 'jpg';
    const filePath = `profile-pictures/${userId}/profile.${fileExtension}`;
    
    const base64Data = dataUri.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const file = bucket.file(filePath);
    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
            // Add cache control to ensure the browser fetches the new image
            cacheControl: 'no-cache, max-age=0',
        }
    });

    // Make the file public and get the URL
    await file.makePublic();
    // Add a timestamp to the URL to force refresh on the client side
    const publicUrl = `${file.publicUrl()}?t=${new Date().getTime()}`;

    // Update Firebase Auth user profile
    await getAuth().updateUser(userId, { photoURL: publicUrl });

    // Update Firestore user profile
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({ photoURL: publicUrl });

    return publicUrl;
}

/**
 * Server action to change the user's profile picture.
 * @param data The form data containing the userId and dataUri.
 */
export async function changeProfilePicture(data: { userId: string; dataUri: string }): Promise<{ status: 'success' | 'error'; message: string; url?: string }> {
  try {
    const { userId, dataUri } = data;
    if (!userId || !dataUri) {
      throw new Error("User ID and image data are required.");
    }

    const newPhotoURL = await uploadAndUpdateProfilePicture(userId, dataUri);

    return { 
        status: "success", 
        message: "Photo de profil mise à jour avec succès !",
        url: newPhotoURL
    };
  } catch (error) {
    console.error("🔥 Erreur Firebase dans l'action changeProfilePicture:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue côté serveur.";
    return { status: "error", message: errorMessage };
  }
}
