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
  images?: string[];
  mainImageIndex?: number;
  viewerCount?: { min: number; max: number; enabled: boolean };
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
  | "cancelled"
  | "pending-payment"
  | "pending-manual-confirmation";

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
  paymentMethod?: "paymob" | "orange-cash" | "cod";
  paymentPhone?: string;
  paymobOrderId?: string;
  paymobTransactionId?: string;
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

export interface AddressProfile {
  id: string
  label: string
  fullName: string
  phone: string
  address: string
  governorate: string
  city: string
  postalCode?: string
  coordinates?: { lat: number; lng: number }
  isDefault: boolean
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  avatarUrl?: string;
  role: UserRole;
  referral?: string;
  createdAt: string;
  addressProfiles?: AddressProfile[];
}

// ─── Product (extended with stock + analytics) ────────────────────────────

export interface ProductStock {
  stock: number;
  reservedStock?: number; // items in active pending orders
}

// ─── Reviews ──────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  productSlug: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string;
  orderId: string;        // must have a delivered order for this product
  rating: number;         // 1–5
  title?: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  approved: boolean;      // admin-moderated
}

// ─── Wishlist ─────────────────────────────────────────────────────────────

export interface Wishlist {
  uid: string;            // document ID = user uid
  productIds: string[];
  updatedAt: string;
}

// ─── Notifications ────────────────────────────────────────────────────────

export type NotificationType =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "back_in_stock"
  | "promo";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Coupons ──────────────────────────────────────────────────────────────

export type DiscountType = "percent" | "fixed";

export interface Coupon {
  code: string;           // document ID = uppercase coupon code
  discountType: DiscountType;
  discountValue: number;  // percent (0–100) or fixed GBP pence
  minOrderValue?: number; // minimum order total in pence to apply
  maxUses?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

// ─── Stock Alerts ─────────────────────────────────────────────────────────

export interface StockAlert {
  id: string;
  userId: string;
  email: string;
  productId: string;
  productSlug: string;
  productName: string;
  createdAt: string;
  notifiedAt?: string;    // set when the alert email is sent
}

// ─── Analytics ────────────────────────────────────────────────────────────

export interface ProductViewRecord {
  productId: string;
  slug: string;
  views: number;
}

export interface SearchTermRecord {
  term: string;
  count: number;
  lastSearchedAt: string;
}

export type CartEventType = "add_to_cart" | "remove_from_cart" | "checkout_started";

export interface CartEvent {
  type: CartEventType;
  userId?: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  color?: string;
  createdAt: string;
}
