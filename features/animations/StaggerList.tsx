"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const container = {
  hidden: { opacity: 0 },
  show: (reduce: boolean) => ({
    opacity: 1,
    transition: reduce
      ? { duration: 0.2 }
      : { staggerChildren: 0.08, delayChildren: 0.06 },
  }),
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: reduce ? 0.2 : 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function StaggerList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      custom={reduce}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={item} custom={reduce} className="h-full min-h-0 min-w-0">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
