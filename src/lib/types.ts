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

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  userId: string;
  email: string;
  items: CartItem[];
  shippingDetails: ShippingDetails;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export type UserRole = "customer" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
}
