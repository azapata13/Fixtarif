import { isSupabaseConfigured } from "@/lib/env";
import { isRecoverableAuthSessionError } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  if (!isSupabaseConfigured()) {
    return { user: null, membership: null, workspace: null };
  }

  const supabase = await createClient();
  const userResult = await supabase.auth.getUser().catch((error) => {
    if (isRecoverableAuthSessionError(error)) {
      return { data: { user: null }, error: null };
    }

    throw error;
  });

  if (userResult.error) {
    if (isRecoverableAuthSessionError(userResult.error)) {
      return { user: null, membership: null, workspace: null };
    }

    throw userResult.error;
  }

  const user = userResult.data.user;

  if (!user) {
    return { user: null, membership: null, workspace: null };
  }

  const membershipQuery = () =>
    supabase
      .from("workspace_members")
      .select("workspace_id, role, status, workspaces(id, name, created_at)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

  let { data: membership } = await membershipQuery();

  if (!membership) {
    await supabase.rpc("accept_pending_workspace_invites");
    const acceptedMembership = await membershipQuery();
    membership = acceptedMembership.data;
  }

  const workspace = Array.isArray(membership?.workspaces) ? membership.workspaces[0] : membership?.workspaces;

  return {
    user,
    membership: membership ?? null,
    workspace: workspace ?? null,
  };
}

export async function getCurrentWorkspaceNoInviteAccept() {
  if (!isSupabaseConfigured()) {
    return { user: null, membership: null, workspace: null };
  }

  const supabase = await createClient();
  const userResult = await supabase.auth.getUser().catch((error) => {
    if (isRecoverableAuthSessionError(error)) {
      return { data: { user: null }, error: null };
    }

    throw error;
  });

  if (userResult.error) {
    if (isRecoverableAuthSessionError(userResult.error)) {
      return { user: null, membership: null, workspace: null };
    }

    throw userResult.error;
  }

  const user = userResult.data.user;

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

export async function getCompanyProfileForWorkspace(workspaceId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("company_profiles")
    .select(
      "id, workspace_id, legal_name, trade_name, address, city, region, postal_code, country, phone, email, tax_number, language, weight_unit, dimension_unit, currency, reference_format",
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return data ?? null;
}
