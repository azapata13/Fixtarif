import Link from "next/link";
import Image from "next/image";
import { BriefcaseBusiness, Building2, FileText, Home, LockKeyhole, Package, Settings, ShieldCheck, Truck, Users } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import type { WorkspaceRole } from "@/lib/supabase/types";

const navItems = [
  { key: "dashboard", href: "dashboard", icon: Home, managerOnly: false },
  { key: "shipments", href: "shipments", icon: Truck, managerOnly: false },
  { key: "products", href: "products", icon: Package, managerOnly: false },
  { key: "companies", href: "companies", icon: Building2, managerOnly: false },
  { key: "carriers", href: "carriers", icon: BriefcaseBusiness, managerOnly: false },
  { key: "brokers", href: "brokers", icon: ShieldCheck, managerOnly: false },
  { key: "documents", href: "documents", icon: FileText, managerOnly: false },
  { key: "team", href: "team", icon: Users, managerOnly: false },
  { key: "settings", href: "settings", icon: Settings, managerOnly: false },
  { key: "admin", href: "admin", icon: LockKeyhole, managerOnly: true },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  role: WorkspaceRole;
  userEmail: string;
};

export function AppShell({ children, dictionary, locale, role, userEmail }: AppShellProps) {
  const signOutAction = signOut.bind(null, locale);
  const isManager = role === "owner" || role === "admin";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-[var(--line)] bg-white/95 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5 lg:block">
          <div>
            <Image
              alt="Fixtarif"
              className="h-auto w-36"
              height={72}
              priority
              src="/brand/fixtarif-logo.png"
              style={{ width: "144px", height: "auto" }}
              width={144}
            />
          </div>
          <form action={signOutAction}>
            <button className="secondary-button !min-h-11 !px-5 !py-2 !text-sm" type="submit">
              {dictionary.auth.signOut}
            </button>
          </form>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:block lg:space-y-2 lg:overflow-visible">
          {navItems.filter((item) => !item.managerOnly || isManager).map((item) => {
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
