import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { userBadges } from "@/lib/data";
import { Award, BarChart3, ChevronRight, Languages, Lock, Settings, Shield, Star, HelpCircle } from "lucide-react";
import Link from "next/link";

const menuItems = [
    { icon: Settings, text: 'Paramètres', href: '#' },
    { icon: Languages, text: 'Langue', href: '#' },
    { icon: Lock, text: 'Confidentialité', href: '#' },
    { icon: HelpCircle, text: 'Aide', href: '#' },
    { icon: Shield, text: 'À propos', href: '#' },
]

export default function ProfilePage() {
    const userImage = PlaceHolderImages.find(img => img.id === 'user-avatar-1');

    return (
        <div className="container mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col items-center mb-8">
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary shadow-lg">
                    <AvatarImage src={userImage?.imageUrl} alt="Fatima Zahra" data-ai-hint={userImage?.imageHint} />
                    <AvatarFallback>FZ</AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-headline font-bold text-primary">Fatima Zahra</h1>
                <p className="text-muted-foreground">A rejoint il y a 2 mois</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                <Card className="bg-accent/10 border-accent/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-accent-foreground">
                            <Star className="w-6 h-6 text-accent" /> Points
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-accent">1,520</p>
                    </CardContent>
                </Card>
                 <Card className="bg-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-primary">
                            <BarChart3 className="w-6 h-6" /> Contributions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-primary">152</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                         <Award className="w-6 h-6 text-accent" /> Badges
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around items-center">
                        {userBadges.map(badge => (
                             <div key={badge.name} className="flex flex-col items-center gap-2">
                                <span className="text-5xl">{badge.emoji}</span>
                                <span className="font-medium capitalize text-muted-foreground">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-2">
                    {menuItems.map((item, index) => (
                        <div key={item.text}>
                            <Link href={item.href} className="flex items-center p-3 rounded-lg hover:bg-secondary transition-colors">
                                <item.icon className="w-5 h-5 mr-4 text-muted-foreground" />
                                <span className="flex-1 font-medium">{item.text}</span>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Link>
                            {index < menuItems.length - 1 && <Separator className="my-0" />}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
