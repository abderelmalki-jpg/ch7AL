export type Contribution = {
  id: string;
  productName: string;
  storeName: string;
  price: number;
  date: string;
};

export type Contributor = {
  id: string;
  name: string;
  contributions: number;
  points: number;
  avatarUrl: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  imageHint: string;
  price: number;
};
