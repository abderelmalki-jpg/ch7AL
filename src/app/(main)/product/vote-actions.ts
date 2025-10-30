
'use server';

import { doc, runTransaction, type Firestore } from 'firebase/firestore';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

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

    try {
        await runTransaction(db, async (transaction) => {
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
                    // Annuler l'upvote
                    upvotes = upvotes.filter(id => id !== userId);
                } else {
                    // Ajouter l'upvote
                    upvotes.push(userId);
                    // Si l'utilisateur avait downvoté, on l'enlève
                    if (hasDownvoted) {
                       downvotes = downvotes.filter(id => id !== userId);
                    }
                }
            } else if (voteType === 'downvote') {
                 if (hasDownvoted) {
                    // Annuler le downvote
                    downvotes = downvotes.filter(id => id !== userId);
                } else {
                    // Ajouter le downvote
                    downvotes.push(userId);
                     // Si l'utilisateur avait upvoté, on l'enlève
                    if (hasUpvoted) {
                        upvotes = upvotes.filter(id => id !== userId);
                    }
                }
            }
            
            const voteScore = upvotes.length - downvotes.length;

            transaction.update(priceRef, { upvotes, downvotes, voteScore });
        });
        
        revalidatePath('/dashboard');
        revalidatePath(`/product/${priceId}`);
        
        return { status: 'success', message: 'Vote enregistré !' };

    } catch (error) {
        console.error("Erreur lors du vote:", error);
        if (error instanceof Error) {
            return { status: 'error', message: error.message };
        }
        return { status: 'error', message: 'Une erreur est survenue.' };
    }
}
