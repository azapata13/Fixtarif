import Link from "next/link";
import { BriefcaseBusiness, Building2, FileText, Home, Package, Settings, ShieldCheck, Truck, Users } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WorkspaceRole } from "@/lib/supabase/types";

const navItems = [
  { key: "dashboard", href: "dashboard", icon: Home },
  { key: "shipments", href: "shipments", icon: Truck },
  { key: "products", href: "products", icon: Package },
  { key: "companies", href: "companies", icon: Building2 },
  { key: "carriers", href: "carriers", icon: BriefcaseBusiness },
  { key: "brokers", href: "brokers", icon: ShieldCheck },
  { key: "documents", href: "documents", icon: FileText },
  { key: "team", href: "team", icon: Users },
  { key: "settings", href: "settings", icon: Settings },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  workspaceName: string;
  role: WorkspaceRole;
  userEmail: string;
};

export function AppShell({ children, dictionary, locale, workspaceName, role, userEmail }: AppShellProps) {
  const signOutAction = signOut.bind(null, locale);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-[var(--line)] bg-white/95 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <div>
            <p className="text-2xl font-semibold tracking-tight">Fixtarif</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{workspaceName}</p>
          </div>
          <form action={signOutAction}>
            <button className="secondary-button !min-h-11 !px-5 !py-2 !text-sm" type="submit">
              {dictionary.auth.signOut}
            </button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-2 lg:overflow-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="focus-ring flex min-h-12 min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold text-neutral-800 transition hover:bg-neutral-100"
                href={`/${locale}/${item.href}`}
                key={item.key}
              >
                <Icon aria-hidden="true" size={21} />
                {dictionary.nav[item.key]}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-[var(--line)] px-5 py-5 text-sm text-[var(--muted)] lg:block">
          <p>{userEmail}</p>
          <p className="mt-1 font-semibold uppercase tracking-wide">{role}</p>
        </div>
      </aside>
      <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
