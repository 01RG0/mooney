import type { CartItem } from "@/lib/types";

export interface ShippingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderConfirmation {
  orderId: string;
  total: number;
  email: string;
  estimatedDelivery: string;
}

export async function submitOrder(
  items: CartItem[],
  details: ShippingDetails,
  total: number,
): Promise<OrderConfirmation> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, shippingDetails: details, total }),
  });

  if (!res.ok) {
    throw new Error("Order submission failed");
  }

  return res.json();
}
