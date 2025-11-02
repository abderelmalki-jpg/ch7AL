
'use server';

import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let adminApp: App | undefined;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

function initializeAdminApp() {
    // Si déjà initialisé (avec succès ou échec), ne rien faire.
    if (adminApp !== undefined) {
        return;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("🔥 Erreur critique: Les variables d'environnement pour Firebase Admin SDK sont manquantes (NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Le SDK Admin ne sera pas initialisé.");
        adminApp = undefined; // Marquer comme tentative d'initialisation échouée
        return;
    }

    try {
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        
        const serviceAccount = {
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
        };

        // Utiliser getApps pour éviter la ré-initialisation
        const existingApp = getApps().find(app => app.name === 'admin');
        if (existingApp) {
            adminApp = existingApp;
        } else {
            adminApp = initializeApp({
                credential: cert(serviceAccount),
                storageBucket: `${projectId}.appspot.com`,
            }, 'admin');
        }
        
        adminDb = getFirestore(adminApp);
        adminStorage = getStorage(adminApp);
        console.log("✅ Firebase Admin SDK initialisé avec succès.");

    } catch (error: any) {
        console.error("🔥 Erreur lors de l'initialisation de Firebase Admin SDK:", error.message);
        adminApp = undefined;
        adminDb = null;
        adminStorage = null;
    }
}


interface AdminServices {
    adminDb: Firestore | null;
    adminStorage: Storage | null;
}

/**
 * Gets the initialized Firebase Admin services.
 * It will attempt to initialize them on the first call if they haven't been already.
 */
export function getAdminServices(): AdminServices {
    if (adminApp === undefined) {
        initializeAdminApp();
    }
    return { adminDb, adminStorage };
}
