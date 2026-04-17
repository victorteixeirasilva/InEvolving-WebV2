"use client";

import * as React from "react";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import { appToast } from "@/lib/app-toast";
import {
  playPomodoroChime,
  POMODORO_ALARM_INTERVAL_MS,
  requestPomodoroAudioUnlockOnNextInteraction,
  unlockPomodoroAudio,
} from "@/lib/pomodoro-audio";

export function PomodoroManager() {
  const {
    isActive,
    timeLeft,
    mode,
    focusTime,
    restTime,
    notificationsEnabled,
    isAlarmPlaying,
    tick,
    setMode,
    setTimeLeft,
    setEndTime,
    setIsActive,
    setIsAlarmPlaying,
  } = usePomodoroStore();

  const alarmIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Global Tick Handler
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, tick]);

  const sendNotification = React.useCallback(async (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg) {
          reg.showNotification(title, {
            body,
            icon: "/logo/logo-svg.svg",
            badge: "/logo/logo-svg.svg",
            vibrate: [200, 100, 200, 100, 200],
            tag: "pomodoro",
            renotify: true,
          } as any);
          return;
        }
      }
      new Notification(title, { body, icon: "/logo/logo-svg.svg" });
    }
  }, [notificationsEnabled]);

  // Handle Alarm Loop
  React.useEffect(() => {
    if (isAlarmPlaying) {
      void playPomodoroChime();
      alarmIntervalRef.current = setInterval(() => {
        void playPomodoroChime();
      }, POMODORO_ALARM_INTERVAL_MS);
    } else {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
    }

    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [isAlarmPlaying]);

  // Sync timer after background; iOS re-suspends AudioContext — re-unlock on next tap
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestPomodoroAudioUnlockOnNextInteraction();
        void unlockPomodoroAudio();
      }
      const { isActive, endTime, setTimeLeft } = usePomodoroStore.getState();
      if (document.visibilityState === "visible" && isActive && endTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Handle Mode Switch when timeLeft reaches 0
  React.useEffect(() => {
    if (timeLeft === 0 && isActive) {
      const nextMode = mode === "focus" ? "rest" : "focus";
      const nextTime = (nextMode === "focus" ? focusTime : restTime) * 60;
      
      // STOP THE TIMER FIRST
      setIsActive(false);
      setEndTime(null);
      
      // START THE ALARM
      setIsAlarmPlaying(true);
      
      const title = nextMode === "focus" ? "Descanso finalizado!" : "Foco finalizado!";
      const body = nextMode === "focus" 
        ? "Hora de voltar ao trabalho!" 
        : "Hora de descansar um pouco.";
      
      // Update store for next state
      setMode(nextMode);
      setTimeLeft(nextTime);
      
      // Trigger alerts
      sendNotification(title, body);
      appToast.success(title);
    }
  }, [timeLeft, isActive, mode, focusTime, restTime, setMode, setTimeLeft, setEndTime, setIsActive, setIsAlarmPlaying, sendNotification]);

  return null;
}
