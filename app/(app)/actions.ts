/**
 * Producer-side shell actions.
 *
 * Currently just one — `markNotificationsReadAction` — fired from
 * the topbar bell dropdown. Each route group's per-page actions
 * live alongside the page (servers/[slug]/actions.ts etc.); this
 * file is reserved for shell-level writes that don't belong to a
 * specific page.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface MarkReadResult {
  error: string | null;
}

/** Marks a set of notifications as read, OR every unread one for
 *  the current user when `ids` is null. RLS via
 *  notifications_own_update gates ownership — we don't re-validate
 *  in app code. Layout revalidate refreshes the bell badge. */
export async function markNotificationsReadAction(
  ids: string[] | null,
): Promise<MarkReadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_user_id", user.id)
    .eq("read", false);
  if (ids !== null) {
    if (ids.length === 0) return { error: null };
    query = query.in("id", ids);
  }
  const { error } = await query;
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { error: null };
}
