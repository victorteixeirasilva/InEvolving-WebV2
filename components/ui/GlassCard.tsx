"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type GlassCardProps = HTMLMotionProps<"div"> & {
  hoverLift?: boolean;
};

export function GlassCard({
  className,
  children,
  hoverLift = true,
  ...props
}: GlassCardProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn("glass-card rounded-2xl p-4 md:p-5", className)}
      whileHover={
        reduce || !hoverLift
          ? undefined
          : {
              y: -4,
              boxShadow:
                "0 0 32px rgba(0, 188, 212, 0.35), 0 20px 50px rgba(25, 118, 210, 0.2)",
            }
      }
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
