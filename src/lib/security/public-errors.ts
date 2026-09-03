import type { Locale } from "@/i18n/config";

type ErrorContext = {
  action: string;
  error: unknown;
};

export function logServerError({ action, error }: ErrorContext) {
  console.error(`[Fixtarif:${action}]`, error);
}

export function genericActionError(locale: Locale) {
  return locale === "fr" ? "L'action n'a pas pu être complétée. Réessaie dans un instant." : "The action could not be completed. Please try again shortly.";
}

export function genericAuthError(locale: Locale) {
  return locale === "fr" ? "Connexion impossible avec ces informations." : "Unable to sign in with those credentials.";
}

export function genericOAuthError(locale: Locale) {
  return locale === "fr" ? "Connexion Google impossible pour le moment." : "Google sign-in is not available right now.";
}

export function genericDataError() {
  return "Unable to load this workspace data.";
}
