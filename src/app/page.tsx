
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useUser } from '@/firebase/provider';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);


  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute z-0 min-h-full w-auto min-w-full max-w-none"
      >
        <source
          src="https://res.cloudinary.com/dhjwimevi/video/upload/v1761429194/Design_sans_titre_4_witvsw.mp4"
          type="video/mp4"
        />
        Votre navigateur ne supporte pas la vidéo.
      </video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="relative z-20 flex flex-col items-center text-center text-white px-4">
        <Logo className="h-28 w-28 mb-4" />
        <h1 className="font-headline text-5xl md:text-6xl font-bold">
          Souk Price
        </h1>
        <p className="mt-4 max-w-xl text-lg md:text-xl text-white/80">
          Comparez les prix. Économisez de l'argent. Partagez avec la communauté.
          Le pouvoir est entre vos mains.
        </p>
        <Link href="/auth" className="mt-8">
          <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90">
            Commencer
          </Button>
        </Link>
      </div>
    </div>
  );
}
