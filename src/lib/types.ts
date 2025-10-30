

import type { Timestamp } from 'firebase/firestore';

export type Contribution = {
  id: string;
  productName: string;
  storeName: string;
  price: number;
  date: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  userId: string; // email in this case from priceRecord
  product: Product | null;
  store: Store | null;
  user: UserProfile | null;
  upvotes: string[];
  downvotes: string[];
  voteScore: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl?: string;
  imageHint?: string; // imageHint is optional from Firestore
  barcode?: string;
  price?: number; // Price is optional, as it might not be directly on the product
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  description: string;
};

export type Price = {
    id: string;
    productId: string;
    storeName: string;
    reportedBy: string; // user email
    price: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    barcode: string;
    currency: string;
    location: string; // JSON string
    verificationCount: number;
    verifiedBy: string; // JSON string array of emails
    upvotes?: string[];
    downvotes?: string[];
    voteScore?: number;
}

export type Store = {
    id: string;
    name: string;
    address?: string;
    addedBy: string; // user email
    city: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    location: string; // JSON stringified {lat, lng}
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
    } | Date;
}

export type LeaderboardEntry = {
    id: string;
    userId: string;
    username: string;
    points: number;
    rank: number;
    avatar: string;
    badges: string; // JSON string array
    period: 'all_time' | 'monthly' | 'weekly';
    createdAt: any;
    updatedAt: any;
};
