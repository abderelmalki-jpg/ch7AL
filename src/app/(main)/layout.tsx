
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/add-product', '/scanner', '/dashboard', '/leaderboard', '/map', '/search', '/settings'];
const AUTH_ROUTE = '/auth';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Ne rien faire tant que l'état d'authentification est en cours de chargement
    }

    const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
    const isAuthPage = pathname === AUTH_ROUTE;

    if (!user && isProtectedRoute) {
      // Si l'utilisateur n'est pas connecté et tente d'accéder à une page protégée,
      // le rediriger vers la page de connexion.
      router.replace(AUTH_ROUTE);
    } else if (user && isAuthPage) {
      // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion,
      // le rediriger vers le tableau de bord.
      router.replace('/dashboard');
    }

  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading && PROTECTED_ROUTES.includes(pathname)) {
    // Afficher un loader pour les routes protégées pendant la vérification de l'utilisateur
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && PROTECTED_ROUTES.includes(pathname)) {
      // Ne rien afficher (un loader est déjà affiché) pour éviter un flash de contenu
      // pendant que la redirection s'effectue.
      return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
