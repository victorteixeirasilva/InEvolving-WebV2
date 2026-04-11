"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { useMenuStore } from "@/stores/menu-store";

export function MobileDrawer() {
  const open = useMenuStore((s) => s.drawerOpen);
  const setOpen = useMenuStore((s) => s.setDrawerOpen);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-sm transition-opacity duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100 dark:bg-black/55" />
        <Dialog.Content className="fixed left-0 top-0 z-50 flex h-full w-[min(100%,320px)] flex-col border-r border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-glass-lg backdrop-blur-glass transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-4">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/logo-inovasoft-menu.svg"
                alt="InEvolving"
                width={140}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
            <Dialog.Close
              className="tap-target inline-flex items-center justify-center rounded-xl text-[var(--text-muted)] transition-colors duration-[380ms] hover:text-[var(--text-primary)]"
              aria-label="Fechar menu"
            >
              <XMarkIcon className="h-7 w-7" />
            </Dialog.Close>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Navegação">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-[380ms] ease-liquid",
                        active
                          ? "bg-brand-blue/15 text-brand-cyan shadow-glow"
                          : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
                      )}
                    >
                      <Icon className="h-6 w-6 shrink-0 opacity-90" aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
