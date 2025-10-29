
'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { userBadges } from "@/lib/data";
import { Award, BarChart3, ChevronRight, Languages, Lock, Settings, Shield, Star, HelpCircle, Check, LogOut, Loader2, Pencil, X, Save } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
    { id: 'settings', icon: Settings, text: 'Paramètres', href: '#' },
    { id: 'privacy', icon: Lock, text: 'Confidentialité', href: '#' },
    { id: 'help', icon: HelpCircle, text: 'Aide', href: '#' },
    { id: 'about', icon: Shield, text: 'À propos', href: '#' },
]

type Language = 'fr' | 'ar' | 'dr';

export default function ProfilePage() {
    const [selectedLanguage, setSelectedLanguage] = useState<Language>('fr');

    const auth = useAuth();
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    const userProfileRef = useMemoFirebase(
      () => (user ? doc(firestore, 'users', user.uid) : null),
      [user, firestore]
    );
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.name || '');
        }
    }, [userProfile]);

    const languageOptions: { id: Language, name: string, nativeName: string }[] = [
        { id: 'fr', name: 'Français', nativeName: 'Français' },
        { id: 'ar', name: 'Arabe', nativeName: 'العربية' },
        { id: 'dr', name: 'Darija', nativeName: 'الدارجة' },
    ];
    
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

    const handleSaveName = async () => {
        if (!userProfileRef || !displayName.trim()) {
            toast({ variant: 'destructive', title: 'Le nom ne peut pas être vide.' });
            return;
        }
        setIsSavingName(true);
        try {
            updateDocumentNonBlocking(userProfileRef, { name: displayName });
            toast({ title: 'Nom mis à jour avec succès !' });
            setIsEditingName(false);
        } catch (error) {
            console.error("Erreur de mise à jour du nom:", error);
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le nom.' });
        } finally {
            setIsSavingName(false);
        }
    }

    const getInitials = (name: string) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
            <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary shadow-lg">
                    <AvatarImage src={userProfile?.photoURL} alt={userProfile?.name} />
                    <AvatarFallback>
                        {isProfileLoading ? <Loader2 className="animate-spin" /> : getInitials(userProfile?.name || user?.email || '')}
                    </AvatarFallback>
                </Avatar>
                
                {isProfileLoading ? (
                    <Skeleton className="h-9 w-48" />
                ) : isEditingName ? (
                     <div className="flex items-center gap-2">
                        <Input 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)} 
                            className="text-2xl font-bold text-center h-12" 
                            placeholder="Votre nom"
                        />
                        <Button onClick={handleSaveName} size="icon" disabled={isSavingName}>
                            {isSavingName ? <Loader2 className="animate-spin" /> : <Save />}
                        </Button>
                        <Button onClick={() => setIsEditingName(false)} size="icon" variant="ghost">
                            <X />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h1 className="text-3xl font-headline font-bold text-primary">{userProfile?.name || 'Utilisateur'}</h1>
                         <Button onClick={() => setIsEditingName(true)} size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="h-5 w-5" />
                        </Button>
                    </div>
                )}
                <p className="text-muted-foreground">{userProfile?.email}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
                <Card className="bg-accent/10 border-accent/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-accent-foreground">
                            <Star className="w-6 h-6 text-accent" /> Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isProfileLoading ? (
                            <Skeleton className="h-9 w-24 mx-auto" />
                        ) : (
                            <p className="text-3xl font-bold text-accent">{userProfile?.points || 0}</p>
                        )}
                    </CardContent>
                </Card>
                 <Card className="bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-primary">
                            <BarChart3 className="w-6 h-6" /> Contributions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isProfileLoading ? (
                            <Skeleton className="h-9 w-16 mx-auto" />
                        ) : (
                            <p className="text-3xl font-bold text-primary">{userProfile?.contributions || 0}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                         <Award className="w-6 h-6 text-accent" /> Badges
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     {isProfileLoading ? (
                         <div className="flex justify-around items-center">
                            <Skeleton className="h-20 w-16" />
                            <Skeleton className="h-20 w-16" />
                            <Skeleton className="h-20 w-16" />
                         </div>
                     ): (
                        <div className="flex justify-around items-center">
                            {userBadges.map(badge => (
                                <div key={badge.name} className="flex flex-col items-center gap-2">
                                    <span className="text-5xl">{badge.emoji}</span>
                                    <span className="font-medium capitalize text-muted-foreground">{badge.name}</span>
                                </div>
                            ))}
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-2">
                    {menuItems.map((item, index) => (
                        <React.Fragment key={item.id}>
                            <Link href={item.href} className="flex items-center p-3 rounded-lg hover:bg-secondary transition-colors">
                                <item.icon className="w-5 h-5 mr-4 text-muted-foreground" />
                                <span className="flex-1 font-medium">{item.text}</span>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            {index < menuItems.length -1 && <Separator className="my-0" />}
                        </React.Fragment>
                    ))}
                     <Separator className="my-0" />
                     <Dialog>
                        <DialogTrigger asChild>
                            <button className="w-full flex items-center p-3 rounded-lg hover:bg-secondary transition-colors text-left">
                                <Languages className="w-5 h-5 mr-4 text-muted-foreground" />
                                <span className="flex-1 font-medium">Langue</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{languageOptions.find(l => l.id === selectedLanguage)?.name}</span>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Choisissez votre langue</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-2 pt-4">
                                {languageOptions.map((lang) => (
                                    <Button
                                        key={lang.id}
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-between h-14 text-lg",
                                            selectedLanguage === lang.id && "border-primary ring-2 ring-primary"
                                        )}
                                        onClick={() => setSelectedLanguage(lang.id)}
                                    >
                                        <span>{lang.name} <span className="text-muted-foreground">({lang.nativeName})</span></span>
                                        {selectedLanguage === lang.id && <Check className="w-5 h-5 text-primary" />}
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            <div className="mt-4">
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" />
                    Se déconnecter
                </Button>
            </div>
        </div>
    );
     