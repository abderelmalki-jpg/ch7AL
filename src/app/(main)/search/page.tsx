
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Product } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { SearchIcon, Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { searchProducts } from '@/ai/flows/search-products-flow';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, startSearchTransition] = useTransition();

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm) {
            startSearchTransition(async () => {
                const results = await searchProducts({ query: debouncedSearchTerm });
                setProducts(results.products);
            });
        } else {
            setProducts([]);
        }
    }, [debouncedSearchTerm]);

    return (
        <div className="container mx-auto px-4 md:px-6 py-6">
            <h1 className="text-3xl font-headline font-bold mb-4 text-center">Rechercher des produits</h1>

            <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher par nom, marque, catégorie..." 
                    className="pl-10 h-12 text-lg" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                 {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            
            {searchTerm && !isSearching && products.length === 0 ? (
                 <div className="text-center py-16">
                    <p className="text-muted-foreground">Aucun produit trouvé pour "{searchTerm}".</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}
