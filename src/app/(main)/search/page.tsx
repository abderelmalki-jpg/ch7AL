
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Product, Price } from '@/lib/types';
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { SearchIcon } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchPage() {
    const firestore = useFirestore();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchProductsAndPrices() {
            if (!firestore) return;
            setIsLoading(true);
            try {
                // 1. Fetch all products
                const productsRef = collection(firestore, 'products');
                const productsSnapshot = await getDocs(productsRef);
                const fetchedProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

                // 2. Fetch all prices
                const pricesRef = collection(firestore, 'priceRecords');
                const pricesSnapshot = await getDocs(pricesRef);
                const allPrices = pricesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Price));

                // 3. Create a map of productId -> prices
                const pricesByProduct = new Map<string, number[]>();
                allPrices.forEach(price => {
                    if (!pricesByProduct.has(price.productId)) {
                        pricesByProduct.set(price.productId, []);
                    }
                    pricesByProduct.get(price.productId)!.push(price.price);
                });

                // 4. Augment products with lowest price
                const productsWithPrices = fetchedProducts.map(product => {
                    const productPrices = pricesByProduct.get(product.id);
                    if (productPrices && productPrices.length > 0) {
                        return {
                            ...product,
                            price: Math.min(...productPrices) // Set lowest price
                        };
                    }
                    return product;
                });

                setProducts(productsWithPrices);
                setFilteredProducts(productsWithPrices);

            } catch (error) {
                console.error("Failed to fetch products and prices:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProductsAndPrices();
    }, [firestore]);

    useEffect(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const results = products.filter(product =>
            product.name.toLowerCase().includes(lowercasedTerm) ||
            (product.brand && product.brand.toLowerCase().includes(lowercasedTerm)) ||
            (product.category && product.category.toLowerCase().includes(lowercasedTerm))
        );
        setFilteredProducts(results);
    }, [searchTerm, products]);

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
            </div>

            {isLoading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                             <Skeleton className="aspect-square w-full" />
                             <Skeleton className="h-4 w-4/5" />
                             <Skeleton className="h-3 w-2/5" />
                        </div>
                    ))}
                 </div>
            ) : (
                <>
                    {filteredProducts.length > 0 ? (
                         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-muted-foreground">Aucun produit trouvé pour "{searchTerm}".</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
