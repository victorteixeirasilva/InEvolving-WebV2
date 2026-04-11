"use client";

import * as React from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import type { InputProps } from "@/components/ui/Input";

export const DateField = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <CalendarDaysIcon
        className="pointer-events-none absolute left-3 top-1/2 z-[1] h-5 w-5 -translate-y-1/2 text-brand-cyan/80"
        aria-hidden
      />
      <input
        ref={ref}
        type="date"
        className={cn(
          "tap-target w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] py-3 pl-11 pr-3",
          "text-sm text-[var(--text-primary)] backdrop-blur-glass [color-scheme:light]",
          "transition-[box-shadow,border-color] duration-[380ms] ease-liquid",
          "focus:border-brand-cyan focus:shadow-[0_0_0_3px_rgba(0,188,212,0.25)] focus:outline-none",
          "dark:[color-scheme:dark]",
          "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70",
          "dark:[&::-webkit-calendar-picker-indicator]:invert",
          className
        )}
        {...props}
      />
    </div>
  )
);
DateField.displayName = "DateField";
