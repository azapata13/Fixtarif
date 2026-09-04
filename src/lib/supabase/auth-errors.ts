type SupabaseAuthError = {
  code?: string;
  message?: string;
};

export function isExpiredRefreshTokenError(error: unknown) {
  const authError = error as SupabaseAuthError;

  return authError?.code === "refresh_token_already_used" || authError?.message?.includes("Invalid Refresh Token");
}

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token");
}
