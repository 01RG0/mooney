export type CategorySlug = "baskets" | "florals" | "stone-art" | "home-decor";

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  image: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  image: string;
  description: string;
  details: string[];
  colors: ColorOption[];
  maker: string;
  isNew?: boolean;
}

export interface CartItem {
  /** Stable line id = productId + chosen color, so one product in two colors is two lines. */
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  quantity: number;
}
