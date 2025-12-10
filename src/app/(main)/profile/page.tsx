
'use client';

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Image from "next/image";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { updateProfile as updateAuthProfile } from 'firebase/auth';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Loader2, Camera, Trophy, BarChart3, Edit, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ProfilePage() {
    const auth = useAuth();
    const firestore = useFirestore();
    const storage = firestore ? getStorage(firestore.app) : null;
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    
    // Photo upload state
    const [newPhotoDataUri, setNewPhotoDataUri] = useState<string | null>(null);
    const [isUploading, startUploadingTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userProfileRef = useMemoFirebase(
      () => (user ? doc(firestore, 'users', user.uid) : null),
      [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            toast({
                title: "Déconnexion réussie",
                description: "Vous avez été déconnecté.",
            });
            router.push('/auth');
        } catch (error) {
            console.error("Erreur de déconnexion:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de se déconnecter. Veuillez réessayer.",
            });
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewPhotoDataUri(e.target?.result as string);
                // Automatically trigger upload confirmation logic here, or have a separate button
                handleUploadConfirm(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleUploadConfirm = async (dataUri: string) => {
        if (!dataUri || !user || !storage || !firestore) return;
        
        startUploadingTransition(async () => {
            try {
                const imagePath = `profile-pictures/${user.uid}/profile.jpg`;
                const imageRef = storageRef(storage, imagePath);

                const snapshot = await uploadString(imageRef, dataUri, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);

                const finalUrl = `${downloadURL}?t=${new Date().getTime()}`;

                await updateAuthProfile(user, { photoURL: finalUrl });
                await updateDoc(doc(firestore, 'users', user.uid), { photoURL: finalUrl });

                toast({ title: 'Succès !', description: "Photo de profil mise à jour." });
                setNewPhotoDataUri(null); // Clear preview
            } catch (error) {
                 console.error("Error uploading profile picture:", error);
                 toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de téléverser la photo.' });
            }
        });
    }

    const getInitials = (name: string) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] + (names[names.length-1][0] || '')).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
             <div className="bg-primary/80 h-full p-4 space-y-6 flex flex-col">
                <div className="flex-grow flex flex-col items-center justify-center text-center text-primary-foreground">
                    <Skeleton className="w-28 h-28 rounded-full mb-4 bg-white/20"/>
                    <Skeleton className="h-8 w-40 mb-2 bg-white/20"/>
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-20 w-full rounded-lg bg-white/20"/>
                    <Skeleton className="h-20 w-full rounded-lg bg-white/20"/>
                </div>
                <Skeleton className="h-12 w-full rounded-lg bg-white/20"/>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-primary/80 to-primary h-full p-4 space-y-6 flex flex-col">
            
             <div className="absolute top-4 right-4">
                <Link href="/settings" passHref>
                    <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20">
                        <Settings className="h-6 w-6" />
                    </Button>
                </Link>
            </div>
            
            <div className="flex-grow flex flex-col items-center justify-center text-center text-primary-foreground">
                <div className="relative group">
                    <Avatar className="w-28 h-28 mb-4 border-4 border-white shadow-lg">
                        <AvatarImage src={userProfile?.photoURL} alt={userProfile?.name} />
                        <AvatarFallback className="text-4xl bg-white text-primary">
                            {getInitials(userProfile?.name || user?.email || '')}
                        </AvatarFallback>
                    </Avatar>
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 bg-white h-10 w-10 rounded-full flex items-center justify-center shadow-md border-2 border-primary"
                        aria-label="Changer la photo de profil"
                        disabled={isUploading}
                    >
                         {isUploading ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <Camera className="h-5 w-5 text-primary" />}
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        hidden 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleFileChange}
                    />
                </div>
                
                <h1 className="text-3xl font-bold">{userProfile?.name || 'Utilisateur'}</h1>
            </div>

            <div className="space-y-2">
                 <Card className="bg-card/90 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Trophy className="w-8 h-8 text-primary" />
                        <div>
                            <p className="font-bold text-2xl">{userProfile?.points || 0}</p>
                            <p className="text-sm text-muted-foreground">Points Cumulés</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-card/90 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        <div>
                            <p className="font-bold text-2xl">{userProfile?.contributions || 0}</p>
                            <p className="text-sm text-muted-foreground">Contributions</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <Button variant="secondary" size="lg" className="w-full h-12 text-base bg-white/90 text-primary hover:bg-white" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" />
                Déconnexion
            </Button>
        </div>
    );
}
