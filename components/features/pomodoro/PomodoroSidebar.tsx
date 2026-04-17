"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  BellIcon,
  BellSlashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SpeakerXMarkIcon,
  ArrowsRightLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { appToast } from "@/lib/app-toast";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import { unlockPomodoroAudio } from "@/lib/pomodoro-audio";
import { useFullscreenWithMobileFallback } from "@/hooks/use-fullscreen-with-mobile-fallback";
import { usePomodoroFocusWakeLock } from "@/hooks/use-pomodoro-focus-wake-lock";

export function PomodoroSidebar() {
  const {
    focusTime,
    restTime,
    mode,
    timeLeft,
    isActive,
    notificationsEnabled,
    isAlarmPlaying,
    isExpanded,
    setFocusTime,
    setRestTime,
    setNotificationsEnabled,
    setIsActive,
    setEndTime,
    setIsAlarmPlaying,
    setIsExpanded,
    reset,
    switchModeManually,
  } = usePomodoroStore();

  const fsRef = React.useRef<HTMLDivElement>(null);
  const { isImmersiveFs, isVisualFs, toggleFullscreen: toggleSidebarFullscreen } =
    useFullscreenWithMobileFallback(fsRef);

  usePomodoroFocusWakeLock(isActive, mode);

  const requestNotifications = React.useCallback(async () => {
    if (!("Notification" in window)) {
      appToast.error("Notificações não suportadas.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNotificationsEnabled(true);
      appToast.success("Notificações ativadas!");
    } else {
      setNotificationsEnabled(false);
      appToast.error("Permissão negada.");
    }
  }, [setNotificationsEnabled]);

  const toggleTimer = React.useCallback(async () => {
    if (!isActive) {
      await unlockPomodoroAudio();
      setEndTime(Date.now() + timeLeft * 1000);
    } else {
      setEndTime(null);
    }
    setIsActive(!isActive);
  }, [isActive, timeLeft, setEndTime, setIsActive]);

  const formatTime = React.useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const progress = 1 - timeLeft / ((mode === "focus" ? focusTime : restTime) * 60);

  return (
    <div id="pomodoro-sidebar" className="mt-4 px-3">
      <div
        ref={fsRef}
        className={cn(
          "overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)]/50 backdrop-blur-glass transition-all duration-380 ease-liquid",
          "[&:fullscreen]:fixed [&:fullscreen]:inset-0 [&:fullscreen]:z-[200] [&:fullscreen]:min-h-dvh [&:fullscreen]:w-screen [&:fullscreen]:max-w-none [&:fullscreen]:overflow-y-auto [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-[var(--page-bg)]",
          isImmersiveFs &&
            "fixed inset-0 z-[200] min-h-dvh w-screen max-w-none overflow-y-auto rounded-none border-0 bg-[var(--page-bg)] pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
          isVisualFs ? "flex flex-col justify-center p-6" : isExpanded ? "p-4" : "p-3"
        )}
      >
        {isVisualFs ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--text-muted)]">
              InEvolving
            </p>
            <div className="text-center text-6xl font-bold tabular-nums leading-none text-[var(--text-primary)] sm:text-7xl">
              {formatTime(timeLeft)}
            </div>
            <div
              className={cn(
                "text-sm font-semibold uppercase tracking-widest",
                mode === "focus" ? "text-brand-blue" : "text-brand-purple"
              )}
            >
              {mode === "focus" ? "Foco" : "Descanso"}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isAlarmPlaying && (
                <Button
                  type="button"
                  onClick={() => setIsAlarmPlaying(false)}
                  variant="outline"
                  className="h-10 border-brand-pink/40 bg-brand-pink/10 px-3 text-xs text-brand-pink"
                >
                  <SpeakerXMarkIcon className="mr-1 inline h-4 w-4" />
                  Silenciar
                </Button>
              )}
              <Button type="button" onClick={toggleTimer} variant="primary" className="h-10 px-5 text-sm">
                {isActive ? "Pausar" : "Iniciar"}
              </Button>
              <Button
                type="button"
                onClick={() => void toggleSidebarFullscreen()}
                variant="outline"
                className="h-10 gap-2 px-4 text-sm"
              >
                <ArrowsPointingInIcon className="h-4 w-4" />
                Sair do modo expandido
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <svg className="absolute h-full w-full -rotate-90 transform">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-[var(--glass-border)]" />
                    <motion.circle
                      cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="transparent"
                      strokeDasharray="87.96"
                      animate={{ strokeDashoffset: 87.96 * (1 - progress) }}
                      className={mode === "focus" ? "text-brand-blue" : "text-brand-purple"}
                    />
                  </svg>
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">
                    {formatTime(timeLeft).split(":")[0]}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">Pomodoro</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    {mode === "focus" ? "Foco" : "Descanso"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAlarmPlaying && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsAlarmPlaying(false); }}
                    className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-brand-pink/20 text-brand-pink"
                    title="Silenciar alarme"
                  >
                    <SpeakerXMarkIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleSidebarFullscreen();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-all hover:bg-[var(--glass-border)]/30 hover:text-[var(--text-primary)]"
                  title="Modo expandido (tela cheia no desktop; destaque no iPhone)"
                >
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive ? "bg-brand-blue/20 text-brand-blue" : "bg-brand-cyan/20 text-brand-cyan"
                  )}
                >
                  {isActive ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                </button>
                {isExpanded ? <ChevronUpIcon className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDownIcon className="h-4 w-4 text-[var(--text-muted)]" />}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-4 flex flex-col gap-4 overflow-hidden"
                >
                  <div className="text-center text-3xl font-bold tabular-nums text-[var(--text-primary)]">
                    {formatTime(timeLeft)}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" onClick={toggleTimer} variant="primary" className="h-10 px-4 py-0 text-xs">
                      {isActive ? "Pausar" : "Iniciar"}
                    </Button>
                    <Button type="button" onClick={reset} variant="outline" className="h-10 w-10 p-0" title="Reiniciar o tempo do modo atual">
                      <ArrowPathIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={switchModeManually}
                      variant="outline"
                      className="h-10 w-10 p-0"
                      title={mode === "focus" ? "Trocar para descanso" : "Trocar para foco"}
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void toggleSidebarFullscreen()}
                      variant="outline"
                      className="h-10 w-10 p-0"
                      title="Modo expandido"
                    >
                      <ArrowsPointingOutIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={requestNotifications}
                      variant="outline"
                      className={cn("h-10 w-10 p-0", notificationsEnabled && "border-brand-cyan/30 text-brand-cyan")}
                      title="Notificações do navegador"
                    >
                      {notificationsEnabled ? <BellIcon className="h-4 w-4" /> : <BellSlashIcon className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Foco (min)</label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={focusTime}
                        onChange={(e) => {
                          const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                          setFocusTime(val);
                        }}
                        className="h-9 px-3 py-0 text-center text-xs"
                        disabled={isActive}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Pausa (min)</label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={restTime}
                        onChange={(e) => {
                          const val = Math.min(60, Math.max(1, parseInt(e.target.value) || 1));
                          setRestTime(val);
                        }}
                        className="h-9 px-3 py-0 text-center text-xs"
                        disabled={isActive}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
