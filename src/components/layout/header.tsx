
'use client'

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { User } from "lucide-react";

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
    <div className="flex h-16 items-center justify-between p-2 container mx-auto">
      <Link href="/dashboard">
          <span className="font-bold text-xl">Ch7al</span>
      </Link>
      <div className="flex items-center gap-4">
          <Link href="/profile">
          <Avatar className="h-10 w-10 border-2 border-primary">
              {!isUserLoading && user && (
              <AvatarImage
                  src={user.photoURL || undefined}
                  alt={user.displayName || "User Avatar"}
              />
              )}
              <AvatarFallback className="bg-muted">
                  <User className="w-5 h-5"/>
              </AvatarFallback>
          </Avatar>
          </Link>
      </div>
    </div>
  );
}
