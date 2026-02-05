export interface ProductVariant {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  title: string;
  ip: string;
  category: Category;
  image: string;
  description: string;
  basePrice: number;
  stockQuantity?: number;
  materialType?: string;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  productTitle: string;
  variantName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface User {
  email: string;
  isLoggedIn: boolean;
}

export type Category = 
  | '全部'
  | '纸制品' 
  | '3D打印制品' 
  | '角色手办定制' 
  | '吧唧制品' 
  | '雪弗板定制' 
  | 'Cos道具/3D代打';

export const CATEGORIES: Category[] = [
  '全部',
  '纸制品',
  '3D打印制品',
  '角色手办定制',
  '吧唧制品',
  '雪弗板定制',
  'Cos道具/3D代打'
];

export const IPS = [
  '全部',
  '原神',
  '崩坏：星穹铁道',
  '初音未来',
  '明日方舟',
  '排球少年',
  '蓝色监狱',
  '原创/其他'
];
