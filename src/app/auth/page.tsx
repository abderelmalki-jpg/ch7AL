
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from "./auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useAuth, useFirestore } from '@/firebase';
import { getRedirectResult, User, doc, getDoc, setDoc, serverTimestamp } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email ou mot de passe incorrect.';
        case 'auth/invalid-email':
            return 'Cette adresse email est invalide.';
        case 'auth/email-already-in-use':
            return 'Cette adresse email est déjà utilisée par un autre compte.';
        case 'auth/weak-password':
            return 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
        case 'auth/popup-closed-by-user':
             return "Le processus de connexion a été annulé.";
        case 'auth/unauthorized-domain':
             return 'Le domaine n\'est pas autorisé pour l\'authentification. Veuillez vérifier votre configuration Firebase.';
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
    // Si l'utilisateur est déjà connecté, on le redirige directement
    if (!isUserLoading && user) {
      router.replace('/dashboard');
      return;
    }

    // Sinon, on vérifie s'il y a un résultat de redirection Google
    if (auth) {
        getRedirectResult(auth)
            .then(async (result) => {
                if (result) {
                    // L'utilisateur s'est connecté via la redirection Google
                    await createUserProfile(result.user);
                    toast({ title: 'Connexion réussie avec Google !' });
                    router.replace('/dashboard');
                } else {
                    // Pas de redirection, l'utilisateur est sur la page normalement
                    setIsHandlingRedirect(false);
                }
            })
            .catch((error) => {
                console.error("Erreur de redirection Google:", error);
                const errorMessage = getFirebaseErrorMessage(error.code);
                toast({
                    variant: 'destructive',
                    title: 'Erreur de connexion',
                    description: errorMessage
                });
                setIsHandlingRedirect(false);
            });
    }

  }, [user, isUserLoading, router, auth, toast, firestore]);

  // Affiche un loader tant que Firebase vérifie l'état d'authentification
  // ou qu'on gère une potentielle redirection
  if (isUserLoading || isHandlingRedirect || (!isUserLoading && !isHandlingRedirect && user)) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-primary/80 to-primary">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  // Si on a fini de vérifier et qu'il n'y a pas d'utilisateur, on affiche le formulaire
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-primary/80 to-primary">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
            <Logo className="h-24 w-24" />
        </div>
        <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Rejoignez la communauté</CardTitle>
                <CardDescription>Créez un compte ou connectez-vous</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    