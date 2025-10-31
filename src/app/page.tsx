
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-accent p-4 sm:p-8">
      
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
            
            {/* Overlay for text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-t from-black/60 to-transparent">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                     <h1 className="font-headline text-5xl md:text-7xl font-bold text-accent drop-shadow-lg">
                        Hanouti
                    </h1>
                    <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-white drop-shadow-md">
                        Comparez. Économisez. Partagez avec la communauté.
                    </p>
                 </div>
            </div>
        </div>

        {/* Content below the video */}
        <div className="relative z-10 mt-8 flex flex-col items-center text-center">
          <Link href="/auth">
            <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
              Commencer
            </Button>
          </Link>
        </div>
      </div>

    </div>
  );
}
