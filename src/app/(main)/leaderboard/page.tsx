
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import type { LeaderboardEntry, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, orderBy('points', 'desc'), limit(50));
        
        const querySnapshot = await getDocs(q);
        
        const fetchedContributors = querySnapshot.docs.map((doc, index) => {
          const userData = doc.data() as UserProfile;
          return {
            id: doc.id,
            userId: doc.id,
            username: userData.name || 'Utilisateur anonyme',
            points: userData.points || 0,
            rank: index + 1,
            avatar: userData.photoURL || '',
          };
        });

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
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const getRankCardClass = (rank: number) => {
    switch(rank) {
        case 1: return "bg-yellow-400 text-yellow-900";
        case 2: return "bg-gray-300 text-gray-800";
        case 3: return "bg-orange-400 text-orange-900";
        default: return "bg-card";
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-center">Classement</h1>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {contributors.map((contributor) => (
                <Card key={contributor.id} className={cn("p-4 flex items-center gap-4 transition-all", getRankCardClass(contributor.rank))}>
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-full font-bold", 
                        contributor.rank === 1 ? 'bg-yellow-500' : 
                        contributor.rank === 2 ? 'bg-gray-400' :
                        contributor.rank === 3 ? 'bg-orange-500' :
                        'bg-muted'
                    )}>
                        {contributor.rank}
                    </div>

                  <Avatar className="h-12 w-12 border-2 border-background">
                    <AvatarImage src={contributor.avatar} alt={contributor.username} />
                    <AvatarFallback>{getInitials(contributor.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{contributor.username}</p>
                  </div>
                  <div className="font-bold text-lg">
                      {contributor.points || 0} points
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
    </div>
  );
}
