"use client";

import * as React from "react";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import { appToast } from "@/lib/app-toast";

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

  const audioContextRef = React.useRef<AudioContext | null>(null);
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

  // Handle Alarm Loop
  React.useEffect(() => {
    if (isAlarmPlaying) {
      // Play immediately
      playChime();
      // Then set interval for repetition
      alarmIntervalRef.current = setInterval(() => {
        playChime();
      }, 3000); // Repeat every 3 seconds
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

  // Handle visibility change to sync timer
  React.useEffect(() => {
    const handleVisibilityChange = () => {
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

  const playChime = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
    } catch (e) {}
  };

  const sendNotification = async (title: string, body: string) => {
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
  };

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
  }, [timeLeft, isActive, mode, focusTime, restTime, setMode, setTimeLeft, setEndTime, setIsActive, setIsAlarmPlaying]);

  return null;
}
