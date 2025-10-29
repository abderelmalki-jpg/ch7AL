// IMPORTANT: This file is for server-side use only.
// It must NOT be imported into any client-side components.

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

const firebaseAdminConfig = {
  credential: undefined, // In many server environments (like Cloud Run), the SDK auto-detects credentials
  ...firebaseConfig,
};

function initializeAdminApp() {
  if (!getApps().length) {
    initializeApp(firebaseAdminConfig);
  }
  return getApp();
}

/**
 * Gets the server-side Firestore instance.
 * @returns The Firestore database object.
 */
export function getDb() {
  return getFirestore(initializeAdminApp());
}
