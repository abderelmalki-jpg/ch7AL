
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let adminApp: App | undefined;

function initializeAdminApp() {
    if (!adminApp) {
        // Find an existing 'admin' app if available
        const existingApp = getApps().find(app => app.name === 'admin');
        if (existingApp) {
            adminApp = existingApp;
        } else {
            // Otherwise, initialize a new one
            const serviceAccountKey = {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
            };

            if (serviceAccountKey.projectId && serviceAccountKey.clientEmail && serviceAccountKey.privateKey) {
                try {
                    adminApp = initializeApp({
                        credential: cert(serviceAccountKey),
                        storageBucket: `${serviceAccountKey.projectId}.appspot.com`,
                    }, 'admin');
                     console.log("✅ Firebase Admin SDK initialisé avec succès.");
                } catch (error: any) {
                    console.error("🔥 Erreur lors de l'initialisation de Firebase Admin SDK :", error.message);
                    adminApp = undefined; // Ensure it's undefined on failure
                }
            } else {
                 console.warn("⚠️ Variables d'environnement pour Firebase Admin sont manquantes. Le SDK Admin n'est pas initialisé.");
            }
        }
    }
    return adminApp;
}

interface AdminServices {
    adminDb: Firestore | null;
    adminStorage: Storage | null;
}

/**
 * Gets the initialized Firebase Admin services.
 * It will attempt to initialize them if they haven't been already.
 */
export function getAdminServices(): AdminServices {
    const app = initializeAdminApp();
    if (app) {
        return {
            adminDb: getFirestore(app),
            adminStorage: getStorage(app),
        };
    }
    return {
        adminDb: null,
        adminStorage: null,
    };
}
