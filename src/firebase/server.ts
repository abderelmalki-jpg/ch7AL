
import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Définir une variable globale pour l'état d'initialisation
let adminApp: App | null = null;
let adminDbInstance: ReturnType<typeof getFirestore> | null = null;
let adminStorageInstance: ReturnType<typeof getStorage> | null = null;

function initializeAdminApp() {
    if (getApps().some(app => app.name === 'admin')) {
        if (!adminApp) {
             adminApp = getApps().find(app => app.name === 'admin')!;
             adminDbInstance = getFirestore(adminApp);
             adminStorageInstance = getStorage(adminApp);
        }
        return;
    }

    const serviceAccountKey = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccountKey.projectId && serviceAccountKey.clientEmail && serviceAccountKey.privateKey) {
        try {
            adminApp = initializeApp({
                credential: cert(serviceAccountKey),
                storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            }, 'admin');
            adminDbInstance = getFirestore(adminApp);
            adminStorageInstance = getStorage(adminApp);
            console.log("✅ Firebase Admin SDK initialisé avec succès.");
        } catch (error) {
            console.error("🔥 Erreur lors de l'initialisation de Firebase Admin SDK :", error);
        }
    } else {
        console.warn("⚠️ Variables d'environnement pour Firebase Admin (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) sont manquantes. Le SDK Admin n'est pas initialisé.");
    }
}

// Initialiser au chargement du module
initializeAdminApp();

// Exporter les instances potentiellement nulles
export const adminDb = adminDbInstance;
export const adminStorage = adminStorageInstance;
