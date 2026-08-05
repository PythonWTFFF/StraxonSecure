import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a short-lived signed URL for an order's deliverable file.
 * Files live at: {user_id}/{order_id}.pdf in the private `deliverables` bucket.
 */
export async function getSignedDeliverableUrl(
  userId: string,
  orderId: string,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  const path = `${userId}/${orderId}.pdf`;
  const { data, error } = await supabase.storage
    .from("deliverables")
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    console.warn("[storage] signed URL failed", error.message);
    return null;
  }
  return data.signedUrl;
}

/**
 * Future: server-side rendered PDF upload utility.
 * Once an admin/edge function generates a static PDF, push it here.
 */
export async function uploadDeliverable(
  userId: string,
  orderId: string,
  file: Blob,
): Promise<{ path: string } | { error: string }> {
  const path = `${userId}/${orderId}.pdf`;
  const { error } = await supabase.storage
    .from("deliverables")
    .upload(path, file, { upsert: true, contentType: "application/pdf" });
  if (error) return { error: error.message };
  return { path };
}
