

import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type Contribution = {
  id: string;
  productName: string;
  storeName: string;
  price: number;
  date: Date;
  latitude: number | null;
  longitude: number | null;
  imageUrl?: string;
  userId: string;
  product: Product | null;
  store: Store | null;
  user: UserProfile | null;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
  createdAt: Timestamp; // Keep original timestamp
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  imageHint?: string; // imageHint is optional from Firestore
  price?: number; // Price is optional, as it might not be directly on the product
  uploadedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  description?: string;
};

export type Price = {
    id: string;
    productId: string;
    storeId: string;
    userId: string;
    price: number;
    createdAt: Timestamp;
    verified: boolean;
    upvotes: string[];
    downvotes: string[];
    voteScore: number;
}

export type Store = {
    id: string;
    name: string;
    address?: string;
    city?: string;
    neighborhood?: string;
    addedBy?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    latitude: number | null;
    longitude: number | null;
}

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    points?: number;
    contributions?: number;
    badges?: string[];
    language: string;
    createdAt: Timestamp;
}

export type Comment = {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    } | Date | Timestamp;
}

export type LeaderboardEntry = {
    id: string;
    userId: string;
    username: string;
    points: number;
    rank: number;
    avatar: string;
};

export type VoteFormState = {
    status: 'idle' | 'success' | 'error';
    message: string;
}

// ===== Genkit Flow Schemas and Types =====

// --- Identify Product Flow ---
export const IdentifyProductInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyProductInput = z.infer<typeof IdentifyProductInputSchema>;

export const IdentifyProductOutputSchema = z.object({
  name: z.string().describe('Le nom du produit identifié.'),
  brand: z.string().describe('La marque du produit identifié.'),
  category: z.string().describe('La catégorie à laquelle le produit appartient (par exemple, Boissons, Snacks, etc.).'),
});
export type IdentifyProductOutput = z.infer<typeof IdentifyProductOutputSchema>;


// --- Search Products Flow ---
export const SearchProductsInputSchema = z.object({
  query: z.string().min(1, 'La recherche ne peut pas être vide.').describe('Le terme de recherche pour les produits.'),
});
export type SearchProductsInput = z.infer<typeof SearchProductsInputSchema>;

export const SearchProductsOutputSchema = z.object({
    products: z.array(z.custom<Product>()).describe('La liste des produits correspondants trouvés.'),
});
export type SearchProductsOutput = z.infer<typeof SearchProductsOutputSchema>;


// --- Suggest Alternative Products Flow ---
export const SuggestAlternativeProductsInputSchema = z.object({
  productDescription: z
    .string()
    .describe('La description du produit pour lequel suggérer des noms alternatifs.'),
});
export type SuggestAlternativeProductsInput = z.infer<
  typeof SuggestAlternativeProductsInputSchema
>;

export const SuggestAlternativeProductsOutputSchema = z.object({
  suggestedProductNames: z
    .array(z.string())
    .describe('Une liste de noms de produits suggérés en fonction de la description.'),
});
export type SuggestAlternativeProductsOutput = z.infer<
  typeof SuggestAlternativeProductsOutputSchema
>;
