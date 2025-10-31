import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Configuration du projet Firebase à partir des variables d'environnement
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hanouti-6ce26",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hanouti-6ce26.appspot.com",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app: App;

// Initialisation unique du SDK Admin
if (!getApps().length) {
  try {
    // Vérification que les identifiants du compte de service sont bien présents
    if (firebaseConfig.clientEmail && firebaseConfig.privateKey) {
      app = initializeApp({
        credential: cert(firebaseConfig),
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log("✅ Firebase Admin initialisé avec un compte de service.");
    } else {
        console.warn("⚠️ Variables d'environnement pour Firebase Admin manquantes. L'initialisation est ignorée.");
        app = {} as App; // Crée un objet vide pour éviter les plantages
    }
  } catch (err) {
    console.error("🔥 Erreur lors de l’initialisation de Firebase Admin SDK :", err);
    app = {} as App; 
  }
} else {
  app = getApps()[0];
}

// --- Export de Firestore & Storage ---
let adminDb = null;
let adminStorage = null;

try {
  if (getApps().length) { // Tente d'obtenir les services uniquement si l'app est initialisée
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  }
} catch (err) {
  console.error("🔥 Impossible d’initialiser les services Admin Firebase :", err);
}

export { adminDb, adminStorage };
