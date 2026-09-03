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

  const memberIds = (membersResult.data ?? []).map((member) => member.user_id);
  const profilesResult =
    memberIds.length > 0
      ? await supabase.from("user_profiles").select("user_id,email,full_name,avatar_url").in("user_id", memberIds)
      : { data: [] };
  const profilesByUserId = new Map((profilesResult.data ?? []).map((profile) => [profile.user_id, profile]));

  return {
    members: (membersResult.data ?? []).map((member) => ({
      ...member,
      profile: profilesByUserId.get(member.user_id) ?? null,
    })),
    invites: invitesResult.data ?? [],
  };
}
