
import { HomeClient } from "../home-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { recentContributions } from "@/lib/data";
import { Map, Search, PlusCircle } from "lucide-react";
import { MapClient } from "../map/map-client";
import { ContributionCard } from "./contribution-card";

const storesFromContributions = recentContributions.map((c, i) => ({
  id: Number(c.id),
  name: c.storeName,
  position: { lat: c.latitude, lng: c.longitude },
}));

export default function DashboardPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 space-y-8">
      
      {/* Header and Quick Actions */}
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold mb-2">
          <HomeClient />
        </h1>
        <p className="text-muted-foreground mb-6">Que voulez-vous faire aujourd'hui ?</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="h-14 text-lg">
            <Link href="/search">
              <Search className="mr-2 h-5 w-5" />
              Rechercher un prix
            </Link>
          </Button>
           <Button asChild size="lg" className="h-14 text-lg bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/add-product">
                <PlusCircle className="mr-2 h-5 w-5" />
                Contribuer un prix
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Contributions */}
      <div>
        <h2 className="text-2xl font-headline font-bold text-foreground mb-4 text-center">
          Derniers ajouts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentContributions.map((contribution) => (
            <ContributionCard key={contribution.id} contribution={contribution} apiKey={apiKey} />
          ))}
        </div>
      </div>

      {/* Map of recent stores */}
      <div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4 flex items-center gap-2">
            <Map className="h-6 w-6 text-primary"/>
            Derniers magasins répertoriés
          </h2>
          <Card>
              <CardContent className="p-0">
                  <div className="h-[400px] w-full rounded-lg overflow-hidden">
                    {apiKey ? (
                        <MapClient apiKey={apiKey} stores={storesFromContributions} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted/20">
                            <div className="text-center text-muted-foreground p-4">
                                <p className="font-bold">Carte non disponible</p>
                                <p className="text-sm">Veuillez fournir une clé API Google Maps dans votre fichier `.env` pour afficher la carte.</p>
                            </div>
                        </div>
                    )}
                  </div>
              </CardContent>
          </Card>
      </div>

    </div>
  );
}
