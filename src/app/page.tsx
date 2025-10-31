
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-accent p-4 sm:p-8">
      
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Video Player in a rounded container */}
        <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden mb-8 bg-black">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
            >
                <source
                src="https://res.cloudinary.com/dhjwimevi/video/upload/v1761429194/Design_sans_titre_4_witvsw.mp4"
                type="video/mp4"
                />
                Votre navigateur ne supporte pas la vidéo.
            </video>
        </div>

        {/* Content below the video */}
        <div className="relative z-20 flex flex-col items-center text-center">
          <h1 className="font-headline text-5xl md:text-6xl font-bold drop-shadow-md text-orange-500">
            Hanouti
          </h1>
          <p className="mt-4 max-w-xl text-lg md:text-xl text-white drop-shadow-sm">
            Comparez les prix. Économisez de l'argent. Partagez avec la communauté.
            Le pouvoir est entre vos mains.
          </p>
          <Link href="/auth" className="mt-8">
            <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              Commencer
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
