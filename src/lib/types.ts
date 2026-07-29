export type CategorySlug = string;

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  image: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  images: string[];
  stock?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  salePrice?: number;         // if set, shown as sale with original crossed out
  image: string;
  description: string;
  details: string[];
  colors: ColorOption[];
  maker: string;
  isNew?: boolean;
  images?: string[];
  mainImageIndex?: number;
  viewerCount?: { min: number; max: number; enabled: boolean };
  hasColors?: boolean;
  colorVariants?: ColorVariant[];
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
  colorHex?: string;
  selectedColorId?: string;
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
  subtotal?: number;
  deliveryCost?: number;
  discountAmount?: number;
  couponCode?: string;
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
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  governorate?: string;
  coordinates?: { lat: number; lng: number };
  deliveryFee?: number;
  deliveryFeeConfirmed?: boolean;
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

export type DiscountType = "percent" | "fixed" | "free_shipping";

export interface Coupon {
  code: string;               // document ID = uppercase coupon code
  description?: string;       // admin-facing note
  discountType: DiscountType;
  discountValue: number;      // percent (0–100), fixed EGP, or 0 for free_shipping
  minOrderValue?: number;     // minimum subtotal to activate (EGP)
  maxUses?: number;           // null/undefined = unlimited
  usedCount: number;
  maxUsesPerCustomer?: number;// null/undefined = unlimited per customer
  active: boolean;
  expiresAt?: string;         // ISO date string
  appliesToProductIds?: string[];   // empty = all products
  appliesToCategoryIds?: string[];  // empty = all categories
  allowedEmails?: string[];   // empty = all customers
  freeShipping?: boolean;     // explicit free shipping flag
  stackable?: boolean;        // can be combined with other coupons (future)
  createdAt: string;
  updatedAt?: string;
}

export interface CouponUsage {
  couponCode: string;         // document ID
  userId: string;
  orderId: string;
  discountAmount: number;
  usedAt: string;
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
