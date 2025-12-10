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
    <header className="hidden md:flex h-16 items-center justify-between px-4 container mx-auto border-b">
      <Link href="/dashboard">
        <div className="w-24 h-12">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            >
              <source
                src="https://res.cloudinary.com/dhjwimevi/video/upload/v1764326857/grok-video-ac00e8b7-74a3-4043-bcf7-9673f81dcf59_1_vewvrz.mp4"
                type="video/mp4"
              />
            </video>
        </div>
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
    </header>
  );
}
