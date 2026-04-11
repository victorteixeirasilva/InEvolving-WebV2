import Link from "next/link";
import { cn } from "@/lib/utils";

const primary =
  "inline-flex tap-target items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-[380ms] bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow hover:shadow-glass-lg hover:scale-[1.02] dark:shadow-glow-pink/40 dark:from-brand-purple dark:to-brand-pink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const outline =
  "inline-flex tap-target items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-[380ms] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-glass text-[var(--text-primary)] hover:border-brand-cyan/50 hover:shadow-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function PrimaryLink({
  href,
  children,
  className,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline";
}) {
  return (
    <Link
      href={href}
      className={cn(variant === "primary" ? primary : outline, className)}
    >
      {children}
    </Link>
  );
}
