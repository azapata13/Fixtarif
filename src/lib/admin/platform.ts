export function isPlatformAdminEmail(email: string | null | undefined) {
  const allowedEmails = (process.env.FIXTARIF_PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
}
