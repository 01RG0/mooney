"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { trackCartEvent } from "@/lib/analytics";
import type { CartItem } from "@/lib/types";

interface AddItemInput {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  colorHex?: string;
  selectedColorId?: string;
  quantity?: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isHydrated: boolean;
  addItem: (input: AddItemInput) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
}

const STORAGE_KEY = "mermaid-crafted-cart:v1";
// Debounce Firestore writes so rapid add/remove doesn't hammer the DB
const SYNC_DEBOUNCE_MS = 1500;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track whether the current items were restored from Firestore so we don't
  // immediately overwrite a just-restored cart with an empty localStorage state.
  const restoredFromCloud = useRef(false);

  // ── Step 1: hydrate from localStorage on mount ──────────────────────────
  useEffect(() => {
    let saved: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as CartItem[];
    } catch {
      // corrupt storage — start empty
    }
    setItems(saved);
    setIsHydrated(true);
  }, []);

  // ── Step 2: when user logs in, merge their cloud cart ───────────────────
  // If localStorage is empty and Firestore has a saved cart, restore it.
  // If localStorage already has items, keep those (user added items before logging in).
  useEffect(() => {
    if (!isHydrated || !user) return;

    async function restoreCloudCart() {
      try {
        const db = getFirestore();
        const ref = doc(db, "wishlists", user!.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const cloudItems = (snap.data()?.items ?? []) as CartItem[];
        if (cloudItems.length === 0) return;

        setItems((current) => {
          if (current.length > 0) {
            // Local cart wins — merge: add cloud items that aren't already present
            const merged = [...current];
            for (const cloudItem of cloudItems) {
              if (!merged.find((i) => i.id === cloudItem.id)) {
                merged.push(cloudItem);
              }
            }
            restoredFromCloud.current = merged.length !== current.length;
            return merged;
          }
          // No local cart — restore cloud cart entirely
          restoredFromCloud.current = true;
          return cloudItems;
        });
      } catch {
        // non-fatal — cloud restore is best-effort
      }
    }

    void restoreCloudCart();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, user?.uid]);

  // ── Step 3: persist to localStorage after hydration ─────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota / privacy-mode failures
    }
  }, [items, isHydrated]);

  // ── Step 4: sync to Firestore (debounced) for logged-in users ───────────
  useEffect(() => {
    if (!isHydrated || !user) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);

    syncTimer.current = setTimeout(async () => {
      try {
        const db = getFirestore();
        const ref = doc(db, "wishlists", user.uid);
        if (items.length === 0) {
          // Cart is empty — remove the cloud copy so we don't restore an empty cart
          await deleteDoc(ref);
        } else {
          const sub = items.reduce((s, i) => s + i.price * i.quantity, 0);
          await setDoc(ref, {
            uid: user.uid,
            items,
            itemCount: items.reduce((n, i) => n + i.quantity, 0),
            subtotal: sub,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch {
        // non-fatal — sync is best-effort
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [items, isHydrated, user]);

  // ── Cart mutations ───────────────────────────────────────────────────────

  const addItem = useCallback((input: AddItemInput) => {
    const lineId = input.selectedColorId
      ? `${input.productId}::${input.selectedColorId}`
      : `${input.productId}::${input.color}`;
    const qty = input.quantity ?? 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        return prev.map((i) =>
          i.id === lineId ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [
        ...prev,
        {
          id: lineId,
          productId: input.productId,
          slug: input.slug,
          name: input.name,
          price: input.price,
          image: input.image,
          color: input.color,
          colorHex: input.colorHex,
          selectedColorId: input.selectedColorId,
          quantity: qty,
        },
      ];
    });
    void trackCartEvent("add_to_cart", {
      productId: input.productId,
      productName: input.name,
      slug: input.slug,
      price: input.price,
      quantity: qty,
      color: input.color,
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === lineId);
      if (item) {
        void trackCartEvent("remove_from_cart", {
          productId: item.productId,
          productName: item.name,
          slug: item.slug,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
        });
      }
      return prev.filter((i) => i.id !== lineId);
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== lineId)
        : prev.map((i) => (i.id === lineId ? { ...i, quantity } : i)),
    );
  }, []);

  // clear() is called after a successful order — also wipes the cloud copy immediately
  const clear = useCallback(() => {
    setItems([]);
    if (syncTimer.current) clearTimeout(syncTimer.current);
    // Fire-and-forget immediate cloud wipe (don't wait for debounce)
    const currentUser = user;
    if (currentUser) {
      const db = getFirestore();
      deleteDoc(doc(db, "wishlists", currentUser.uid)).catch(() => {});
    }
  }, [user]);

  const count = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    isHydrated,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
