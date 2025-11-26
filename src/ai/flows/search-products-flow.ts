
'use server';

/**
 * @fileOverview This file defines a flow for searching products in Firestore.
 * It's designed to be more scalable than client-side filtering.
 */

import {ai} from '@/ai/genkit';
import { getAdminServices } from '@/firebase/server';
import { 
    SearchProductsInput,
    SearchProductsOutput,
    SearchProductsInputSchema,
    SearchProductsOutputSchema,
    type Product
} from '@/lib/types';


// The main exported function that client components will call.
export async function searchProducts(
  input: SearchProductsInput
): Promise<SearchProductsOutput> {
  return searchProductsFlow(input);
}


const searchProductsFlow = ai.defineFlow(
  {
    name: 'searchProductsFlow',
    inputSchema: SearchProductsInputSchema,
    outputSchema: SearchProductsOutputSchema,
  },
  async ({ query }) => {
    const { adminDb } = await getAdminServices();
    
    if (!adminDb) {
      console.error("L'admin Firestore n'est pas initialisé. La recherche ne peut pas continuer.");
      return { products: [] };
    }
    
    const lowerCaseQuery = query.toLowerCase();

    const productsRef = adminDb.collection('products');
    const q = productsRef
        .where('name', '>=', lowerCaseQuery)
        .where('name', '<=', lowerCaseQuery + '\uf8ff')
        .limit(20);

    try {
        const snapshot = await q.get();
        if (snapshot.empty) {
            return { products: [] };
        }

        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                brand: data.brand || '',
                category: data.category || '',
                imageUrl: data.imageUrl || undefined,
            };
        });

        return { products };
    } catch (error) {
        console.error("Erreur lors de la recherche de produits dans Firestore:", error);
        return { products: [] };
    }
  }
);
