
import { HomeClient } from "../home-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentContributions } from "@/lib/data";
import { format } from "date-fns";
import { Map, Search, PlusCircle } from "lucide-react";
import { MapClient } from "../map/map-client";

const storesFromContributions = recentContributions.map((c, i) => ({
  id: i + 1,
  name: c.storeName,
  // Dummy positions for now, should be replaced with real data
  position: { lat: 33.9716 - i * 0.001, lng: -6.8498 + i * 0.0015 },
}));

export default function DashboardPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
           <Button asChild size="lg" variant="secondary" className="h-14 text-lg">
            <Link href="/add-product">
                <PlusCircle className="mr-2 h-5 w-5" />
                Contribuer un prix
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Contributions */}
      <div>
        <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
          Derniers ajouts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentContributions.map((contribution) => (
            <Card key={contribution.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-foreground leading-tight">
                        {contribution.productName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        {contribution.storeName}
                        </p>
                    </div>
                    <p className="text-xl font-bold text-primary whitespace-nowrap">
                        {contribution.price.toFixed(2)} DH
                    </p>
                </div>
                 <p className="text-xs text-muted-foreground mt-2">
                    Ajouté le {format(new Date(contribution.date), "d MMM yyyy")}
                </p>
              </CardContent>
            </Card>
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
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                                <p className="font-semibold">Carte non disponible</p>
                                <p className="text-sm">La clé API Google Maps est manquante.</p>
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

