'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting alternative product names based on a user-provided description.
 *
 * The flow takes a product description as input and returns a list of suggested product names.
 *
 * @exports `suggestAlternativeProducts` - The main function to trigger the flow.
 * @exports `SuggestAlternativeProductsInput` - The input type for the flow.
 * @exports `SuggestAlternativeProductsOutput` - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeProductsInputSchema = z.object({
  productDescription: z
    .string()
    .describe('The description of the product for which to suggest alternative names.'),
});

export type SuggestAlternativeProductsInput = z.infer<
  typeof SuggestAlternativeProductsInputSchema
>;

const SuggestAlternativeProductsOutputSchema = z.object({
  suggestedProductNames: z
    .array(z.string())
    .describe('A list of suggested product names based on the description.'),
});

export type SuggestAlternativeProductsOutput = z.infer<
  typeof SuggestAlternativeProductsOutputSchema
>;

export async function suggestAlternativeProducts(
  input: SuggestAlternativeProductsInput
): Promise<SuggestAlternativeProductsOutput> {
  return suggestAlternativeProductsFlow(input);
}

const suggestAlternativeProductsPrompt = ai.definePrompt({
  name: 'suggestAlternativeProductsPrompt',
  input: {schema: SuggestAlternativeProductsInputSchema},
  output: {schema: SuggestAlternativeProductsOutputSchema},
  prompt: `You are a helpful assistant that suggests alternative product names based on a user-provided description.

  Given the following product description:
  {{productDescription}}

  Suggest a list of alternative product names that the user can use. Return the suggestions as a JSON array.
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
