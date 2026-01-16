
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, KeyRound, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  handleEmailSignUp,
  handleEmailSignIn,
  handleSendSignInLink,
} from "@/firebase/non-blocking-login";

const getFirebaseErrorMessage = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Cette adresse email est invalide.';
    case 'auth/user-not-found':
      return 'Aucun compte n\'est associé à cet email.';
    case 'auth/wrong-password':
      return 'Le mot de passe est incorrect.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée par un autre compte.';
    case 'auth/operation-not-allowed':
      return "Ce mode de connexion n'est pas activé. Veuillez contacter l'administrateur.";
    default:
      return 'Une erreur est survenue. Veuillez réessayer.';
  }
};

type AuthMode = 'signin' | 'signup' | 'passwordless';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isPending, startTransition] = useTransition();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  const auth = useAuth();
  const { toast } = useToast();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    startTransition(async () => {
      try {
        if (authMode === 'signup') {
          await handleEmailSignUp(auth, username, email, password);
          toast({ title: 'Inscription réussie !', description: 'Bienvenue ! Vous êtes maintenant connecté.' });
        } else {
          await handleEmailSignIn(auth, email, password);
          toast({ title: 'Connexion réussie !' });
        }
        // La redirection sera gérée par le layout principal
      } catch (error: any) {
        console.error("Auth Error:", error, error.code);
        const errorMessage = getFirebaseErrorMessage(error.code);
        toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
      }
    });
  };

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    startTransition(async () => {
      try {
        await handleSendSignInLink(auth, email);
        toast({ title: 'Lien de connexion envoyé', description: 'Consultez votre boîte mail pour vous connecter.' });
      } catch (error: any) {
        console.error("Auth Error:", error, error.code);
        const errorMessage = getFirebaseErrorMessage(error.code);
        toast({ variant: 'destructive', title: 'Erreur', description: errorMessage });
      }
    });
  }

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
  }

  const renderPasswordForm = () => (
    <form className="space-y-4" onSubmit={handleAuthAction}>
      {authMode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="username" type="text" placeholder="Votre nom" required value={username} onChange={e => setUsername(e.target.value)} disabled={isPending} className="pl-9" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="email@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isPending} className="pl-9" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} disabled={isPending} className="pl-9" />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending || !auth}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {authMode === 'signin' ? 'Se connecter' : 'Créer un compte'}
      </Button>
    </form>
  );

  const renderPasswordlessForm = () => (
    <form className="space-y-4" onSubmit={sendLink}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="email" type="email" placeholder="email@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isPending} className="pl-9" />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isPending || !auth}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Envoyer le lien de connexion
      </Button>
    </form>
  )

  return (
    <div>
      <div className="flex bg-muted p-1 rounded-lg mb-4">
        <button 
            onClick={() => { setAuthMode('signin'); resetForm(); }}
            className={cn("flex-1 p-2 rounded-md text-sm font-medium", authMode === 'signin' && "bg-background shadow-sm")}>
            Se connecter
        </button>
        <button 
            onClick={() => { setAuthMode('signup'); resetForm(); }}
            className={cn("flex-1 p-2 rounded-md text-sm font-medium", authMode === 'signup' && "bg-background shadow-sm")}>
            S'inscrire
        </button>
      </div>

      {authMode === 'passwordless' ? renderPasswordlessForm() : renderPasswordForm()}

      <div className="mt-4 text-center text-sm">
        <button onClick={() => setAuthMode(authMode === 'passwordless' ? 'signin' : 'passwordless')} className="underline">
          {authMode === 'passwordless' ? 'Se connecter avec un mot de passe' : 'Se connecter avec un lien magique'}
        </button>
      </div>
    </div>
  );
}
