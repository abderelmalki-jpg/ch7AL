
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import type { LeaderboardEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, BarChart3, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const leaderboardRef = collection(firestore, 'leaderboard');
        const q = query(leaderboardRef, where('period', '==', 'all_time'), orderBy('rank', 'asc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedContributors = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaderboardEntry));
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
        return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
                  <span className="text-xl font-bold text-muted-foreground w-6 text-center">{contributor.rank}</span>
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarImage src={contributor.avatar} alt={contributor.username} />
                    <AvatarFallback>{getInitials(contributor.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{contributor.username}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent" />
                        {contributor.points || 0}
                      </span>
                    </div>
                  </div>
                  {contributor.rank < 4 && (
                    <span className="text-3xl">
                      {contributor.rank === 1 ? '🥇' : contributor.rank === 2 ? '🥈' : '🥉'}
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
