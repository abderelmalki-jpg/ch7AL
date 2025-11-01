
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/firebase/provider";
import { sendSignInLinkToEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Cette adresse email est invalide.';
        case 'auth/missing-continue-uri':
             return 'Une URL de redirection doit être fournie.';
        default:
            return 'Une erreur est survenue. Veuillez réessayer.';
    }
}

const actionCodeSettings = {
  // L'URL doit être celle de votre page d'authentification
  url: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/auth` : 'http://localhost:9002/auth',
  handleCodeInApp: true,
};


export function AuthForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);
  
  const auth = useAuth();
  const { toast } = useToast();
  
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) return;

    setIsLoading(true);
    setIsLinkSent(false);

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setIsLinkSent(true);
        toast({
            title: 'Lien envoyé !',
            description: `Un lien de connexion a été envoyé à ${email}.`,
        });
    } catch (error: any) {
        console.error("Auth Error:", error, error.code);
        const errorMessage = getFirebaseErrorMessage(error.code);
        toast({ variant: 'destructive', title: 'Erreur d\'envoi', description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }

  if (isLinkSent) {
    return (
        <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800">Vérifiez votre boîte mail</h3>
            <p className="text-green-700 mt-2">
                Nous avons envoyé un lien de connexion magique à <strong className="font-bold">{email}</strong>.
            </p>
        </div>
    )
  }

  return (
    <div>
      <form className="space-y-4" onSubmit={handleAuthAction}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="email@example.com" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            disabled={isLoading} 
          />
        </div>
        
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || !auth || !email}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer le lien de connexion
        </Button>
      </form>
    </div>
  );
}
