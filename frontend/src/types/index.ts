export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
}

export interface ProductOptionValue {
  id: number;
  name: string;
  price_modifier: number;
  meta?: string;
  image_url?: string;
}

export interface ProductOption {
  id: number;
  name: string;
  values: ProductOptionValue[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number;
  stock: number;
  is_active: boolean;
  category: Category;
  images: ProductImage[];
  options: ProductOption[];
}
