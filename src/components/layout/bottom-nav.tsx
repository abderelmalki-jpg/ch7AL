"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Camera, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/search", label: "Recherche", icon: Search },
  { href: "/scanner", label: "Analyser", icon: Camera, isCentral: true },
  { href: "/map", label: "Carte", icon: MapPin },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-card/95 backdrop-blur-sm md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          if (item.isCentral) {
            return (
              <div key={item.href} className="relative -top-6">
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-16 w-16 flex-col items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform active:scale-95",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                >
                  <item.icon className="h-7 w-7" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors",
                isActive ? "text-primary" : "hover:text-primary"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
