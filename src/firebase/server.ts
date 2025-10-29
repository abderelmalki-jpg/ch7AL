// IMPORTANT: This file is for server-side use only.
// It must NOT be imported into any client-side components.

import { initializeApp, getApps, getApp, type FirebaseOptions, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

let adminApp;

if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Production on GCP (e.g., Cloud Run) with service account key
    const serviceAccount = JSON.parse(
        Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString('utf-8')
    );
    adminApp = getApps().length > 0
        ? getApp()
        : initializeApp({
            credential: cert(serviceAccount),
            storageBucket: firebaseConfig.storageBucket,
        });
} else {
    // Development or environments without GOOGLE_APPLICATION_CREDENTIALS
    // The Admin SDK will automatically detect credentials in many server environments.
     adminApp = getApps().length > 0
        ? getApp()
        : initializeApp({
            storageBucket: firebaseConfig.storageBucket,
        });
}


/**
 * Gets the server-side Firestore instance.
 * @returns The Firestore database object.
 */
export function getDb() {
  return getFirestore(adminApp);
}

/**
 * Gets the server-side Storage instance.
 * @returns The Storage object.
 */
export function getStorage() {
    return getStorage(adminApp);
}
