"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { WorkspaceRole } from "@/lib/supabase/types";
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
    redirect(`/${locale}/team?message=${encodeURIComponent(error.message)}`);
  }

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
    redirect(`/${locale}/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Invitation prolongée pour 14 jours.")}`);
}

export async function cancelTeamInvite(locale: Locale, formData: FormData) {
  const { workspace, membership } = await getCurrentWorkspace();

  if (!workspace || !membership) {
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
    redirect(`/${locale}/team?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/${locale}/team`);
  redirect(`/${locale}/team?message=${encodeURIComponent("Invitation annulée.")}`);
}
