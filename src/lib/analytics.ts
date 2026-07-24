"use client";

import { getFirestore, doc, increment, setDoc, collection, addDoc } from "firebase/firestore";

// ─── Product view tracking ─────────────────────────────────────────────────
// Call once when a product detail page mounts.
export async function trackProductView(productId: string, productSlug: string) {
  try {
    const db = getFirestore();
    const ref = doc(db, "analytics", "productViews", "products", productId);
    await setDoc(ref, { productId, slug: productSlug, views: increment(1) }, { merge: true });
  } catch {
    // non-fatal
  }
}

// ─── Search term tracking ──────────────────────────────────────────────────
// Call whenever the user submits or debounces a search query.
export async function trackSearch(term: string) {
  if (!term.trim()) return;
  try {
    const db = getFirestore();
    const normalized = term.trim().toLowerCase();
    const ref = doc(db, "analytics", "searchTerms", "terms", normalized);
    await setDoc(ref, { term: normalized, count: increment(1), lastSearchedAt: new Date().toISOString() }, { merge: true });
  } catch {
    // non-fatal
  }
}

// ─── Cart event tracking ───────────────────────────────────────────────────
export type CartEventType = "add_to_cart" | "remove_from_cart" | "checkout_started";

export async function trackCartEvent(
  type: CartEventType,
  payload: {
    userId?: string;
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    color?: string;
  }
) {
  try {
    const db = getFirestore();
    const ref = collection(db, "analytics", "cartEvents", "events");
    await addDoc(ref, {
      type,
      ...payload,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // non-fatal
  }
}
