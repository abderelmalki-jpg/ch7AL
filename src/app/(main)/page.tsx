import Link from "next/link";
import Image from "next/image";
import { Camera, Search, MapPin, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { recentContributions, topContributors, userBadges } from "@/lib/data";
import { format } from "date-fns";
import { HomeClient } from "./home-client";

function getRankEmoji(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
}

export default function HomePage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "souk-hero");

  return (
    <div className="container mx-auto px-4 md:px-6">
      {/* Hero Section */}
      <div className="hero-section relative my-6 rounded-3xl shadow-xl overflow-hidden text-white p-6 md:p-8 flex flex-col justify-end min-h-[250px] bg-gray-800">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover z-0"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
        <div className="relative z-20">
          <h1 className="text-3xl font-headline font-bold mb-2">
            <HomeClient />
          </h1>
          <p className="opacity-90 max-w-prose">
            Trouvez les meilleurs prix près de chez vous, grâce à la communauté.
          </p>
        </div>
      </div>
      
      {/* User Stats */}
       <Card className="mb-6 -mt-16 relative z-30 mx-4 md:mx-auto">
        <CardContent className="p-4 flex items-center justify-between bg-background/50 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400 h-6 w-6" />
            <span className="font-semibold text-lg">1,520 Points</span>
          </div>
          <div className="flex space-x-2">
            {userBadges.map((badge) => (
                <span key={badge.name} title={badge.name} className="text-2xl">{badge.emoji}</span>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/scanner" className="block">
          <Card className="text-center p-4 hover:bg-accent/20 transition-colors h-full">
            <Camera className="h-10 w-10 mx-auto text-accent mb-2" />
            <p className="font-semibold text-sm">Scanner Produit</p>
          </Card>
        </Link>
        <Link href="/search" className="block">
          <Card className="text-center p-4 hover:bg-accent/20 transition-colors h-full">
            <Search className="h-10 w-10 mx-auto text-accent mb-2" />
            <p className="font-semibold text-sm">Chercher Prix</p>
          </Card>
        </Link>
        <Link href="/map" className="block">
          <Card className="text-center p-4 hover:bg-accent/20 transition-colors h-full">
            <MapPin className="h-10 w-10 mx-auto text-accent mb-2" />
            <p className="font-semibold text-sm">Magasins à proximité</p>
          </Card>
        </Link>
         <Link href="/add-product" className="block">
          <Card className="text-center p-4 hover:bg-accent/20 transition-colors h-full">
            <Plus className="h-10 w-10 mx-auto text-accent mb-2" />
            <p className="font-semibold text-sm">Ajouter Produit</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Contributions */}
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
            Contributions Récentes
          </h2>
          <div className="space-y-3">
            {recentContributions.map((contribution) => (
              <Card key={contribution.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {contribution.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contribution.storeName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">
                      {contribution.price.toFixed(2)} DH
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contribution.date), "d MMM")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Contributors */}
        <div>
          <h2 className="text-2xl font-headline font-bold text-foreground mb-4">
            Top Contributeurs
          </h2>
          <Card>
            <CardContent className="p-0">
                <div className="space-y-1">
                {topContributors.map((contributor, index) => (
                    <div key={contributor.id} className="flex items-center justify-between p-3 border-b last:border-0">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg w-8 text-center">{getRankEmoji(index + 1)}</span>
                             <Avatar className="h-10 w-10">
                                <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
                                <AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{contributor.name}</p>
                                <p className="text-xs text-muted-foreground">{contributor.contributions} contributions</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-primary">{contributor.points} pts</p>
                        </div>
                    </div>
                ))}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
