

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUser } from '@/firebase';
import { Loader2, PlusCircle, Search, Trophy, User as UserIcon, Home, Map } from 'lucide-react';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Link from 'next/link';

const PROTECTED_ROUTES = ['/profile', '/add-product', '/dashboard', '/leaderboard', '/map', '/search', '/settings'];
const AUTH_ROUTE = '/auth';
const LANDING_PAGE = '/';

const NO_NAV_ROUTES = ['/add-product'];

const mainNav = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/search", label: "Rechercher", icon: Search },
    { href: "/add-product", label: "Ajouter un prix", icon: PlusCircle },
    { href: "/map", label: "Carte", icon: Map },
    { href: "/leaderboard", label: "Classement", icon: Trophy },
];

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
    <SidebarProvider>
        <div className="relative flex min-h-screen w-full flex-col md:flex-row">
            <Sidebar>
                <Header />
                 <SidebarMenu>
                    {mainNav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <SidebarMenuItem key={item.href}>
                                <Link href={item.href}>
                                    <SidebarMenuButton isActive={isActive} >
                                        <item.icon />
                                        {item.label}
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </Sidebar>

            <SidebarInset>
                 <main className="flex-1 pb-20 md:pb-0">
                    <Suspense>
                        {children}
                    </Suspense>
                </main>
            </SidebarInset>
            
            <BottomNav />
        </div>
    </SidebarProvider>
  );
}
