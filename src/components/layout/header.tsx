
'use client'

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/firebase";
import { Button } from "../ui/button";
import { User, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";


const navItems = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/search", label: "Recherche" },
  { href: "/leaderboard", label: "Classement" },
];

export function Header() {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  
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
      <div className="flex items-center gap-6">
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
        <nav className="flex items-center gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
          <Link href="/add-product" passHref>
             <Button>
               <PlusCircle className="mr-2 h-4 w-4" />
               Ajouter un prix
             </Button>
           </Link>
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
