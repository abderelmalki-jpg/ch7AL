'use client';

import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// A type guard to check if the config has all necessary properties.
function isValidFirebaseConfig(config: any): config is FirebaseOptions {
    return config &&
        typeof config.apiKey === 'string' &&
        typeof config.authDomain === 'string' &&
        typeof config.projectId === 'string' &&
        typeof config.storageBucket === 'string' &&
        typeof config.messagingSenderId === 'string' &&
        typeof config.appId === 'string';
}

function getSdks(firebaseApp: FirebaseApp): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp | null; auth: Auth | null; firestore: Firestore | null } {
  if (getApps().length) {
    const app = getApp();
    return getSdks(app);
  }

  // First, try to use the comprehensive NEXT_PUBLIC_FIREBASE_CONFIG
  const firebaseConfigEnv = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (firebaseConfigEnv) {
    try {
      const config = JSON.parse(firebaseConfigEnv);
      if (isValidFirebaseConfig(config)) {
        const firebaseApp = initializeApp(config);
        return getSdks(firebaseApp);
      }
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG, falling back to individual vars", e);
    }
  }

  // Fallback for local development using individual .env variables
  const localFirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (isValidFirebaseConfig(localFirebaseConfig)) {
    const firebaseApp = initializeApp(localFirebaseConfig);
    return getSdks(firebaseApp);
  }

  console.error("Firebase initialization failed: No valid configuration found. Ensure Firebase environment variables are set correctly.");
  // Return null objects if initialization fails completely
  return { firebaseApp: null, auth: null, firestore: null };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
