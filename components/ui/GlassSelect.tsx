"use client";

import * as React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export type GlassSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="group relative">
      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-[380ms]",
          "bg-gradient-to-r from-brand-blue/8 via-brand-cyan/10 to-brand-pink/8",
          "group-focus-within:opacity-100"
        )}
        aria-hidden
      />
      <select
        ref={ref}
        className={cn(
          "tap-target relative z-[1] w-full appearance-none rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] py-3 pl-4 pr-11",
          "text-sm font-medium text-[var(--text-primary)] backdrop-blur-glass",
          "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
          "cursor-pointer hover:border-brand-cyan/35",
          "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none",
          "[&>option]:bg-[var(--page-bg)] [&>option]:text-[var(--text-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute right-3 top-1/2 z-[2] h-5 w-5 -translate-y-1/2 text-[var(--text-muted)] transition-colors group-focus-within:text-brand-cyan"
        aria-hidden
      />
    </div>
  )
);
GlassSelect.displayName = "GlassSelect";
