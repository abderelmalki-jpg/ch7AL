
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/layout/landing-header';

export default function LandingPage() {

  const videoUrl = "https://res.cloudinary.com/dhjwimevi/video/upload/v1764326857/grok-video-ac00e8b7-74a3-4043-bcf7-9673f81dcf59_1_vewvrz.mp4";

  return (
    <div className="relative min-h-screen w-full bg-background">
      
      {/* --- Section principale avec la vidéo --- */}
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black p-4">
          {/* Arrière-plan vidéo */}
          <video
              key={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute top-0 left-0 w-full h-full object-cover z-0"
          >
              <source
              src={videoUrl}
              type="video/mp4"
              />
              Votre navigateur ne supporte pas la vidéo.
          </video>
          
          {/* Superposition de dégradé pour la lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30 z-10" />

          {/* En-tête pour la version ordinateur */}
          <div className="hidden md:block absolute top-0 left-0 w-full z-20">
            <LandingHeader />
          </div>

          {/* Contenu centré */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center p-4 sm:p-8">
              <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
                  Ch7al
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl lg:text-2xl text-white drop-shadow-md">
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
      </div>
    </div>
  );
}
