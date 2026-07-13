import type { CartItem } from "@/lib/types";

/*
 * Order submission lives behind this function so the checkout page never talks to
 * a transport directly. For now it fabricates a confirmation; later this becomes a
 * `POST` to a Node route handler (`/api/orders`) that persists the order.
 */

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
  // Simulate a round-trip so the UI's pending state is real.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const orderId =
    "MC-" +
    Array.from({ length: 6 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(
        Math.floor(Math.random() * 32),
      ),
    ).join("");

  return {
    orderId,
    total,
    email: details.email,
    estimatedDelivery: "5–7 business days",
  };
}
