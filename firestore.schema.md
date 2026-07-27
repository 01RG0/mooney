# Firestore Database Schema — Meromade

## Collections Overview

| Collection | Doc ID | Purpose |
|---|---|---|
| `users` | Firebase UID | User profiles, addresses, settings |
| `products` | Auto ID | Product catalogue |
| `categories` | Slug string | Product categories |
| `orders` | `MC-XXXXXX` | Customer orders |
| `reviews` | Auto ID | Product reviews |
| `wishlists` | Firebase UID | Per-user saved products |
| `notifications/{uid}/items` | Auto ID | In-app notifications per user |
| `coupons` | Uppercase code | Discount codes |
| `stockAlerts` | Auto ID | Back-in-stock subscriptions |
| `analytics/productViews/products` | Product ID | View counts per product |
| `analytics/searchTerms/terms` | Normalized term | Search frequency counts |
| `analytics/cartEvents/events` | Auto ID | Add/remove/checkout events |
| `analytics/pageViews/daily` | YYYY-MM-DD | Daily website page view counts |
| `analytics/pageViews/counters/total` | `total` (singleton) | Total website page views since launch |

---

## `users/{uid}`

```
{
  uid:              string            // = Firebase Auth UID
  email:            string
  firstName:        string
  lastName:         string
  name:             string            // firstName + " " + lastName (denormalized)
  username?:        string
  phone?:           string
  avatarUrl?:       string            // ImageKit URL
  role:             "customer" | "admin"
  referral?:        string            // how they found the site
  createdAt:        ISO string
  updatedAt?:       ISO string

  addressProfiles:  AddressProfile[]  // embedded array (max ~10)
}

AddressProfile {
  id:           string  // UUID
  label:        string  // "Home", "Work", etc.
  fullName:     string
  phone:        string
  address:      string
  governorate:  string
  city:         string
  postalCode?:  string
  coordinates?: { lat: number; lng: number }
  isDefault:    boolean
}
```

**Indexes needed:** none (always fetched by UID)

---

## `products/{productId}`

```
{
  id:              string         // = Firestore doc ID
  slug:            string         // URL-safe unique identifier
  name:            string
  category:        "baskets" | "florals" | "stone-art" | "home-decor"
  price:           number         // pence (integer)
  image:           string         // primary image URL (legacy)
  images:          string[]       // full gallery
  mainImageIndex:  number         // index into images[]
  description:     string
  details:         string[]       // bullet points
  colors:          ColorOption[]  // [{ name, hex }]
  maker:           string
  isNew:           boolean
  stock:           number         // available units
  reservedStock?:  number         // held by pending orders
  viewerCount?:    { enabled: boolean; min: number; max: number }
  createdAt:       ISO string
  updatedAt?:      ISO string
}
```

**Indexes:**
- `category ASC + createdAt DESC` — category browse
- `isNew ASC + createdAt DESC` — new arrivals
- `category ASC + price ASC` — price sort within category
- `stock ASC + category ASC` — low-stock admin view

---

## `categories/{slug}`

```
{
  slug:     string   // = doc ID
  name:     string
  tagline:  string
  image:    string
}
```

---

## `orders/{orderId}`

Document ID format: `MC-XXXXXX` (6 uppercase alphanumeric chars)

```
{
  id:             string       // = doc ID
  userId:         string       // Firebase UID
  email:          string
  items:          CartItem[]
  shippingDetails: {
    fullName:   string
    email:      string
    phone?:     string
    address:    string
    city:       string
    governorate?: string
    postalCode: string
    country:    string
  }
  total:          number       // pence
  subtotal:       number       // pence (before shipping)
  shippingCost:   number       // pence
  couponCode?:    string
  discountAmount?: number      // pence
  status:         OrderStatus
  paymentMethod?: "paymob" | "orange-cash" | "cod"
  paymentPhone?:  string
  paymobOrderId?:       string
  paymobTransactionId?: string
  trackingNumber?:      string
  notes?:               string  // admin notes
  createdAt:      ISO string
  updatedAt:      ISO string
}

CartItem {
  id:        string   // productId::color
  productId: string
  slug:      string
  name:      string
  price:     number   // pence at time of order (snapshot)
  image:     string
  color:     string
  quantity:  number
}

OrderStatus = "pending" | "confirmed" | "shipped" | "delivered"
            | "cancelled" | "pending-payment" | "pending-manual-confirmation"
```

**Indexes:**
- `userId ASC + createdAt DESC` — user order history
- `status ASC + createdAt DESC` — admin filter by status
- `paymentMethod ASC + createdAt DESC` — admin filter by payment

---

## `reviews/{reviewId}`

```
{
  id:               string
  productId:        string
  productSlug:      string
  userId:           string
  userDisplayName:  string
  userAvatarUrl?:   string
  orderId:          string    // verified purchase
  rating:           number    // 1–5
  title?:           string
  body:             string
  approved:         boolean   // admin-moderated before showing publicly
  createdAt:        ISO string
  updatedAt?:       ISO string
}
```

**Indexes:**
- `productId ASC + createdAt DESC` — product review list
- `userId ASC + createdAt DESC` — user's review history

---

## `wishlists/{uid}`

```
{
  uid:        string    // = doc ID = Firebase UID
  productIds: string[]  // array of product doc IDs
  updatedAt:  ISO string
}
```

---

## `notifications/{uid}/items/{notifId}`

Sub-collection under each user.

```
{
  id:        string
  type:      "order_confirmed" | "order_shipped" | "order_delivered"
           | "order_cancelled" | "back_in_stock" | "promo"
  title:     string
  body:      string
  read:      boolean
  link?:     string    // e.g. "/account?tab=orders"
  createdAt: ISO string
}
```

**Indexes:**
- `read ASC + createdAt DESC` — show unread first

---

## `coupons/{code}`

Document ID = uppercase coupon code (e.g. `WELCOME10`)

```
{
  code:           string   // = doc ID
  discountType:   "percent" | "fixed"
  discountValue:  number   // percent 0–100, or fixed pence
  minOrderValue?: number   // pence
  maxUses?:       number
  usedCount:      number
  active:         boolean
  expiresAt?:     ISO string
  createdAt:      ISO string
}
```

---

## `stockAlerts/{alertId}`

```
{
  id:           string
  userId:       string
  email:        string
  productId:    string
  productSlug:  string
  productName:  string
  createdAt:    ISO string
  notifiedAt?:  ISO string
}
```

**Indexes:**
- `productId ASC + createdAt ASC` — find all alerts for a product

---

## Analytics (pseudo-singleton pattern)

### `analytics/productViews/products/{productId}`

```
{
  productId:  string
  slug:       string
  views:      number   // incremented via FieldValue.increment(1)
}
```

### `analytics/searchTerms/terms/{normalizedTerm}`

```
{
  term:           string
  count:          number   // FieldValue.increment(1)
  lastSearchedAt: ISO string
}
```

### `analytics/cartEvents/events/{eventId}`

```
{
  type:        "add_to_cart" | "remove_from_cart" | "checkout_started"
  userId?:     string
  productId:   string
  productName: string
  price:       number
  quantity:    number
  color?:      string
  createdAt:   ISO string
}
```

### `analytics/pageViews/daily/{date}`

```
{
  date:   string   // YYYY-MM-DD
  count:  number   // incremented via FieldValue.increment(1)
}
```

### `analytics/pageViews/counters/total`

```
{
  count:      number
  updatedAt:  ISO string
}
```

---

## Security Summary

| Collection | Public read | User read | User write | Admin only write |
|---|---|---|---|---|
| products | ✓ | — | — | ✓ |
| categories | ✓ | — | — | ✓ |
| users | — | own doc | own doc | ✓ |
| orders | — | own orders | create own | update status |
| reviews | ✓ | — | own reviews | approve/delete |
| wishlists | — | own | own | — |
| notifications | — | own | — | create |
| coupons | — | authenticated | — | ✓ |
| stockAlerts | — | own | create/delete own | ✓ |
| analytics (productViews, searchTerms) | — | — | increment | read |
| analytics (pageViews) | — | — | increment | read |
