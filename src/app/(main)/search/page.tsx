
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Product } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { ProductCard } from "@/components/product-card";
import { SearchIcon, Loader2, Lightbulb } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { searchProducts } from '@/ai/flows/search-products-flow';
import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, startSearchTransition] = useTransition();
    
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggesting, startSuggestionTransition] = useTransition();

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        setSuggestions([]); // Reset suggestions on new search
        if (debouncedSearchTerm) {
            startSearchTransition(async () => {
                const results = await searchProducts({ query: debouncedSearchTerm });
                setProducts(results.products);

                if (results.products.length === 0) {
                    startSuggestionTransition(async () => {
                        try {
                            const suggestionResult = await suggestAlternativeProducts({ productDescription: debouncedSearchTerm });
                            setSuggestions(suggestionResult.suggestedProductNames.slice(0, 5)); // Limit to 5 suggestions
                        } catch (error) {
                            console.error("Failed to get AI suggestions:", error);
                        }
                    });
                }
            });
        } else {
            setProducts([]);
        }
    }, [debouncedSearchTerm]);
    
    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-6">
            <h1 className="text-3xl font-headline font-bold mb-4 text-center">Rechercher un produit</h1>

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
                 <div className="text-center py-16 bg-card border rounded-lg">
                    <p className="text-muted-foreground">Aucun produit trouvé pour "{searchTerm}".</p>

                    {isSuggesting ? (
                         <div className="mt-6">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                            <p className="text-sm text-muted-foreground mt-2">L'IA cherche des alternatives...</p>
                        </div>
                    ) : suggestions.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold flex items-center justify-center gap-2">
                                <Lightbulb className="w-5 h-5 text-accent"/>
                                Suggestions
                            </h3>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                                {suggestions.map((s, i) => (
                                    <Button key={i} variant="outline" size="sm" onClick={() => handleSuggestionClick(s)}>
                                        {s}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
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
