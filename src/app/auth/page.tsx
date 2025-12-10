
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from "./auth-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useAuth, useFirestore } from '@/firebase';
import { isSignInWithEmailLink, signInWithEmailLink, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Cette adresse email est invalide.';
        case 'auth/user-not-found':
             return 'Aucun compte n\'est associé à cet email.';
        case 'auth/invalid-action-code':
            return 'Le lien de connexion est invalide ou a expiré. Veuillez en demander un nouveau.';
        default:
            return 'Une erreur est survenue. Veuillez réessayer.';
    }
}

export default function AuthPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isHandlingRedirect, setIsHandlingRedirect] = useState(true);

  const createUserProfile = async (user: User) => {
      if (!firestore) return;
      const userProfileRef = doc(firestore, 'users', user.uid);
      const userProfileSnap = await getDoc(userProfileRef);

      if (!userProfileSnap.exists()) {
        const newProfile = {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          points: 0,
          badges: [],
          contributions: 0,
          language: 'fr',
        };
        await setDoc(userProfileRef, newProfile, { merge: true });
      }
  }

  useEffect(() => {
    let isMounted = true; 
    if (auth && firestore && typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      setIsHandlingRedirect(true);
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Veuillez fournir votre email pour confirmation');
      }

      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            if (!isMounted) return;
            window.localStorage.removeItem('emailForSignIn');
            await createUserProfile(result.user);
            toast({ title: 'Connexion réussie !' });
            router.replace('/dashboard');
          })
          .catch((error) => {
            if (!isMounted) return;
            console.error("Erreur de connexion via lien:", error);
            const errorMessage = getFirebaseErrorMessage(error.code);
            toast({ variant: 'destructive', title: 'Erreur de connexion', description: errorMessage });
            setIsHandlingRedirect(false);
          });
      } else {
        setIsHandlingRedirect(false);
      }
    } else {
        setIsHandlingRedirect(false);
    }
    
    return () => { isMounted = false; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, firestore]);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard');
    }
  }, [isUserLoading, user, router]);


  if (isUserLoading || isHandlingRedirect) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Vérification...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        <Card className="shadow-lg rounded-xl">
            <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-center">Bienvenue !</CardTitle>
                <CardDescription>Connectez-vous pour continuer</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
