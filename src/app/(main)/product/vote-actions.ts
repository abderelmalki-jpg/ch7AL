
'use server';

import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const voteSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().min(1, 'Utilisateur non connecté.'),
  voteType: z.enum(['upvote', 'downvote']),
});

export type VoteFormState = {
    status: 'idle' | 'success' | 'error';
    message: string;
}

export async function handleVote(
    db: Firestore,
    data: z.infer<typeof voteSchema>
): Promise<VoteFormState> {

    const validatedFields = voteSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'Données de vote invalides.',
        };
    }

    const { priceId, userId, voteType } = validatedFields.data;
    const priceRef = doc(db, 'priceRecords', priceId);

    // Using .then().catch() instead of try/catch to integrate with the custom error emitter
    return runTransaction(db, async (transaction) => {
        const priceDoc = await transaction.get(priceRef);
        if (!priceDoc.exists()) {
            throw new Error("La soumission de prix n'existe pas.");
        }

        const priceData = priceDoc.data();
        let upvotes: string[] = priceData.upvotes || [];
        let downvotes: string[] = priceData.downvotes || [];

        const hasUpvoted = upvotes.includes(userId);
        const hasDownvoted = downvotes.includes(userId);

        if (voteType === 'upvote') {
            if (hasUpvoted) {
                upvotes = upvotes.filter(id => id !== userId);
            } else {
                upvotes.push(userId);
                if (hasDownvoted) {
                   downvotes = downvotes.filter(id => id !== userId);
                }
            }
        } else if (voteType === 'downvote') {
             if (hasDownvoted) {
                downvotes = downvotes.filter(id => id !== userId);
            } else {
                downvotes.push(userId);
                if (hasUpvoted) {
                    upvotes = upvotes.filter(id => id !== userId);
                }
            }
        }
        
        const voteScore = upvotes.length - downvotes.length;
        
        // This is the data that will be written. We capture it for the error context.
        const updatedData = { upvotes, downvotes, voteScore };
        transaction.update(priceRef, updatedData);

        return updatedData; // Return the data for context in case of error
    })
    .then(() => {
        revalidatePath('/dashboard');
        revalidatePath(`/product/${priceId}`);
        return { status: 'success' as const, message: 'Vote enregistré !' };
    })
    .catch((error) => {
        // This block now handles all errors, including permission errors from Firestore.
        if (error.code === 'permission-denied') {
            // Firestore security rule error
            const permissionError = new FirestorePermissionError({
                path: priceRef.path,
                operation: 'update',
                // We can't easily get the 'before' data for the error, but we know the intent.
                // We'll simulate what the resource would look like after the update.
                requestResourceData: {
                    upvotes: 'FIELD_STATE_DEPENDENT', // Indicating the value depends on doc state
                    downvotes: 'FIELD_STATE_DEPENDENT',
                    voteScore: 'FIELD_STATE_DEPENDENT'
                }
            });
            errorEmitter.emit('permission-error', permissionError);
            
            // Return a user-facing error state
            return { status: 'error' as const, message: 'Permission refusée par les règles de sécurité.' };
        }

        // Handle other types of errors (e.g., network, transaction failed)
        console.error("Erreur lors du vote:", error);
        return { status: 'error' as const, message: error.message || 'Une erreur est survenue.' };
    });
}
