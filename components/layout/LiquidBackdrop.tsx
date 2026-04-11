"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function LiquidBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute left-1/2 top-1/2 h-[min(140vh,900px)] w-[min(140vw,1200px)] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-40 dark:opacity-25"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1976D2" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#00BCD4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7B2CBF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF006E" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.g
          animate={
            reduce
              ? undefined
              : {
                  rotate: [0, 4, -3, 0],
                  x: [0, 10, -6, 0],
                  y: [0, -8, 5, 0],
                }
          }
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "400px 400px" }}
        >
          <path
            fill="url(#lg1)"
            d="M420,120 Q620,280 520,480 T380,620 Q180,520 120,320 T420,120Z"
          />
        </motion.g>
        <motion.g
          animate={
            reduce
              ? undefined
              : {
                  rotate: [0, -5, 4, 0],
                  x: [0, -10, 8, 0],
                  y: [0, 8, -5, 0],
                }
          }
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "400px 400px" }}
        >
          <path
            fill="url(#lg2)"
            className="mix-blend-multiply dark:mix-blend-screen"
            d="M200,500 Q400,380 620,460 T720,200 Q560,80 340,140 T200,500Z"
          />
        </motion.g>
      </svg>
      <div
        className="animated-gradient-border absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          background:
            "linear-gradient(120deg, rgba(25,118,210,0.15), rgba(0,188,212,0.12), rgba(255,255,255,0.08))",
        }}
      />
    </div>
  );
}
