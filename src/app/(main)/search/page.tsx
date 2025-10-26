import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/data";
import { SearchIcon } from "lucide-react";

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-6">
            <h1 className="text-3xl font-headline font-bold mb-4">Rechercher des produits</h1>

            <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Rechercher des produits, des marques..." className="pl-10 h-12 text-lg" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
                {products.map(product => (
                    <ProductCard key={`${product.id}-2`} product={{...product, id: `${product.id}-2`}} />
                ))}
            </div>
        </div>
    )
}
