// Stub minim — formatare RON pentru panoul de admin.
export function useCurrency() {
  return {
    currency: "RON",
    symbol: "lei",
    format: (amount: number) =>
      new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(amount),
    convert: (amount: number) => amount,
  };
}
