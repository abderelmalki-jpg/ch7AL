import type { Contribution, Contributor, Product } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const recentContributions: Contribution[] = [
  {
    id: '1',
    productName: 'Canette de Coca-Cola',
    storeName: 'Hanout Omar',
    price: 3.5,
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    latitude: 33.9716,
    longitude: -6.8498,
  },
  {
    id: '2',
    productName: 'Chips Lay\'s Classique',
    storeName: 'Épicerie Al Amal',
    price: 5.0,
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    latitude: 33.9730,
    longitude: -6.8520,
  },
  {
    id: '3',
    productName: 'Eau Sidi Ali 1.5L',
    storeName: 'Chez Hassan',
    price: 6.0,
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    latitude: 33.9700,
    longitude: -6.8480,
  },
];

export const topContributors: Contributor[] = [
  {
    id: '1',
    name: 'Fatima Zahra',
    contributions: 152,
    points: 1520,
    avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-1')?.imageUrl || '',
  },
  {
    id: '2',
    name: 'Youssef El Idrissi',
    contributions: 121,
    points: 1210,
    avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-2')?.imageUrl || '',
  },
  {
    id: '3',
    name: 'Amina Benjelloun',
    contributions: 98,
    points: 980,
    avatarUrl: PlaceHolderImages.find(img => img.id === 'user-avatar-3')?.imageUrl || '',
  },
];

export const userBadges: { name: string, emoji: string }[] = [
    { name: 'débutant', emoji: '🥉' },
    { name: 'contributeur', emoji: '🥈' },
    { name: 'expert', emoji: '🥇' },
];

export const products: Product[] = [
    {
        id: '1',
        name: 'Canette de Coca-Cola',
        brand: 'Coca-Cola',
        category: 'Boissons',
        imageUrl: PlaceHolderImages.find(img => img.id === 'product-1')?.imageUrl || '',
        imageHint: PlaceHolderImages.find(img => img.id === 'product-1')?.imageHint || '',
        price: 3.5
    },
    {
        id: '2',
        name: 'Chips Lay\'s Classique',
        brand: 'Lay\'s',
        category: 'Snacks',
        imageUrl: PlaceHolderImages.find(img => img.id === 'product-2')?.imageUrl || '',
        imageHint: PlaceHolderImages.find(img => img.id === 'product-2')?.imageHint || '',
        price: 5.0
    },
    {
        id: '3',
        name: 'Eau Sidi Ali 1.5L',
        brand: 'Sidi Ali',
        category: 'Boissons',
        imageUrl: PlaceHolderImages.find(img => img.id === 'product-3')?.imageUrl || '',
        imageHint: PlaceHolderImages.find(img => img.id === 'product-3')?.imageHint || '',
        price: 6.0
    }
]
