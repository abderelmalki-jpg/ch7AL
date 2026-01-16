
'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';


export default function FinishSignIn() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth && isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Veuillez fournir votre email pour la confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            toast({ title: 'Connexion réussie !' });
            router.push('/dashboard');
          })
          .catch((error) => {
            console.error("Sign in with email link error:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Le lien est invalide ou a expiré.' });
            setLoading(false);
          });
      }
    } else {
        setLoading(false);
    }
  }, [auth, router, toast]);

  return (
    <div className="flex justify-center items-center h-screen">
        {loading ? (
            <p>Veuillez patienter pendant que nous finalisons votre connexion...</p>
        ) : (
            <p>Ce lien n'est pas valide ou a déjà été utilisé. Veuillez réessayer de vous connecter.</p>
        )}
    </div>
  );
}
