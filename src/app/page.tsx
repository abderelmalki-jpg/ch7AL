'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Map, Camera } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#E9F8F3] text-gray-800">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white">
        <h1 className="text-6xl font-bold text-[#3CBC8D] font-['Belleza']">
          Ch7al
        </h1>
        <p className="mt-4 text-2xl font-['Alegreya']">
          Comparer. Partager. Économiser.
        </p>
        <p className="mt-2 max-w-2xl mx-auto text-lg text-gray-600 font-['Alegreya']">
          Votre guide communautaire pour trouver les meilleurs prix au Maroc.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button size="lg" className="h-14 text-lg bg-[#F2994A] hover:bg-[#F2994A]/90 text-white font-bold">
              Trouver les meilleurs prix
            </Button>
          </Link>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 px-4">
        <h2 className="text-4xl font-bold text-center text-[#3CBC8D] font-['Belleza'] mb-12">
          Comment ça marche ?
        </h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-[#3CBC8D] p-4 rounded-full">
                <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-['Belleza']">1. Cherchez un produit</h3>
            <p className="mt-2 text-gray-600 font-['Alegreya']">
              Utilisez notre recherche pour trouver n'importe quel produit.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#3CBC8D] p-4 rounded-full">
              <Map className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-['Belleza']">2. Comparez les prix</h3>
            <p className="mt-2 text-gray-600 font-['Alegreya']">
              Visualisez les prix soumis par la communauté autour de vous.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-[#3CBC8D] p-4 rounded-full">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-['Belleza']">3. Contribuez & Gagnez</h3>
            <p className="mt-2 text-gray-600 font-['Alegreya']">
              Ajoutez un prix pour gagner des points et aider les autres.
            </p>
          </div>
        </div>
      </section>

      {/* Join the Community Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[#3CBC8D] font-['Belleza']">
            Plus qu'une application, une communauté.
          </h2>
          <p className="mt-4 text-xl max-w-3xl mx-auto text-gray-600 font-['Alegreya']">
            Rejoignez des milliers de Marocains qui s'entraident chaque jour pour faire des achats plus intelligents. Ensemble, créons la plus grande base de données de prix au Maroc.
          </p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3CBC8D]">10,000+</p>
              <p className="text-gray-600 font-['Alegreya']">Produits référencés</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-[#3CBC8D]">5,000+</p>
              <p className="text-gray-600 font-['Alegreya']">Utilisateurs actifs</p>
            </div>
            <div className="p-4 col-span-2 md:col-span-1">
              <p className="text-4xl font-bold text-[#3CBC8D]">100s</p>
              <p className="text-gray-600 font-['Alegreya']">Prix ajoutés chaque jour</p>
            </div>
          </div>
        </div>
      </section>

        {/* Footer */}
        <footer className="bg-[#E9F8F3] py-8 px-4 text-center">
            <p className="text-gray-600 font-['Alegreya']">© 2024 Ch7al. Tous droits réservés.</p>
            <div className="mt-4 flex justify-center space-x-6">
                <Link href="/about" className="text-gray-600 hover:text-[#3CBC8D]">À propos</Link>
                <Link href="/contact" className="text-gray-600 hover:text-[#3CBC8D]">Contact</Link>
            </div>
        </footer>
    </div>
  );
}
