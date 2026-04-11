"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, onClick, type = "button", ...props }, ref) => {
    const reduce = useReducedMotion();
    const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);
    const idRef = React.useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!reduce && e.currentTarget) {
        const r = e.currentTarget.getBoundingClientRect();
        idRef.current += 1;
        setRipples((prev) => [
          ...prev,
          { x: e.clientX - r.left, y: e.clientY - r.top, id: idRef.current },
        ]);
        window.setTimeout(() => {
          setRipples((p) => p.slice(1));
        }, 600);
      }
      onClick?.(e);
    };

    const base =
      "relative inline-flex tap-target items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-[380ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 overflow-hidden";

    const variants = {
      primary:
        "bg-gradient-to-r from-brand-blue to-brand-cyan text-white shadow-glow hover:shadow-glass-lg hover:scale-[1.02] dark:shadow-glow-pink/40 dark:from-brand-purple dark:to-brand-pink",
      ghost:
        "bg-transparent text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10",
      outline:
        "border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-glass text-[var(--text-primary)] hover:border-brand-cyan/50 hover:shadow-glow",
    } as const;

    return (
      <motion.div
        className="inline-block"
        whileTap={reduce ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <button
          ref={ref}
          type={type}
          className={cn(base, variants[variant], className)}
          onClick={handleClick}
          {...props}
        >
          {ripples.map((r) => (
            <span
              key={r.id}
              className="pointer-events-none absolute rounded-full bg-white/35 motion-safe:animate-ripple-expand"
              style={{
                left: r.x,
                top: r.y,
                width: 8,
                height: 8,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          {children}
        </button>
      </motion.div>
    );
  }
);
Button.displayName = "Button";
