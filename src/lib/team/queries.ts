import { createClient } from "@/lib/supabase/server";

export async function getTeamForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("user_id, role, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_invites")
      .select("id, email, role, status, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    members: membersResult.data ?? [],
    invites: invitesResult.data ?? [],
  };
}
