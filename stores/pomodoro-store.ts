import { create } from "zustand";
import { persist } from "zustand/middleware";

type TimerMode = "focus" | "rest";

interface PomodoroState {
  focusTime: number;
  restTime: number;
  mode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  endTime: number | null;
  notificationsEnabled: boolean;
  isAlarmPlaying: boolean;
  isExpanded: boolean;

  setFocusTime: (time: number) => void;
  setRestTime: (time: number) => void;
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number) => void;
  setIsActive: (isActive: boolean) => void;
  setEndTime: (endTime: number | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setIsAlarmPlaying: (isPlaying: boolean) => void;
  setIsExpanded: (isExpanded: boolean) => void;

  /** Pausa o timer e troca para o outro modo com a duração completa (sem alarme nem notificação). */
  switchModeManually: () => void;

  reset: () => void;
  tick: () => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      focusTime: 25,
      restTime: 5,
      mode: "focus",
      timeLeft: 25 * 60,
      isActive: false,
      endTime: null,
      notificationsEnabled: false,
      isAlarmPlaying: false,
      isExpanded: false,

      setFocusTime: (time) => {
        set({ focusTime: time });
        if (get().mode === "focus" && !get().isActive) {
          set({ timeLeft: time * 60 });
        }
      },
      setRestTime: (time) => {
        set({ restTime: time });
        if (get().mode === "rest" && !get().isActive) {
          set({ timeLeft: time * 60 });
        }
      },
      setMode: (mode) => set({ mode }),
      setTimeLeft: (timeLeft) => set({ timeLeft }),
      setIsActive: (isActive) => {
        set({ isActive });
        if (isActive) set({ isAlarmPlaying: false }); // Stop alarm if starting new timer
      },
      setEndTime: (endTime) => set({ endTime }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setIsAlarmPlaying: (isAlarmPlaying) => set({ isAlarmPlaying }),
      setIsExpanded: (isExpanded) => set({ isExpanded }),

      switchModeManually: () => {
        const { mode, focusTime, restTime } = get();
        const nextMode: TimerMode = mode === "focus" ? "rest" : "focus";
        set({
          mode: nextMode,
          timeLeft: (nextMode === "focus" ? focusTime : restTime) * 60,
          isActive: false,
          endTime: null,
          isAlarmPlaying: false,
        });
      },

      reset: () => {
        const { mode, focusTime, restTime } = get();
        set({
          isActive: false,
          endTime: null,
          isAlarmPlaying: false,
          timeLeft: (mode === "focus" ? focusTime : restTime) * 60,
        });
      },

      tick: () => {
        const { isActive, endTime } = get();
        if (isActive && endTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
          set({ timeLeft: remaining });
        }
      },
    }),
    {
      name: "pomodoro-storage",
      partialize: (state) => ({
        focusTime: state.focusTime,
        restTime: state.restTime,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);
