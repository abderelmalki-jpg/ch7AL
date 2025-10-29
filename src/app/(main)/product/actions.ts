'use server';

import { getDb } from '@/firebase/server';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

const commentSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().min(1, 'Utilisateur non connecté.'),
  userName: z.string().min(1),
  userPhotoURL: z.string().optional(),
  text: z.string().min(1, 'Le commentaire ne peut pas être vide.'),
});

export type CommentFormState = {
    status: 'idle' | 'success' | 'error';
    message: string;
    errors?: {
        text?: string[];
        userId?: string[];
    }
}

export async function addComment(
    prevState: CommentFormState,
    formData: FormData
): Promise<CommentFormState> {

    const validatedFields = commentSchema.safeParse({
        priceId: formData.get('priceId'),
        userId: formData.get('userId'),
        userName: formData.get('userName'),
        userPhotoURL: formData.get('userPhotoURL'),
        text: formData.get('text'),
    });

    if (!validatedFields.success) {
        return {
            status: 'error',
            message: 'La validation a échoué.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { priceId, ...commentData } = validatedFields.data;
    const db = getDb();

    try {
        const commentsRef = collection(db, 'prices', priceId, 'comments');
        await addDoc(commentsRef, {
            ...commentData,
            createdAt: serverTimestamp(),
        });
        return {
            status: 'success',
            message: 'Commentaire ajouté.',
        };
    } catch (error) {
        console.error("Error adding comment:", error);
        return {
            status: 'error',
            message: "Une erreur est survenue lors de l'ajout du commentaire.",
        };
    }
}
