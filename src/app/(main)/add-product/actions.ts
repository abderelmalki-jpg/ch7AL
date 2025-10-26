'use server';

import { suggestAlternativeProducts } from '@/ai/flows/suggest-alternative-products';
import { z } from 'zod';

const schema = z.object({
    productDescription: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
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
            message: 'Validation failed.',
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
                message: 'Here are some suggestions:',
                suggestions: suggestedProductNames,
            };
        } else {
             return {
                message: 'Could not generate suggestions based on the description.',
                suggestions: [],
            };
        }
    } catch (error) {
        return {
            message: 'An error occurred while generating suggestions.',
            suggestions: [],
        };
    }
}
