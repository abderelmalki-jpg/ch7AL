
'use server';

/**
 * @fileOverview This file defines a flow for searching products in Firestore.
 * It's designed to be more scalable than client-side filtering.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { adminDb } from '@/firebase/server';
import type { Product } from '@/lib/types';

// Define input and output schemas with Zod for validation and type safety
export const SearchProductsInputSchema = z.object({
  query: z.string().min(1, 'La recherche ne peut pas être vide.').describe('Le terme de recherche pour les produits.'),
});
export type SearchProductsInput = z.infer<typeof SearchProductsInputSchema>;

export const SearchProductsOutputSchema = z.object({
    products: z.array(z.custom<Product>()).describe('La liste des produits correspondants trouvés.'),
});
export type SearchProductsOutput = z.infer<typeof SearchProductsOutputSchema>;

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
    if (!adminDb) {
      console.error("L'admin Firestore n'est pas initialisé. La recherche ne peut pas continuer.");
      return { products: [] };
    }
    
    // Convert the query to lowercase for case-insensitive search
    const lowerCaseQuery = query.toLowerCase();

    // Firestore does not support native full-text search.
    // This is a common workaround using range queries on an array of search tokens.
    // A more robust solution would involve a dedicated search service like Algolia or Typesense.
    // For this implementation, we'll perform a simple "starts-with" query, which is limited but effective.
    
    // We are querying on the `name` field. The `\uf8ff` character is a neat trick
    // to create an "upper bound" for the query, effectively making it a prefix search.
    // E.g., searching for "coca" will match "coca-cola", "coca light", etc.
    const productsRef = adminDb.collection('products');
    const q = productsRef
        .where('name', '>=', lowerCaseQuery)
        .where('name', '<=', lowerCaseQuery + '\uf8ff')
        .limit(20); // Limit results to avoid fetching too much data

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

        // This is a simplified search. A real-world app would also search other fields
        // or use a more advanced search index. We could extend this to query brand and category
        // but it would require multiple queries and merging on the server.

        return { products };
    } catch (error) {
        console.error("Erreur lors de la recherche de produits dans Firestore:", error);
        // In case of an error, return an empty array to prevent the client from crashing.
        return { products: [] };
    }
  }
);
