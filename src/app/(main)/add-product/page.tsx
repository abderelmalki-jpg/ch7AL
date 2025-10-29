import { AddProductForm } from "./add-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { Suspense } from "react";

function AddProductFormSuspenseWrapper() {
    return (
        <Suspense fallback={<div className="text-center p-8">Chargement du formulaire...</div>}>
            <AddProductForm />
        </Suspense>
    );
}

export default function AddProductPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                         <Camera className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-2xl text-primary">Ajouter un prix</CardTitle>
                        <CardDescription>
                            Analysez un produit avec l'IA ou entrez les détails manuellement pour partager un prix.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <AddProductFormSuspenseWrapper />
            </CardContent>
        </Card>
    </div>
  );
}
