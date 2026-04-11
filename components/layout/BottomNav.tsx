"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV } from "@/components/layout/nav-config";
import { useMenuStore } from "@/stores/menu-store";

export function BottomNav() {
  const pathname = usePathname();
  const setDrawerOpen = useMenuStore((s) => s.setDrawerOpen);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 max-w-[100vw] border-t border-[var(--glass-border)]",
        "bg-[var(--glass-bg)]/95 backdrop-blur-glass lg:hidden",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5",
        "px-0.5 xs:px-1"
      )}
      aria-label="Navegação principal"
    >
      <ul className="flex min-w-0 items-stretch justify-between gap-0">
        {BOTTOM_NAV.map(({ href, label, bottomNavLabel, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const text = bottomNavLabel ?? label;
          return (
            <li key={href} className="min-w-0 flex-1 basis-0">
              <Link
                href={href}
                aria-label={label}
                title={label}
                className={cn(
                  "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1",
                  "text-[10px] font-medium leading-tight transition-all duration-[380ms] ease-liquid",
                  "xs:text-[11px]",
                  active
                    ? "text-brand-cyan shadow-glow"
                    : "text-[var(--text-muted)] active:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
                <span className="block max-w-full break-words px-0.5 text-center">
                  {text}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0 flex-1 basis-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex min-h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1",
              "text-[10px] font-medium leading-tight text-[var(--text-muted)] transition-all duration-[380ms]",
              "active:text-[var(--text-primary)] xs:text-[11px]"
            )}
            aria-label="Abrir menu completo"
            title="Menu"
          >
            <Bars3Icon className="h-6 w-6 shrink-0" aria-hidden />
            <span className="block max-w-full px-0.5 text-center">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
