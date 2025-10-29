

export type Contribution = {
  id: string;
  productName: string;
  storeName: string;
  price: number;
  date: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
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
};

export type Price = {
    id: string;
    productId: string;
    storeId: string;
    userId: string;
    price: number;
    createdAt: {
        seconds: number;
        nanoseconds: number;
    };
    verified: boolean;
    reports: number;
}

export type Store = {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
}

export type UserProfile = {
    id: string;
    name: string;
    email: string;
    photoURL?: string;
    points?: number;
    contributions?: number;
    badges?: string[];
}
