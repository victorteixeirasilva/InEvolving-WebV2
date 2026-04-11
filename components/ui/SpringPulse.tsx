"use client";

import { animated, useSpring } from "@react-spring/web";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function SpringPulse() {
  const reduce = useReducedMotion();

  const style = useSpring({
    loop: reduce ? false : { reverse: true },
    from: { opacity: 0.75, transform: "scale(1)" },
    to: { opacity: 1, transform: "scale(1.12)" },
    config: { duration: 1100 },
  });

  return (
    <animated.span
      style={style}
      className="inline-block h-2.5 w-2.5 rounded-full bg-brand-cyan shadow-glow"
      aria-hidden
    />
  );
}
