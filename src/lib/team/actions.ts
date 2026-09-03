"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { WorkspaceRole } from "@/lib/supabase/types";
import { genericActionError, logServerError } from "@/lib/security/public-errors";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspaces/queries";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readRole(formData: FormData): WorkspaceRole {
  const value = field(formData, "role");
  return value === "admin" ? "admin" : "member";
}

function readEmail(formData: FormData) {
  return field(formData, "email").toLowerCase();
}

function inviteExpiry() {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
}

export async function inviteTeamMember(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Permission requise.")}`);
  }

  const email = readEmail(formData);
  const role = readRole(formData);

  if (!email || !email.includes("@")) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Courriel invalide.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("workspace_invites").upsert(
    {
      workspace_id: workspace.id,
      email,
      role,
      status: "invited",
      invited_by: user.id,
      accepted_by: null,
      accepted_at: null,
      expires_at: inviteExpiry(),
    },
    { onConflict: "workspace_id,email" },
  );

  if (error) {
    logServerError({ action: "invite_team_member", error });
    redirect(`/${locale}/team?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_invite_prepared",
    metadata_json: { email, role },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Invitation préparée. L'envoi courriel sera branché avec Google OAuth ou un service email.")}`);
}

export async function extendTeamInvite(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Permission requise.")}`);
  }

  const inviteId = field(formData, "inviteId");

  if (!inviteId) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Invitation introuvable.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .update({
      status: "invited",
      invited_by: user.id,
      accepted_by: null,
      accepted_at: null,
      expires_at: inviteExpiry(),
    })
    .eq("workspace_id", workspace.id)
    .eq("id", inviteId);

  if (error) {
    logServerError({ action: "extend_team_invite", error });
    redirect(`/${locale}/team?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_invite_extended",
    metadata_json: { inviteId },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Invitation prolongée pour 14 jours.")}`);
}

export async function cancelTeamInvite(locale: Locale, formData: FormData) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Permission requise.")}`);
  }

  const inviteId = field(formData, "inviteId");

  if (!inviteId) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Invitation introuvable.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .update({ status: "disabled" })
    .eq("workspace_id", workspace.id)
    .eq("id", inviteId);

  if (error) {
    logServerError({ action: "cancel_team_invite", error });
    redirect(`/${locale}/team?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_invite_cancelled",
    metadata_json: { inviteId },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Invitation annulée.")}`);
}

async function getManageableMember(locale: Locale, targetUserId: string) {
  const { workspace, membership, user } = await getCurrentWorkspace();

  if (!workspace || !membership || !user) {
    redirect(`/${locale}/onboarding`);
  }

  if (!["owner", "admin"].includes(membership.role)) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Permission requise.")}`);
  }

  if (!targetUserId || targetUserId === user.id) {
    redirect(`/${locale}/team?message=${encodeURIComponent("Cette action n'est pas permise sur votre propre accès.")}`);
  }

  const supabase = await createClient();
  const { data: targetMember, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, status")
    .eq("workspace_id", workspace.id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (error || !targetMember) {
    if (error) {
      logServerError({ action: "get_manageable_member", error });
    }
    redirect(`/${locale}/team?message=${encodeURIComponent(error ? genericActionError(locale) : "Membre introuvable.")}`);
  }

  if (targetMember.role === "owner") {
    redirect(`/${locale}/team?message=${encodeURIComponent("Le propriétaire du workspace ne peut pas être modifié ici.")}`);
  }

  if (membership.role !== "owner" && targetMember.role === "admin") {
    redirect(`/${locale}/team?message=${encodeURIComponent("Seul un owner peut modifier un autre admin.")}`);
  }

  return { supabase, workspace, user, targetMember };
}

export async function updateTeamMemberRole(locale: Locale, formData: FormData) {
  const targetUserId = field(formData, "userId");
  const role = readRole(formData);
  const { supabase, workspace, user, targetMember } = await getManageableMember(locale, targetUserId);

  const { error } = await supabase
    .from("workspace_members")
    .update({ role, status: "active" })
    .eq("workspace_id", workspace.id)
    .eq("user_id", targetUserId);

  if (error) {
    logServerError({ action: "update_team_member_role", error });
    redirect(`/${locale}/team?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_member_role_updated",
    metadata_json: { targetUserId, previousRole: targetMember.role, role },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Rôle mis à jour.")}`);
}

export async function disableTeamMember(locale: Locale, formData: FormData) {
  const targetUserId = field(formData, "userId");
  const { supabase, workspace, user } = await getManageableMember(locale, targetUserId);

  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "disabled" })
    .eq("workspace_id", workspace.id)
    .eq("user_id", targetUserId);

  if (error) {
    logServerError({ action: "disable_team_member", error });
    redirect(`/${locale}/team?message=${encodeURIComponent(genericActionError(locale))}`);
  }

  await supabase.from("shipment_audit_log").insert({
    workspace_id: workspace.id,
    actor_user_id: user.id,
    action: "workspace_member_disabled",
    metadata_json: { targetUserId },
  });

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Membre désactivé.")}`);
}
