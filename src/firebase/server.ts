
'use server';

import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let adminApp: App | undefined;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

// Définir le nom du bucket de stockage directement et de manière fiable
const STORAGE_BUCKET = 'hanouti-6ce26.appspot.com';

function initializeAdminApp() {
    if (getApps().some(app => app.name === 'admin')) {
        if (!adminApp) {
            adminApp = getApps().find(app => app.name === 'admin');
            if (adminApp) {
                adminDb = getFirestore(adminApp);
                adminStorage = getStorage(adminApp);
            }
        }
        return;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!projectId || !clientEmail || !privateKey || privateKey.includes('your-private-key')) {
        console.error("🔥 Erreur critique: Des variables d'environnement pour Firebase Admin SDK sont manquantes ou non configurées. Le SDK Admin ne sera pas initialisé.");
        return;
    }

    try {
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        
        const serviceAccount = {
            projectId,
            clientEmail,
            privateKey: formattedPrivateKey,
        };

        adminApp = initializeApp({
            credential: cert(serviceAccount),
            // Utiliser le nom du bucket directement ici
            storageBucket: STORAGE_BUCKET,
        }, 'admin');
        
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
export async function getAdminServices(): Promise<AdminServices> {
    if (!adminApp) {
        initializeAdminApp();
    }
    return { adminDb, adminStorage };
}
