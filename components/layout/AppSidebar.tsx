"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-config";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg)]/80 py-6 backdrop-blur-glass lg:flex"
      aria-label="Navegação lateral"
    >
      <Link href="/dashboard" className="mb-8 flex justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo/logo-inovasoft-menu.svg"
          alt="InEvolving"
          width={160}
          height={40}
          className="h-9 w-auto"
        />
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-[380ms] ease-liquid",
                active
                  ? "bg-gradient-to-r from-brand-blue/25 to-brand-cyan/15 text-brand-cyan shadow-glow"
                  : "text-[var(--text-primary)] hover:bg-black/5 hover:shadow-glass dark:hover:bg-white/10"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 shrink-0 transition-transform duration-[380ms] ease-liquid group-hover:scale-110",
                  active && "text-brand-cyan"
                )}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
