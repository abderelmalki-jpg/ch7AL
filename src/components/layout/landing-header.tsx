
'use client';

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "../ui/button";

export function LandingHeader() {
  return (
    <header className="absolute top-0 left-0 w-full z-20 bg-transparent">
        <div className="container mx-auto flex h-20 items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-16 w-16" />
                <span className="text-2xl font-bold text-white drop-shadow-md">Ch7al</span>
            </Link>
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="secondary" size="lg">
                        Commencer
                    </Button>
                </Link>
            </div>
        </div>
    </header>
  );
}
