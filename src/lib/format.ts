const priceFormatter = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
