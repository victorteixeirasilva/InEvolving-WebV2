"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon, PauseIcon, ArrowPathIcon, BellIcon, BellSlashIcon } from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { cn } from "@/lib/utils";
import { appToast } from "@/lib/app-toast";
import { getPomodoroAudioContext, unlockPomodoroAudio } from "@/lib/pomodoro-audio";

type TimerMode = "focus" | "rest";

export function PomodoroTimer() {
  const [focusTime, setFocusTime] = React.useState(25);
  const [restTime, setRestTime] = React.useState(5);
  const [mode, setMode] = React.useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = React.useState(focusTime * 60);
  const [isActive, setIsActive] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = React.useRef<number | null>(null);

  // Initialize notifications
  React.useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  // Handle visibility change to sync timer when coming back from background
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isActive && endTimeRef.current) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
        setTimeLeft(remaining);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      appToast.error("Notificações não suportadas neste navegador.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      appToast.success("Notificações ativadas!");
    } else {
      setNotificationsEnabled(false);
      appToast.error("Permissão de notificação negada.");
    }
  };

  const playChime = async () => {
    try {
      const ctx = getPomodoroAudioContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // A4

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (error) {
      console.error("Erro ao tocar som:", error);
    }
  };

  const sendNotification = React.useCallback(async (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === "granted") {
      // Try to use ServiceWorker for better PWA support if available
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          registration.showNotification(title, {
            body,
            icon: "/logo/logo-svg.svg",
            badge: "/logo/logo-svg.svg",
            vibrate: [200, 100, 200],
            tag: "pomodoro-notification",
            renotify: true,
          } as any);
          return;
        }
      }
      
      // Fallback to standard notification
      new Notification(title, {
        body,
        icon: "/logo/logo-svg.svg",
      });
    }
  }, [notificationsEnabled]);

  const switchMode = React.useCallback(() => {
    const nextMode = mode === "focus" ? "rest" : "focus";
    const nextTime = (nextMode === "focus" ? focusTime : restTime) * 60;
    
    setMode(nextMode);
    setTimeLeft(nextTime);
    endTimeRef.current = Date.now() + nextTime * 1000;
    
    const title = nextMode === "focus" ? "Hora de focar!" : "Hora de descansar!";
    const body = nextMode === "focus" 
      ? `Foco iniciado: ${focusTime} minutos.` 
      : `Descanso iniciado: ${restTime} minutos.`;
    
    void playChime();
    sendNotification(title, body);
    appToast.success(title);
  }, [mode, focusTime, restTime, sendNotification]);

  React.useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        if (endTimeRef.current) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
          setTimeLeft(remaining);
          
          if (remaining === 0) {
            setIsActive(false);
            switchMode();
          }
        }
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      switchMode();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, switchMode]);

  const toggleTimer = async () => {
    if (!isActive) {
      await unlockPomodoroAudio();
      endTimeRef.current = Date.now() + timeLeft * 1000;
    } else {
      endTimeRef.current = null;
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    endTimeRef.current = null;
    const initialTime = (mode === "focus" ? focusTime : restTime) * 60;
    setTimeLeft(initialTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFocusTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setFocusTime(val);
    if (mode === "focus") setTimeLeft(val * 60);
  };

  const handleRestTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setRestTime(val);
    if (mode === "rest") setTimeLeft(val * 60);
  };

  const progress = 1 - timeLeft / ((mode === "focus" ? focusTime : restTime) * 60);

  return (
    <GlassCard className="flex flex-col items-center gap-8 p-8 md:p-12">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Pomodoro
        </h2>
        <button
          onClick={requestNotifications}
          className={cn(
            "rounded-full p-2 transition-colors",
            notificationsEnabled ? "text-brand-cyan" : "text-[var(--text-muted)]"
          )}
          title={notificationsEnabled ? "Notificações Ativadas" : "Ativar Notificações"}
        >
          {notificationsEnabled ? (
            <BellIcon className="h-6 w-6" />
          ) : (
            <BellSlashIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Progress Circle */}
        <svg className="absolute h-full w-full -rotate-90 transform">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-[var(--glass-border)]"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray="753.98"
            initial={{ strokeDashoffset: 753.98 }}
            animate={{ strokeDashoffset: 753.98 * (1 - progress) }}
            className={cn(
              "transition-colors duration-500",
              mode === "focus" ? "text-brand-blue" : "text-brand-purple"
            )}
          />
        </svg>

        <div className="z-10 text-center">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-sm font-semibold uppercase tracking-widest",
              mode === "focus" ? "text-brand-blue" : "text-brand-purple"
            )}
          >
            {mode === "focus" ? "Foco" : "Descanso"}
          </motion.div>
          <div className="text-5xl font-bold tabular-nums text-[var(--text-primary)]">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={toggleTimer}
          className="h-16 w-16 rounded-full p-0"
          variant="primary"
        >
          {isActive ? (
            <PauseIcon className="h-8 w-8" />
          ) : (
            <PlayIcon className="h-8 w-8" />
          )}
        </Button>
        <Button
          onClick={resetTimer}
          variant="outline"
          className="h-16 w-16 rounded-full p-0"
        >
          <ArrowPathIcon className="h-8 w-8" />
        </Button>
      </div>

      <div className="grid w-full grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase">
            Tempo de Foco
          </label>
          <GlassSelect value={focusTime} onChange={handleFocusTimeChange}>
            {[1, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((t) => (
              <option key={t} value={t}>
                {t} min
              </option>
            ))}
          </GlassSelect>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-[var(--text-muted)] uppercase">
            Tempo de Descanso
          </label>
          <GlassSelect value={restTime} onChange={handleRestTimeChange}>
            {[1, 3, 5, 10, 15, 20, 25, 30].map((t) => (
              <option key={t} value={t}>
                {t} min
              </option>
            ))}
          </GlassSelect>
        </div>
      </div>
    </GlassCard>
  );
}
