import { AuthForm } from "./auth-form";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-br from-primary/80 to-primary">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
            <Logo className="h-24 w-24" />
        </div>
        <Card className="shadow-2xl rounded-2xl">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Bienvenue sur Souk Price</CardTitle>
                <CardDescription>Trouvez les meilleurs prix près de chez vous</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm />
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
