
// IMPORTANT: This file is for server-side use only.
// It must NOT be imported into any client-side components.

import { initializeApp, getApps, getApp, type FirebaseOptions, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';
import { firebaseConfig } from './config';

let adminApp: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

function initializeAdminSDK() {
    if (getApps().some(app => app.name === 'admin-sdk')) {
        adminApp = getApp('admin-sdk');
    } else {
        // In a real Google Cloud environment, service account credentials would be automatically discovered.
        // For local development with Studio, we must provide some config.
        // We can reuse the client-side config's project ID.
        try {
            adminApp = initializeApp({
                projectId: firebaseConfig.projectId,
                storageBucket: `${firebaseConfig.projectId}.appspot.com`,
            }, 'admin-sdk');
        } catch (error) {
            console.error("Failed to initialize Firebase Admin SDK:", error);
            // Don't throw here, let getDb/getStorage handle the uninitialized state.
            return;
        }
    }
    
    if (adminApp) {
        db = getFirestore(adminApp);
        storage = getStorage(adminApp);
    }
}

// Initialize on module load
initializeAdminSDK();

/**
 * Gets the server-side Firestore instance.
 * @returns The Firestore database object.
 */
export function getDb(): Firestore {
  if (!db) {
    // Attempt to re-initialize if it failed on first load
    initializeAdminSDK();
    if (!db) {
        throw new Error("Firebase Admin SDK not initialized. Check server logs for initialization errors.");
    }
  }
  return db;
}

/**
 * Gets the server-side Storage instance.
 * @returns The Storage object.
 */
export function getStorageAdmin(): Storage {
    if (!storage) {
       // Attempt to re-initialize if it failed on first load
        initializeAdminSDK();
        if (!storage) {
            throw new Error("Firebase Admin SDK not initialized. Check server logs for initialization errors.");
        }
    }
    return storage;
}
