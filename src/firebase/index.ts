'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  // In a production environment (like Firebase App Hosting),
  // FIREBASE_CONFIG is automatically provided.
  const firebaseConfigEnv = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (firebaseConfigEnv) {
    try {
      const config = JSON.parse(firebaseConfigEnv);
      const firebaseApp = initializeApp(config);
      return getSdks(firebaseApp);
    } catch (e) {
      console.error("Failed to parse FIREBASE_CONFIG, falling back to individual vars", e);
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

  if (localFirebaseConfig.apiKey) {
    const firebaseApp = initializeApp(localFirebaseConfig);
    return getSdks(firebaseApp);
  }

  // Final attempt for environments like Cloud Build where `initializeApp()`
  // might work without arguments.
  try {
    const firebaseApp = initializeApp();
    return getSdks(firebaseApp);
  } catch (e) {
      console.error("Firebase initialization failed. Ensure Firebase environment variables are set.", e);
      // Return null objects if initialization fails completely
      return { firebaseApp: null, auth: null, firestore: null };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
