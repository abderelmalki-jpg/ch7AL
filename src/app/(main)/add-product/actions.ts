'use server';

import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { z } from 'zod';

const schema = z.object({
    productDescription: z.string().min(10, { message: 'La description doit contenir au moins 10 caractères.' }),
});

export type FormState = {
    message: string;
    suggestions: string[];
    errors?: {
        productDescription?: string[];
    }
}

export async function getSuggestions(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const validatedFields = schema.safeParse({
        productDescription: formData.get('productDescription'),
    });

    if (!validatedFields.success) {
        return {
            message: 'La validation a échoué.',
            suggestions: [],
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { suggestedProductNames } = await suggestAlternativeProducts({
            productDescription: validatedFields.data.productDescription,
        });

        if (suggestedProductNames && suggestedProductNames.length > 0) {
            return {
                message: 'Voici quelques suggestions :',
                suggestions: suggestedProductNames,
            };
        } else {
             return {
                message: 'Impossible de générer des suggestions basées sur la description.',
                suggestions: [],
            };
        }
    } catch (error) {
        return {
            message: 'Une erreur est survenue lors de la génération des suggestions.',
            suggestions: [],
        };
    }
}
