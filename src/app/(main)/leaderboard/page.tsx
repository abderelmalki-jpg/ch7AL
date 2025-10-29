import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, BarChart3 } from "lucide-react";
import { topContributors } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-primary/5">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                     <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-2xl text-primary">Classement</CardTitle>
                    <CardDescription>
                        Découvrez les champions de la communauté qui partagent le plus.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {topContributors.map((contributor, index) => (
              <li key={contributor.id} className="p-4 flex items-center gap-4 hover:bg-secondary transition-colors">
                <span className="text-xl font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={contributor.avatarUrl} alt={contributor.name} />
                  <AvatarFallback>{contributor.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-primary">{contributor.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent" />
                      {contributor.points}
                    </span>
                     <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      {contributor.contributions}
                    </span>
                  </div>
                </div>
                {index < 3 && (
                  <span className="text-3xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
