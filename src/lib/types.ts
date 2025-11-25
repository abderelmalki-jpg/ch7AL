
import type { Timestamp } from 'firebase/firestore';

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
