
'use client';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const actionCodeSettings = {
  url: process.env.NEXT_PUBLIC_BASE_URL + '/finish-signin',
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


/** Send sign in link to email */
export async function handleSendSignInLink(authInstance: Auth, email: string) {
  return sendSignInLinkToEmail(authInstance, email, actionCodeSettings);
}
