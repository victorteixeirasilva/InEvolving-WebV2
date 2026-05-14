"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenIcon } from "@heroicons/react/24/outline";

// Pre-defined to avoid hydration mismatch with Math.random()
const PARTICLES = [
  { id: 0,  x: 8,   y: 18,  size: 2,   dur: 9,  delay: 0.0, color: "#00BCD4" },
  { id: 1,  x: 88,  y: 12,  size: 1.5, dur: 11, delay: 0.5, color: "#1976D2" },
  { id: 2,  x: 25,  y: 72,  size: 2.5, dur: 8,  delay: 1.0, color: "#7B2CBF" },
  { id: 3,  x: 62,  y: 85,  size: 1.5, dur: 12, delay: 1.5, color: "#FF006E" },
  { id: 4,  x: 45,  y: 8,   size: 3,   dur: 7,  delay: 0.3, color: "#00BCD4" },
  { id: 5,  x: 75,  y: 55,  size: 2,   dur: 10, delay: 2.0, color: "#7B2CBF" },
  { id: 6,  x: 15,  y: 45,  size: 1,   dur: 13, delay: 0.8, color: "#1976D2" },
  { id: 7,  x: 92,  y: 68,  size: 2.5, dur: 8,  delay: 1.2, color: "#FF006E" },
  { id: 8,  x: 38,  y: 92,  size: 1.5, dur: 9,  delay: 2.5, color: "#00BCD4" },
  { id: 9,  x: 55,  y: 32,  size: 2,   dur: 11, delay: 0.6, color: "#1976D2" },
  { id: 10, x: 70,  y: 22,  size: 1,   dur: 14, delay: 1.8, color: "#7B2CBF" },
  { id: 11, x: 20,  y: 95,  size: 3,   dur: 7,  delay: 0.2, color: "#FF006E" },
  { id: 12, x: 50,  y: 60,  size: 1.5, dur: 10, delay: 3.0, color: "#00BCD4" },
  { id: 13, x: 80,  y: 40,  size: 2,   dur: 8,  delay: 1.4, color: "#1976D2" },
  { id: 14, x: 35,  y: 25,  size: 2.5, dur: 12, delay: 0.9, color: "#7B2CBF" },
  { id: 15, x: 95,  y: 90,  size: 1,   dur: 9,  delay: 2.2, color: "#FF006E" },
  { id: 16, x: 5,   y: 60,  size: 2,   dur: 11, delay: 0.4, color: "#00BCD4" },
  { id: 17, x: 60,  y: 10,  size: 1.5, dur: 13, delay: 1.7, color: "#1976D2" },
  { id: 18, x: 42,  y: 48,  size: 2,   dur: 7,  delay: 2.8, color: "#7B2CBF" },
  { id: 19, x: 78,  y: 78,  size: 2.5, dur: 10, delay: 0.7, color: "#FF006E" },
  { id: 20, x: 18,  y: 35,  size: 1,   dur: 9,  delay: 3.3, color: "#00BCD4" },
  { id: 21, x: 67,  y: 50,  size: 3,   dur: 8,  delay: 1.1, color: "#1976D2" },
  { id: 22, x: 30,  y: 5,   size: 1.5, dur: 12, delay: 0.1, color: "#7B2CBF" },
  { id: 23, x: 85,  y: 30,  size: 2,   dur: 7,  delay: 2.6, color: "#FF006E" },
];

// Words with metadata for highlighting
interface WordToken {
  text: string;
  highlight: "cyan" | "pink" | null;
}

const TOKENS: WordToken[] = [
  { text: "Você",     highlight: null },
  { text: "será",     highlight: null },
  { text: "a",        highlight: null },
  { text: "mesma",    highlight: null },
  { text: "pessoa",   highlight: null },
  { text: "que",      highlight: null },
  { text: "é",        highlight: null },
  { text: "hoje,",    highlight: null },
  { text: "a",        highlight: null },
  { text: "não",      highlight: null },
  { text: "ser",      highlight: null },
  { text: "pelos",    highlight: null },
  { text: "Livros",   highlight: "cyan" },
  { text: "que",      highlight: null },
  { text: "você",     highlight: null },
  { text: "lê",       highlight: null },
  { text: "e",        highlight: null },
  { text: "as",       highlight: null },
  { text: "pessoas",  highlight: "pink" },
  { text: "com",      highlight: null },
  { text: "quem",     highlight: null },
  { text: "você",     highlight: null },
  { text: "anda",     highlight: null },
];

// ~3.6s for all words: 1.2 delay + 22 * 0.09 stagger + 0.4 last-word anim
const BUTTON_DELAY_MS = 4000;
const AUTO_DISMISS_MS = 9500;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 1.2,
      staggerChildren: 0.09,
    },
  },
};

const wordVariants = {
  hidden:  { opacity: 0, y: 18, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as number[] },
  },
};

interface Props {
  onDismiss: () => void;
}

export function LivrosIntroBanner({ onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Show CTA button after words finish animating in
  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), BUTTON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [handleDismiss]);

  // Call onDismiss after exit animation completes
  useEffect(() => {
    if (dismissed) {
      const t = setTimeout(() => onDismissRef.current(), 650);
      return () => clearTimeout(t);
    }
  }, [dismissed]);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          key="livros-intro"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 130% 90% at 30% 0%, rgba(25,118,210,0.28) 0%, transparent 55%)," +
              "radial-gradient(ellipse 100% 70% at 80% 100%, rgba(123,44,191,0.22) 0%, transparent 50%)," +
              "#09101c",
          }}
          onClick={handleDismiss}
        >
          {/* Cyber grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.045,
              backgroundImage:
                "linear-gradient(rgba(0,188,212,1) 1px, transparent 1px)," +
                "linear-gradient(90deg, rgba(0,188,212,1) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          {/* Glowing orb — top-left */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 500,
              height: 500,
              background:
                "radial-gradient(circle, rgba(25,118,210,0.18) 0%, transparent 70%)",
              left: "-8%",
              top: "-10%",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glowing orb — bottom-right */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 450,
              height: 450,
              background:
                "radial-gradient(circle, rgba(123,44,191,0.16) 0%, transparent 70%)",
              right: "-6%",
              bottom: "-8%",
            }}
            animate={{ scale: [1.15, 1, 1.15], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Glowing orb — top-right accent */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: 280,
              height: 280,
              background:
                "radial-gradient(circle, rgba(255,0,110,0.1) 0%, transparent 70%)",
              right: "10%",
              top: "5%",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />

          {/* Scanning line */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(0,188,212,0.7) 40%, rgba(0,188,212,0.7) 60%, transparent 100%)",
              boxShadow: "0 0 10px rgba(0,188,212,0.5)",
            }}
            animate={{ top: ["-2%", "102%"] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2,
            }}
          />

          {/* Floating particles */}
          {PARTICLES.map((p) => (
            <motion.div
              aria-hidden
              key={p.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size * 4,
                height: p.size * 4,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 7}px ${p.color}80`,
              }}
              animate={{
                y: [-12, 14, -12],
                x: [-7, 7, -7],
                opacity: [0.25, 0.75, 0.25],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Content card */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-7 px-6 sm:px-10 py-10 max-w-3xl mx-auto text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Book icon */}
            <motion.div
              className="relative"
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Pulse glow */}
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-2xl blur-xl"
                style={{ background: "rgba(0,188,212,0.5)" }}
                animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div
                className="relative flex items-center justify-center w-20 h-20 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(25,118,210,0.35), rgba(0,188,212,0.2))",
                  border: "1px solid rgba(0,188,212,0.45)",
                  boxShadow:
                    "0 0 40px rgba(0,188,212,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              >
                <BookOpenIcon
                  className="w-10 h-10"
                  style={{ color: "#00BCD4", filter: "drop-shadow(0 0 6px #00BCD4)" }}
                />
              </div>
            </motion.div>

            {/* Top divider */}
            <motion.div
              className="w-28 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,188,212,0.8), transparent)",
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            />

            {/* Quote */}
            <motion.p
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold leading-relaxed tracking-wide"
              style={{ color: "rgba(255,255,255,0.88)" }}
            >
              {TOKENS.map((token, i) => (
                <motion.span
                  key={i}
                  variants={wordVariants}
                  className="inline-block mr-[0.28em]"
                  style={
                    token.highlight === "cyan"
                      ? {
                          background:
                            "linear-gradient(120deg, #00BCD4 0%, #1976D2 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          fontWeight: 800,
                          filter: "drop-shadow(0 0 10px rgba(0,188,212,0.7))",
                        }
                      : token.highlight === "pink"
                      ? {
                          background:
                            "linear-gradient(120deg, #FF006E 0%, #7B2CBF 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          fontWeight: 800,
                          filter: "drop-shadow(0 0 10px rgba(255,0,110,0.6))",
                        }
                      : {}
                  }
                >
                  {token.text}
                </motion.span>
              ))}
            </motion.p>

            {/* Bottom divider */}
            <motion.div
              className="w-28 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(123,44,191,0.7), transparent)",
              }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 3.5 }}
            />

            {/* CTA button */}
            <AnimatePresence>
              {showButton && (
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.button
                    onClick={handleDismiss}
                    className="relative overflow-hidden px-8 py-3 rounded-xl font-semibold text-sm tracking-widest uppercase"
                    style={{
                      color: "#fff",
                      background:
                        "linear-gradient(135deg, rgba(25,118,210,0.3), rgba(0,188,212,0.18))",
                      border: "1px solid rgba(0,188,212,0.5)",
                      boxShadow:
                        "0 0 32px rgba(0,188,212,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
                    }}
                    whileHover={{
                      scale: 1.04,
                      boxShadow:
                        "0 0 50px rgba(0,188,212,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Shimmer on hover */}
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 30%, rgba(0,188,212,0.15) 50%, transparent 70%)",
                        backgroundSize: "200% 100%",
                      }}
                      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                        repeatDelay: 1,
                      }}
                    />
                    <span className="relative">Começar Leitura →</span>
                  </motion.button>

                  <motion.p
                    className="text-xs tracking-wider uppercase"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    ou clique em qualquer lugar
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Progress bar — auto dismiss countdown */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, #1976D2, #00BCD4, #7B2CBF, #FF006E)",
            }}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
