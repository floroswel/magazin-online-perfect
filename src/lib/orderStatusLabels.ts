/**
 * Centralized Romanian labels for order statuses.
 * Import this everywhere instead of defining inline maps.
 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "În așteptare",
  processing: "În procesare",
  confirmed: "Confirmată",
  shipped: "Expediată",
  delivered: "Livrată",
  cancelled: "Anulată",
  refunded: "Rambursată",
  returned: "Returnată",
  on_hold: "În așteptare",
  payment_failed: "Plată eșuată",
  pending_transfer: "Transfer în așteptare",
  pending_payment: "Plată în așteptare",
};

/** Translate a status key to Romanian. Falls back to the key itself. */
export function translateOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] || status;
}
