import { AddProductForm } from "./add-product-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
        <AddProductFormSuspenseWrapper />
    </div>
  );
}
