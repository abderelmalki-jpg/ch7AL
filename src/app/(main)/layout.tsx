'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { useUser } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

const PROTECTED_ROUTES = ['/profile', '/add-product', '/scanner', '/dashboard'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && PROTECTED_ROUTES.includes(pathname)) {
      router.replace('/auth');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading && PROTECTED_ROUTES.includes(pathname)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user && PROTECTED_ROUTES.includes(pathname)) {
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
