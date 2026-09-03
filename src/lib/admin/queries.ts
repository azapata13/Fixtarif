import { createClient } from "@/lib/supabase/server";

export async function getAdminOverviewForWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const [
    membersResult,
    businessesResult,
    productsResult,
    carriersResult,
    brokersResult,
    shipmentsResult,
    activeShipmentsResult,
    pendingInvitesResult,
    auditLogResult,
    memberRowsResult,
    inviteRowsResult,
  ] = await Promise.all([
    supabase.from("workspace_members").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("carriers").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("brokers").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("shipments").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("shipments").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("status", "archived"),
    supabase.from("workspace_invites").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "invited"),
    supabase
      .from("shipment_audit_log")
      .select("id, action, actor_user_id, created_at, metadata_json")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("workspace_members")
      .select("user_id, role, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_invites")
      .select("id, email, role, status, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const memberIds = (memberRowsResult.data ?? []).map((member) => member.user_id);
  const profilesResult =
    memberIds.length > 0
      ? await supabase.from("user_profiles").select("user_id,email,full_name,avatar_url").in("user_id", memberIds)
      : { data: [] };
  const profilesByUserId = new Map((profilesResult.data ?? []).map((profile) => [profile.user_id, profile]));

  return {
    counts: {
      members: membersResult.count ?? 0,
      businesses: businessesResult.count ?? 0,
      products: productsResult.count ?? 0,
      carriers: carriersResult.count ?? 0,
      brokers: brokersResult.count ?? 0,
      shipments: shipmentsResult.count ?? 0,
      activeShipments: activeShipmentsResult.count ?? 0,
      pendingInvites: pendingInvitesResult.count ?? 0,
    },
    auditLog: auditLogResult.data ?? [],
    members: (memberRowsResult.data ?? []).map((member) => ({
      ...member,
      profile: profilesByUserId.get(member.user_id) ?? null,
    })),
    invites: inviteRowsResult.data ?? [],
  };
}
