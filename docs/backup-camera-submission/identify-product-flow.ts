'use server';
/**
 * @fileOverview This file defines a Genkit flow for identifying a product from an image.
 *
 * It takes an image data URI and returns the identified product's name, brand, and category.
 *
 * @exports `identifyProduct` - The main function to trigger the flow.
 * @exports `IdentifyProductInput` - The input type for the flow.
 * @exports `IdentifyProductOutput` - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyProductInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyProductInput = z.infer<typeof IdentifyProductInputSchema>;

const IdentifyProductOutputSchema = z.object({
  name: z.string().describe('Le nom du produit identifié.'),
  brand: z.string().describe('La marque du produit identifié.'),
  category: z.string().describe('La catégorie à laquelle le produit appartient (par exemple, Boissons, Snacks, etc.).'),
});
export type IdentifyProductOutput = z.infer<typeof IdentifyProductOutputSchema>;

export async function identifyProduct(
  input: IdentifyProductInput
): Promise<IdentifyProductOutput> {
  return identifyProductFlow(input);
}

const identifyProductPrompt = ai.definePrompt({
  name: 'identifyProductPrompt',
  input: {schema: IdentifyProductInputSchema},
  output: {schema: IdentifyProductOutputSchema},
  prompt: `You are an expert in product identification for the Moroccan market.
  Your task is to identify the product in the provided image.
  
  Analyze the following image:
  {{media url=photoDataUri}}
  
  Based on the image, provide the following information in French:
  1. The specific name of the product (e.g., "Canette de Coca-Cola", "Paquet de chips Lay's Nature").
  2. The brand of the product (e.g., "Coca-Cola", "Lay's").
  3. The general category of the product (e.g., "Boisson gazeuse", "Snack", "Produit laitier").

  Return the result in the specified JSON format. If the image is not a product or is unclear, make your best guess.`,
});

const identifyProductFlow = ai.defineFlow(
  {
    name: 'identifyProductFlow',
    inputSchema: IdentifyProductInputSchema,
    outputSchema: IdentifyProductOutputSchema,
  },
  async input => {
    const {output} = await identifyProductPrompt(input);
    return output!;
  }
);
