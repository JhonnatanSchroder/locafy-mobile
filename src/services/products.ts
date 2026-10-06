import { allPages } from './resources';
import type { Product } from '@/types/product';
export const getProducts = () => allPages<Product>('/products');
