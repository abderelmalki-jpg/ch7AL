'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-accent p-4 sm:p-8">
      
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Video Player in a rounded container */}
        <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden bg-black">
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
            
            {/* Overlay for text and button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                 <div className="w-full">
                    <div className="flex justify-center mb-4">
                        <Logo className="h-24 w-24" />
                    </div>
                     <h1 className="font-headline text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
                        Ch3rel
                    </h1>
                    <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-white drop-shadow-md">
                        Comparez .Economisez . Partagez avec la communauté
                    </p>
                    <div className="mt-8">
                      <Link href="/auth">
                        <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                          Commencer
                        </Button>
                      </Link>
                    </div>
                 </div>
            </div>
        </div>

      </div>

    </div>
  );
}
