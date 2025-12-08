
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/add-product', '/dashboard', '/leaderboard', '/map', '/search', '/settings'];
const AUTH_ROUTE = '/auth';
const LANDING_PAGE = '/';

const NO_NAV_ROUTES = ['/add-product'];

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
      return; // Wait until user status is resolved
    }

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    const isAuthPage = pathname === AUTH_ROUTE;
    const isLandingPage = pathname === LANDING_PAGE;

    if (!user && isProtectedRoute) {
      router.replace(AUTH_ROUTE);
    } else if (user && (isAuthPage || isLandingPage)) {
      router.replace('/dashboard');
    }

  }, [user, isUserLoading, router, pathname]);
  
  const showBottomNav = !NO_NAV_ROUTES.some(route => pathname.startsWith(route));
  const isAuthOrLandingPage = pathname === AUTH_ROUTE || pathname === LANDING_PAGE;

  if (isUserLoading && (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || isLandingPage)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && (isAuthOrLandingPage || pathname === '/')) {
    return <main>{children}</main>;
  }

  // This prevents a flash of protected content while redirecting
  if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }
  
  return (
    <div className="relative flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">
            <Suspense>
                {children}
            </Suspense>
        </main>
        {showBottomNav && <BottomNav />}
    </div>
  );
}
