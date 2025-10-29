
// IMPORTANT: This file is for server-side use only.
// It must NOT be imported into any client-side components.

import { initializeApp, getApps, getApp, type FirebaseOptions, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

let adminApp: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

// Only initialize if the admin SDK config is present
if (process.env.FIREBASE_ADMIN_SDK_CONFIG) {
    const firebaseAdminConfig = {
        credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG as string)),
        storageBucket: 'hanouti-6ce26.appspot.com',
    };

    if (getApps().length === 0) {
        adminApp = initializeApp(firebaseAdminConfig);
    } else {
        adminApp = getApp();
    }
    
    if (adminApp) {
        db = getFirestore(adminApp);
        storage = getStorage(adminApp);
    }
}


/**
 * Gets the server-side Firestore instance.
 * @returns The Firestore database object.
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
  }
  return db;
}

/**
 * Gets the server-side Storage instance.
 * @returns The Storage object.
 */
export function getStorageAdmin(): Storage {
    if (!storage) {
        throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    }
    return storage;
}
