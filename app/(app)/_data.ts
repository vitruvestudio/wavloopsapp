/**
 * Server-only data for the producer (app) layout.
 *
 * Currently just the topbar viewer (avatar + display name + email)
 * so AccountMenu can render the producer's actual identity instead
 * of the hardcoded "Tyler Mills" fallback. More layout-level
 * fetches (subscription tier, unread notif count, etc.) can land
 * here without touching the route group.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface ProducerViewer {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  /** First-letter fallback for the avatar when no upload exists.
   *  Pre-computed server-side so AccountMenu doesn't have to know
   *  the rules. */
  avatarLabel: string;
}

export async function loadProducerViewer(): Promise<ProducerViewer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle<{ name: string | null; avatar_url: string | null }>();

  const email = user.email ?? "";
  const localPart = email.split("@")[0] || "Producer";
  const displayName = profile?.name?.trim() || localPart;

  return {
    userId: user.id,
    email,
    displayName,
    avatarUrl: profile?.avatar_url ?? null,
    avatarLabel: initialsOf(displayName),
  };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
