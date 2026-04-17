import { supabase } from "@/integrations/supabase/client";

type SmsType = "order_confirmation" | "shipping_update" | "delivery_confirmation" | "abandoned_cart" | "admin_alert";

interface SendSmsParams {
  to: string;
  message: string;
  type: SmsType;
  orderId?: string;
}

export async function sendSms({ to, message, type, orderId }: SendSmsParams) {
  const { data, error } = await supabase.functions.invoke("send-sms", {
    body: { to, message, type, order_id: orderId },
  });
  if (error) throw error;
  return data;
}

export function buildOrderConfirmationSms(orderNumber: string, total: number): string {
  return `✅ MamaLucica: Comanda #${orderNumber} (${total} RON) a fost plasată cu succes! Mulțumim!`;
}

export function buildShippingUpdateSms(orderNumber: string, trackingUrl?: string): string {
  const base = `📦 MamaLucica: Comanda #${orderNumber} a fost expediată!`;
  return trackingUrl ? `${base} Tracking: ${trackingUrl}` : base;
}

export function buildDeliveryConfirmationSms(orderNumber: string): string {
  return `🎉 MamaLucica: Comanda #${orderNumber} a fost livrată! Sperăm să te bucuri de produse!`;
}

export function buildAbandonedCartSms(cartTotal: number, couponCode?: string): string {
  let msg = `🛒 MamaLucica: Ai uitat produse în coș (${cartTotal} RON).`;
  if (couponCode) msg += ` Folosește codul ${couponCode} pentru 10% reducere!`;
  msg += " Finalizează comanda acum!";
  return msg;
}

export function buildAdminNewOrderSms(orderNumber: string, total: number, paymentMethod: string): string {
  return `🛒 Comandă nouă #${orderNumber} — ${total} RON — ${paymentMethod}`;
}

export async function getNotificationSettings() {
  const { data } = await supabase
    .from("app_settings")
    .select("value_json")
    .eq("key", "notification_settings")
    .maybeSingle();
  return (data?.value_json as Record<string, unknown>) || {};
}
