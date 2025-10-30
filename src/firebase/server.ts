import { initializeApp, cert, getApps, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app: App;
// Définir le nom du bucket ici pour l'utiliser dans la configuration
const storageBucket = 'hanouti-6ce26.appspot.com';

if (!getApps().length) {
  try {
    // Tenter d'initialiser avec les identifiants par défaut de l'application (ADC)
    // Cela fonctionne dans Cloud Run, Cloud Functions, GKE, etc.
    // Assurez-vous d'inclure le storageBucket ici.
    app = initializeApp({
        storageBucket,
    });
  } catch (e) {
    // Si ADC échoue (par exemple, dev local sans gcloud auth), se rabattre sur le compte de service si disponible
    if (process.env.FIREBASE_PRIVATE_KEY) {
        app = initializeApp({
            credential: cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            }),
            // Inclure le storageBucket également ici
            storageBucket,
        });
    } else {
        console.error("🔴 Firebase Admin SDK initialization failed. Neither Application Default Credentials nor a service account key were found.");
        // Nous ne levons pas d'erreur ici pour permettre à l'application de se construire, mais les appels Firebase côté serveur échoueront.
        // Créer une application de remplacement pour éviter de faire planter le serveur à l'importation
        app = {} as App; 
    }
  }
} else {
  app = getApps()[0];
}

// Exporter les services initialisés
// Utiliser des blocs try-catch pour éviter les crashs si l'initialisation a échoué
let adminDb;
let adminStorage;

try {
    adminDb = getFirestore(app);
} catch (e) {
    console.error("🔥 Failed to initialize Firestore Admin:", e);
    // @ts-ignore
    adminDb = null;
}

try {
    adminStorage = getStorage(app);
} catch (e) {
    console.error("🔥 Failed to initialize Storage Admin:", e);
    // @ts-ignore
    adminStorage = null;
}


export { adminDb, adminStorage };
