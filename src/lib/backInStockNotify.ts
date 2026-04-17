import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * After a product's stock is updated from 0 to >0, check for back-in-stock
 * notification subscribers and send them emails.
 */
export async function checkAndNotifyBackInStock(
  productId: string,
  oldStock: number,
  newStock: number
) {
  // Only trigger when restocked (was 0, now > 0)
  if (oldStock !== 0 || newStock <= 0) return;

  try {
    // Find pending notifications
    const { data: requests } = await supabase
      .from("back_in_stock_notifications")
      .select("id, email")
      .eq("product_id", productId)
      .is("notified_at", null);

    if (!requests || requests.length === 0) return;

    // Get product info for the email
    const { data: product } = await supabase
      .from("products")
      .select("name, slug, price, image_url, images")
      .eq("id", productId)
      .single();

    if (!product) return;

    // Send emails (fire-and-forget per subscriber)
    const emailPromises = requests.map((req) =>
      supabase.functions.invoke("send-email", {
        body: {
          type: "back_in_stock",
          to: req.email,
          data: {
            product_name: product.name,
            product_url: `/product/${product.slug}`,
            product_image: product.images?.[0] || product.image_url,
            product_price: product.price,
          },
        },
      }).catch(console.error)
    );

    await Promise.all(emailPromises);

    // Mark all as notified
    const ids = requests.map((r) => r.id);
    await supabase
      .from("back_in_stock_notifications")
      .update({ notified_at: new Date().toISOString() })
      .in("id", ids);

    toast.success(`${requests.length} client(i) notificați că produsul a revenit în stoc!`);
  } catch (err) {
    console.error("Back in stock notification error:", err);
  }
}
