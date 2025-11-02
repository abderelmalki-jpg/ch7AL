
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendSignInLinkToEmail
} from 'firebase/auth';

const actionCodeSettings = {
  url: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth` : 'http://localhost:9002/auth',
  handleCodeInApp: true,
};

/** Initiate email/password sign-up */
export async function handleEmailSignUp(authInstance: Auth, username: string, email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName: username });
  }
  return userCredential;
}

/** Initiate email/password sign-in */
export async function handleEmailSignIn(authInstance: Auth, email: string, password: string) {
  return signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate magic link sign-in */
export async function handleMagicLinkSignIn(authInstance: Auth, email: string) {
    await sendSignInLinkToEmail(authInstance, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
}
