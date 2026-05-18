"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isFinanceShareSession } from "@/lib/finance/finance-share-session";

const FINANCE_SHARE_HOME = "/financas/compartilhado";

export function FinanceShareNavGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isFinanceShareSession()) return;
    if (pathname.startsWith("/financas")) return;
    router.replace(FINANCE_SHARE_HOME);
  }, [pathname, router]);

  return <>{children}</>;
}
