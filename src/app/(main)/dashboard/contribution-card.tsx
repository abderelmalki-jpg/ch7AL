
'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUser, useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, serverTimestamp, getDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { Contribution, Comment as CommentType, Price, Store, UserProfile, Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare, MapPin, ImageIcon, Send, Loader2, ArrowLeft } from 'lucide-react';
import { MapClient } from '../map/map-client';
import { handleVote } from '../product/vote-actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface ContributionCardProps {
  contribution: Contribution;
  apiKey: string;
  onBack: () => void;
}

export function ContributionCard({ contribution, apiKey, onBack }: ContributionCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // States
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, startCommentTransition] = useTransition();
  const [isVoting, startVoteTransition] = useTransition();
  
  // Real-time data
  const priceRef = useMemoFirebase(() => firestore ? doc(firestore, 'prices', contribution.id) : null, [firestore, contribution.id]);
  const commentsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'prices', contribution.id, 'comments'), orderBy('createdAt', 'asc')) : null, [firestore, contribution.id]);

  const { data: priceData } = useDoc<Price>(priceRef);
  const { data: comments, isLoading: isLoadingComments } = useCollection<CommentType>(commentsQuery);
  
  const detailedContribution = useMemo(() => {
    if (priceData) {
        // Merge initial contribution data with real-time price data
        return { ...contribution, ...priceData };
    }
    return contribution;
  }, [contribution, priceData]);

  const upvotes = detailedContribution?.upvotes || [];
  const downvotes = detailedContribution?.downvotes || [];
  
  const hasUpvoted = user && upvotes.includes(user.uid);
  const hasDownvoted = user && downvotes.includes(user.uid);

  const storeForMap = detailedContribution.latitude && detailedContribution.longitude ? [{
    id: detailedContribution.id,
    name: detailedContribution.storeName,
    position: { lat: detailedContribution.latitude, lng: detailedContribution.longitude }
  }] : [];

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || !firestore) return;

    startCommentTransition(async () => {
        try {
            const commentRef = collection(firestore, 'prices', contribution.id, 'comments');
            await addDoc(commentRef, {
                userId: user.uid,
                userName: user.displayName || 'Anonyme',
                userPhotoURL: user.photoURL || '',
                text: commentText,
                createdAt: serverTimestamp(),
            });
            setCommentText('');
            toast({ title: 'Commentaire ajouté !' });
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter le commentaire." });
        }
    });
  };
  
  const onVote = async (voteType: 'upvote' | 'downvote') => {
      if (!user || !firestore) {
          toast({ variant: 'destructive', description: "Vous devez être connecté pour voter."});
          return;
      };
      // Prevent user from voting on their own contribution
      if (detailedContribution.userId === user.uid) {
          toast({ variant: 'destructive', description: "Vous ne pouvez pas voter pour votre propre contribution."});
          return;
      }
      startVoteTransition(async () => {
        const result = await handleVote(firestore, {
            priceId: contribution.id,
            userId: user.uid,
            voteType: voteType
        });
        if (result.status === 'error') {
             toast({ variant: 'destructive', title: 'Erreur de vote', description: result.message});
        }
      });
  }

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + (names[names.length - 1][0] || '')).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const userDisplayName = detailedContribution.user?.name || detailedContribution.userId.substring(0, 5) + '...';

  return (
    <div className="space-y-4">
        <Button onClick={onBack} variant="ghost" className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
        </Button>
        
        <Card className="overflow-hidden">
             {detailedContribution.imageUrl ? (
                <div className="relative aspect-video w-full">
                    <Image 
                        src={detailedContribution.imageUrl} 
                        alt={detailedContribution.productName} 
                        fill 
                        className="object-contain" 
                    />
                </div>
            ) : (
                <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/40" />
                </div>
            )}
            <CardContent className="p-4 space-y-3">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-primary text-xl leading-tight">
                            {detailedContribution.productName}
                        </h3>
                        <p className="text-sm text-accent font-medium">
                            {detailedContribution.storeName}
                        </p>
                    </div>
                    <p className="text-2xl font-bold text-primary whitespace-nowrap">
                        {detailedContribution.price.toFixed(2)} DH
                    </p>
                </div>
                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <p>
                        Il y a {formatDistanceToNow(new Date(detailedContribution.date), { addSuffix: false, locale: fr })}
                    </p>
                    <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={detailedContribution.user?.photoURL} />
                            <AvatarFallback className="text-[8px]">{getInitials(userDisplayName)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[80px]">{userDisplayName}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                     <p className="text-sm font-medium">Ce prix est-il correct ?</p>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => onVote('upvote')} disabled={isVoting} className={cn('h-10 w-12 flex gap-1', hasUpvoted && 'bg-green-100 text-green-600 border-green-300 hover:bg-green-200 hover:text-green-700')}>
                            <ThumbsUp className="h-5 w-5" />
                            <span className="text-sm font-bold">{upvotes.length}</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onVote('downvote')} disabled={isVoting} className={cn('h-10 w-12 flex gap-1', hasDownvoted && 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200 hover:text-red-700')}>
                            <ThumbsDown className="h-5 w-5" />
                            <span className="text-sm font-bold">{downvotes.length}</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {storeForMap.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-muted-foreground"/>
                        Localisation
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-48 w-full rounded-lg overflow-hidden">
                        {apiKey ? (
                            <MapClient apiKey={apiKey} stores={storeForMap} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-muted/20">
                                <p className="text-sm text-muted-foreground">Clé API Google Maps manquante</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}
        
        <Card>
             <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-muted-foreground"/>
                    Commentaires ({comments?.length || 0})
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {isLoadingComments ? (
                        <div className="flex items-center justify-center p-4"> <Loader2 className="animate-spin"/></div>
                    ) : comments && comments.length > 0 ? (
                        comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.userPhotoURL} />
                                <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="bg-muted rounded-lg p-2 flex-1">
                            <div className="flex items-baseline justify-between">
                                <p className="font-semibold text-sm">{comment.userName}</p>
                                <p className="text-xs text-muted-foreground">
                                    {comment.createdAt ? formatDistanceToNow(new Date((comment.createdAt as any).seconds * 1000), { locale: fr, addSuffix: true }) : ''}
                                </p>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="text-center text-sm text-muted-foreground py-4">
                        Aucun commentaire pour le moment.
                        </div>
                    )}
                 </div>
                  {user && (
                    <form className="space-y-2 pt-2 border-t" onSubmit={handleCommentSubmit}>
                        <Textarea 
                        placeholder="Ajouter un commentaire..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={isSubmittingComment}
                        />
                        <Button className="w-full" disabled={!commentText.trim() || isSubmittingComment}>
                            {isSubmittingComment ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-4 w-4"/> Envoyer</>}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
