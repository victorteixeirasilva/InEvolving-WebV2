/**
 * Single AudioContext for Pomodoro chimes.
 * iOS Safari only unlocks audio after resume() runs in a user gesture; the sidebar/page
 * must call unlockPomodoroAudio() when the user starts the timer so alarms can play later.
 */
let sharedContext: AudioContext | null = null;

export function getPomodoroAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("getPomodoroAudioContext is client-only");
  }
  if (!sharedContext) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) {
      throw new Error("AudioContext not supported");
    }
    sharedContext = new Ctor();
  }
  return sharedContext;
}

export async function unlockPomodoroAudio(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const ctx = getPomodoroAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    // ignore — chime will still attempt on cycle end
  }
}
