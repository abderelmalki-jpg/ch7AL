import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app: App;
const storageBucket = 'hanouti-6ce26.appspot.com';

if (!getApps().length) {
  try {
    // Attempt to initialize with Application Default Credentials (ADC)
    // This works in Cloud Run, Cloud Functions, GKE, etc.
    app = initializeApp({
        storageBucket,
    });
  } catch (e) {
    // If ADC fails (e.g., local dev without gcloud auth), fall back to service account if available
    if (process.env.FIREBASE_PRIVATE_KEY) {
        app = initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
            storageBucket,
        });
    } else {
        console.error("🔴 Firebase Admin SDK initialization failed. Neither Application Default Credentials nor a service account key were found.");
        // We don't throw here to allow the app to build, but server-side Firebase calls will fail.
        // Create a placeholder app to avoid crashing the server on import
        app = {} as App; 
    }
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
