
'use server';

/**
 * @fileOverview This file defines a flow for searching products using Google Custom Search API.
 */

import {ai} from '@/ai/genkit';
import { 
    SearchProductsInput,
    SearchProductsOutput,
    SearchProductsInputSchema,
    SearchProductsOutputSchema,
    type Product
} from '@/lib/types';
import { z } from 'zod';

const GoogleSearchItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string(),
  pagemap: z.object({
    cse_thumbnail: z.array(z.object({ src: z.string() })).optional(),
    cse_image: z.array(z.object({ src: z.string() })).optional(),
  }).optional(),
});

const GoogleSearchOutputSchema = z.object({
  items: z.array(GoogleSearchItemSchema).optional(),
});

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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const cx = 'e32b5343dd1e74e77'; // Your Custom Search Engine ID

    if (!apiKey || apiKey.startsWith('your-') || apiKey.startsWith('AIzaSy')) {
        console.error("Clé API Google non valide ou manquante. La recherche ne peut pas continuer.");
        return { products: [] };
    }
    if(!cx){
        console.error("ID du moteur de recherche personnalisé (cx) manquant.");
        return { products: [] };
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur de l'API Google Custom Search:", errorData.error.message);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }
        
        const data = await response.json();
        const parsedData = GoogleSearchOutputSchema.safeParse(data);

        if (!parsedData.success || !parsedData.data.items) {
            console.warn("Aucun résultat ou format de réponse inattendu de Google Custom Search.");
            return { products: [] };
        }

        const products: Product[] = parsedData.data.items.map((item, index) => ({
            id: item.link + index, // Create a semi-unique ID
            name: item.title,
            description: item.snippet,
            imageUrl: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src,
            brand: '', // Custom Search doesn't provide this directly
            category: '', // Custom Search doesn't provide this directly
        }));

        return { products };

    } catch (error) {
        console.error("Erreur lors de la recherche de produits via Google Custom Search:", error);
        return { products: [] };
    }
  }
);
