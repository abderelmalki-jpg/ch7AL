'use server';

import { adminDb, adminStorage } from "@/firebase/server";
import { getAuth } from "firebase-admin/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
    revalidatePath('/profile');
    revalidatePath('/dashboard'); // Pour le header

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

const UpdateProfileSchema = z.object({
    userId: z.string().min(1, "User ID est requis."),
    name: z.string().min(3, "Le nom doit contenir au moins 3 caractères.").max(50, "Le nom ne doit pas dépasser 50 caractères."),
});

/**
 * Server action pour mettre à jour le nom de l'utilisateur.
 * @param data Les données du formulaire contenant userId et le nouveau nom.
 */
export async function updateUserProfile(data: { userId: string; name: string }): Promise<{ status: 'success' | 'error'; message: string; }> {
    try {
        const validatedData = UpdateProfileSchema.parse(data);
        const { userId, name } = validatedData;
        
        checkFirebaseServices();

        // Mettre à jour le profil Firebase Auth
        await getAuth().updateUser(userId, { displayName: name });

        // Mettre à jour le profil Firestore
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ name: name });

        // Invalider le cache pour la page de profil pour refléter les changements
        revalidatePath('/profile');
        revalidatePath('/dashboard'); // Pour le header

        return { status: 'success', message: 'Nom mis à jour avec succès !' };
    } catch (error) {
        console.error("🔥 Erreur Firebase dans l'action updateUserProfile:", error);
        
        if (error instanceof z.ZodError) {
             return { status: 'error', message: error.errors[0].message };
        }

        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue côté serveur.";
        return { status: 'error', message: errorMessage };
    }
}
