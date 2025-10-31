import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Configuration du projet Firebase à partir des variables d'environnement
const firebaseConfig = {
  projectId: "hanouti-6ce26",
  storageBucket: "hanouti-6ce26.appspot.com",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Remplace les caractères d'échappement '\n' par de vrais sauts de ligne
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"), 
};

let app: App;

// Initialisation unique du SDK Admin
if (!getApps().length) {
  try {
    // Vérification que les identifiants du compte de service sont bien présents
    if (firebaseConfig.privateKey && firebaseConfig.clientEmail) {
      app = initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log("✅ Firebase Admin initialisé avec un compte de service.");
    } else {
      // Si les identifiants manquent, on lance une erreur claire.
      throw new Error("Les variables d'environnement FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY sont requises.");
    }
  } catch (err) {
    console.error("🔥 Erreur lors de l’initialisation de Firebase Admin SDK :", err);
    // En cas d'échec, on assigne un objet vide pour éviter d'autres erreurs
    app = {} as App; 
  }
} else {
  // Si l'app est déjà initialisée, on la récupère
  app = getApps()[0];
}

// --- Export de Firestore & Storage ---
let adminDb;
let adminStorage;

try {
  // On tente d'obtenir les instances de service uniquement si l'initialisation a réussi
  adminDb = getFirestore(app);
} catch (err) {
  console.error("🔥 Impossible d’initialiser Firestore Admin :", err);
  adminDb = null;
}

try {
  adminStorage = getStorage(app);
} catch (err) {
  console.error("🔥 Impossible d’initialiser Storage Admin :", err);
  adminStorage = null;
}

export { adminDb, adminStorage };
