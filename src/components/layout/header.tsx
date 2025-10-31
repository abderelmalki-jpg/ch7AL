
'use client'

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { useUser } from "@/firebase";

export function Header() {
  const { user, isUserLoading } = useUser();
  
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const names = name.split(' ');
      if (names.length > 1) {
        return (names[0][0] + (names[names.length-1][0] || '')).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '...';
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="w-10"></div> {/* Spacer to balance the layout */}
        <Link href="/dashboard" className="flex justify-center">
          <Logo className="h-16 w-16" />
        </Link>
        <Link href="/profile">
          <Avatar className="h-9 w-9 border-2 border-primary">
            {!isUserLoading && user && (
              <AvatarImage
                src={user.photoURL || undefined}
                alt={user.displayName || "User Avatar"}
              />
            )}
            <AvatarFallback>
                {getInitials(user?.displayName, user?.email)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
