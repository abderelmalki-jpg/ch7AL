import { AddProductForm } from "./add-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PackagePlus } from "lucide-react";
import { Suspense } from "react";

function AddProductFormSuspenseWrapper() {
    return (
        <Suspense fallback={<div>Chargement du formulaire...</div>}>
            <AddProductForm />
        </Suspense>
    );
}

export default function AddProductPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 md:px-6 py-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <PackagePlus className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="font-headline text-2xl">Ajouter un prix</CardTitle>
                        <CardDescription>
                            Partagez un prix que vous avez vu et aidez la communauté.
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
