import { AddProductForm } from "./add-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PackagePlus } from "lucide-react";
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
        <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                         <PackagePlus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-2xl">Ajouter un prix</CardTitle>
                        <CardDescription>
                            Partagez un prix que vous avez vu. Chaque contribution aide la communauté à économiser.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <AddProductFormSuspenseWrapper />
            </CardContent>
        </Card>
    </div>
  );
}
