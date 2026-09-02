import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  if (!isSupabaseConfigured()) {
    return { user: null, membership: null, workspace: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, membership: null, workspace: null };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, status, workspaces(id, name, created_at)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const workspace = Array.isArray(membership?.workspaces) ? membership.workspaces[0] : membership?.workspaces;

  return {
    user,
    membership: membership ?? null,
    workspace: workspace ?? null,
  };
}
