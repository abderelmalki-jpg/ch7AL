'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from "./auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-primary/80 to-primary">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-primary/80 to-primary">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-4">
            <Logo className="h-24 w-24" />
        </div>
        <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Bienvenue sur Souk Price</CardTitle>
                <CardDescription>Trouvez les meilleurs prix près de chez vous</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
