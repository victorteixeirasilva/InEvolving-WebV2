"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function AnimatedLink({ href, children, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex text-brand-cyan transition-colors duration-[380ms]",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <span
        className="absolute bottom-0 left-0 h-px w-0 bg-brand-cyan transition-all duration-[380ms] ease-liquid group-hover:w-full"
        aria-hidden
      />
    </Link>
  );
}
