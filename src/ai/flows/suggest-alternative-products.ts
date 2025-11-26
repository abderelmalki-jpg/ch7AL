'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting alternative product names based on a user-provided description.
 *
 * The flow takes a product description as input and returns a list of suggested product names.
 *
 * @exports `suggestAlternativeProducts` - The main function to trigger the flow.
 */

import {ai} from '@/ai/genkit';
import {
  SuggestAlternativeProductsInput,
  SuggestAlternativeProductsOutput,
  SuggestAlternativeProductsInputSchema,
  SuggestAlternativeProductsOutputSchema
} from '@/lib/types';


export async function suggestAlternativeProducts(
  input: SuggestAlternativeProductsInput
): Promise<SuggestAlternativeProductsOutput> {
  return suggestAlternativeProductsFlow(input);
}

const suggestAlternativeProductsPrompt = ai.definePrompt({
  name: 'suggestAlternativeProductsPrompt',
  input: {schema: SuggestAlternativeProductsInputSchema},
  output: {schema: SuggestAlternativeProductsOutputSchema},
  prompt: `Vous êtes un assistant utile qui suggère des noms de produits alternatifs basés sur une description fournie par l'utilisateur.

  Étant donné la description de produit suivante:
  {{productDescription}}

  Suggérez une liste de noms de produits alternatifs que l'utilisateur peut utiliser. Retournez les suggestions sous forme de tableau JSON.
  `,
});

const suggestAlternativeProductsFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeProductsFlow',
    inputSchema: SuggestAlternativeProductsInputSchema,
    outputSchema: SuggestAlternativeProductsOutputSchema,
  },
  async input => {
    const {output} = await suggestAlternativeProductsPrompt(input);
    return output!;
  }
);
