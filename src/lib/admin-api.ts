import { supabase } from "@/integrations/supabase/client";

export async function deleteUserAsAdmin(userId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("admin-delete-user", {
    body: { userId },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return { success: false, error: data?.error ?? "Delete failed" };
  }

  return { success: true };
}
