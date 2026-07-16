export const FREE_SHIPPING_THRESHOLD = 75;
export const STANDARD_SHIPPING = 6.5;

export function computeShipping(subtotal: number): number {
  if (subtotal === 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

