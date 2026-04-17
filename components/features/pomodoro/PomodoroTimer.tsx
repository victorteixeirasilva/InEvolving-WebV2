"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  BellIcon,
  BellSlashIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { GlassSelect } from "@/components/ui/GlassSelect";
import { cn } from "@/lib/utils";
import { appToast } from "@/lib/app-toast";
import { playPomodoroChime, requestPomodoroAudioUnlockOnNextInteraction, unlockPomodoroAudio } from "@/lib/pomodoro-audio";
import { useFullscreenWithMobileFallback } from "@/hooks/use-fullscreen-with-mobile-fallback";
import { usePomodoroFocusWakeLock } from "@/hooks/use-pomodoro-focus-wake-lock";

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
  const fsRef = React.useRef<HTMLDivElement>(null);
  const { isImmersiveFs, isVisualFs, toggleFullscreen: togglePageFullscreen } =
    useFullscreenWithMobileFallback(fsRef);

  usePomodoroFocusWakeLock(isActive, mode);

  // Initialize notifications
  React.useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      }
    }
  }, []);

  // Sync timer after background; iOS re-suspends Web Audio until next gesture
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestPomodoroAudioUnlockOnNextInteraction();
        void unlockPomodoroAudio();
      }
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
    
    void playPomodoroChime();
    sendNotification(title, body);
    appToast.success(title);
  }, [mode, focusTime, restTime, sendNotification]);

  const switchModeManually = React.useCallback(() => {
    const nextMode = mode === "focus" ? "rest" : "focus";
    const nextTime = (nextMode === "focus" ? focusTime : restTime) * 60;
    setMode(nextMode);
    setTimeLeft(nextTime);
    setIsActive(false);
    endTimeRef.current = null;
  }, [mode, focusTime, restTime]);

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
    <div
      ref={fsRef}
      className={cn(
        "w-full",
        "[&:fullscreen]:fixed [&:fullscreen]:inset-0 [&:fullscreen]:z-[200] [&:fullscreen]:box-border [&:fullscreen]:flex [&:fullscreen]:min-h-dvh [&:fullscreen]:w-screen [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:bg-[var(--page-bg)] [&:fullscreen]:p-4",
        isImmersiveFs &&
          "fixed inset-0 z-[200] box-border flex min-h-dvh w-screen items-center justify-center bg-[var(--page-bg)] p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      )}
    >
      <GlassCard
        hoverLift={!isVisualFs}
        className={cn(
          "flex w-full flex-col items-center gap-8 p-8 md:p-12",
          isVisualFs && "mx-auto max-h-[min(100dvh,100%)] max-w-2xl overflow-y-auto shadow-none"
        )}
      >
      <div className="flex w-full items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Pomodoro
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => void togglePageFullscreen()}
            className={cn(
              "rounded-full p-2 transition-colors",
              isVisualFs ? "text-brand-cyan" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            title={
              isVisualFs
                ? "Sair do modo expandido"
                : "Modo expandido — tela cheia no desktop; no iPhone, painel em destaque"
            }
          >
            {isVisualFs ? <ArrowsPointingInIcon className="h-6 w-6" /> : <ArrowsPointingOutIcon className="h-6 w-6" />}
          </button>
          <button
            type="button"
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
      </div>

      <div
        className={cn(
          "relative flex items-center justify-center",
          isVisualFs ? "h-[min(72vw,22rem)] w-[min(72vw,22rem)] sm:h-96 sm:w-96" : "h-64 w-64"
        )}
      >
        {/* Progress Circle */}
        <svg
          viewBox="0 0 256 256"
          className="absolute h-full w-full -rotate-90 transform"
          preserveAspectRatio="xMidYMid meet"
        >
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
          <div
            className={cn(
              "font-bold tabular-nums text-[var(--text-primary)]",
              isVisualFs ? "text-6xl sm:text-7xl" : "text-5xl"
            )}
          >
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
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
          title="Reiniciar o tempo do modo atual"
        >
          <ArrowPathIcon className="h-8 w-8" />
        </Button>
        <Button
          type="button"
          onClick={switchModeManually}
          variant="outline"
          className="h-16 w-16 rounded-full p-0"
          title={
            mode === "focus"
              ? "Trocar para descanso (pausa o timer e usa o tempo de descanso)"
              : "Trocar para foco (pausa o timer e usa o tempo de foco)"
          }
        >
          <ArrowsRightLeftIcon className="h-8 w-8" />
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
    </div>
  );
}
