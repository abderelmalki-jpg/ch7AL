import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Configuration correcte de ton projet Firebase
const firebaseConfig = {
  projectId: "hanouti-6ce26",
  storageBucket: "hanouti-6ce26.appspot.com", // ✅ CORRECT : c’est le bon bucket Firebase Storage
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app: App;

// Initialisation unique du SDK Admin
if (!getApps().length) {
  try {
    if (firebaseConfig.privateKey && firebaseConfig.clientEmail) {
      // ✅ Mode service account (local ou manuel)
      app = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log("✅ Firebase Admin initialisé avec un compte de service");
    } else {
      // ✅ Mode Application Default Credentials (ex: Cloud Run, Workstations, etc.)
      app = initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log("✅ Firebase Admin initialisé avec ADC (Application Default Credentials)");
    }
  } catch (err) {
    console.error("🔥 Erreur lors de l’initialisation de Firebase Admin SDK :", err);
    app = {} as App;
  }
} else {
  app = getApps()[0];
}

// --- Export Firestore & Storage ---
let adminDb;
let adminStorage;

try {
  adminDb = getFirestore(app);
} catch (err) {
  console.error("🔥 Impossible d’initialiser Firestore Admin :", err);
  // @ts-ignore
  adminDb = null;
}

try {
  adminStorage = getStorage(app);
} catch (err) {
  console.error("🔥 Impossible d’initialiser Storage Admin :", err);
  // @ts-ignore
  adminStorage = null;
}

export { adminDb, adminStorage };