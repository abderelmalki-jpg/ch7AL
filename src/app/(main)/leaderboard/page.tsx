
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, BarChart3, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const [contributors, setContributors] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, orderBy('points', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedContributors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setContributors(fetchedContributors);
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [firestore]);
  
  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2);
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="overflow-hidden">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                     <Trophy className="h-8 w-8 text-primary" />
                </div>
            </div>
            <CardTitle className="font-headline text-3xl text-primary">Classement</CardTitle>
            <CardDescription>
                Les champions de la communauté qui partagent le plus.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <ul className="divide-y">
              {contributors.map((contributor, index) => (
                <li key={contributor.id} className="p-4 flex items-center gap-4 hover:bg-secondary transition-colors">
                  <span className="text-xl font-bold text-muted-foreground w-6 text-center">{index + 1}</span>
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={contributor.photoURL} alt={contributor.name} />
                    <AvatarFallback>{getInitials(contributor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{contributor.name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent" />
                        {contributor.points || 0}
                      </span>
                       <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {contributor.contributions || 0}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
