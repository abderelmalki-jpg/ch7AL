
// IMPORTANT: This file is for server-side use only.
// It must NOT be imported into any client-side components.

import { initializeApp, getApps, getApp, type FirebaseOptions, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

const firebaseAdminConfig = {
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG as string)),
    storageBucket: 'hanouti-6ce26.appspot.com',
};

let adminApp;

if (getApps().length === 0) {
    adminApp = initializeApp(firebaseAdminConfig);
} else {
    adminApp = getApp();
}

const db = getFirestore(adminApp);
const storage = getStorage(adminApp);

/**
 * Gets the server-side Firestore instance.
 * @returns The Firestore database object.
 */
export function getDb() {
  return db;
}

/**
 * Gets the server-side Storage instance.
 * @returns The Storage object.
 */
export function getStorageAdmin() {
    return storage;
}
