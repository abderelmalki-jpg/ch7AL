
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { LandingHeader } from '@/components/layout/landing-header';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const soukHeroImage = PlaceHolderImages.find(img => img.id === 'souk-hero');

  return (
    <div className="relative min-h-screen w-full bg-background">
      
      {/* Mobile View: Video Hero */}
      <div className="md:hidden relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-4">
        <div className="relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden bg-black">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
            >
                <source
                src="https://res.cloudinary.com/dhjwimevi/video/upload/v1761429194/Design_sans_titre_4_witvsw.mp4"
                type="video/mp4"
                />
                Votre navigateur ne supporte pas la vidéo.
            </video>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                 <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <Logo className="h-24 w-24" />
                    </div>
                    <p className="mt-4 max-w-xl mx-auto text-lg md:text-xl text-white drop-shadow-md">
                        Comparer - Partager - Récompenser
                    </p>
                    <div className="mt-8">
                      <Link href="/dashboard">
                        <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                          Commencer
                        </Button>
                      </Link>
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Desktop View: Image Hero */}
      <div className="hidden md:flex flex-col min-h-screen">
        <LandingHeader />
        <main className="flex-1 flex flex-col">
          <section className="relative flex-1 flex items-center justify-center text-center text-white">
            {soukHeroImage && (
                <Image
                    src={soukHeroImage.imageUrl}
                    alt={soukHeroImage.description}
                    data-ai-hint={soukHeroImage.imageHint}
                    fill
                    className="object-cover"
                    priority
                />
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 p-8">
              <div className="flex justify-center mb-4">
                <Logo className="h-32 w-32" />
              </div>
              <p className="mt-4 max-w-2xl mx-auto text-xl lg:text-2xl text-white/90 drop-shadow-md">
                Comparer - Partager - Récompenser
              </p>
              <div className="mt-8">
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                    Commencer l'aventure
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
