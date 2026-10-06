import { allPages } from './resources';
import type { Equipment } from '@/types/product';
export const getEquipments = () => allPages<Equipment>('/equipments');
