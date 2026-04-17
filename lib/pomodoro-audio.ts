/**
 * Single AudioContext for Pomodoro chimes.
 * iOS Safari only unlocks audio after resume() runs in a user gesture; call
 * unlockPomodoroAudio() from Play and after returning from background (see
 * requestPomodoroAudioUnlockOnNextInteraction).
 */

/** Peak gain for the chime (0–1). Higher = louder. */
export const POMODORO_CHIME_PEAK_GAIN = 0.92;

/** How often the alarm repeats while ringing (ms). */
export const POMODORO_ALARM_INTERVAL_MS = 1200;

let sharedContext: AudioContext | null = null;
let removeInteractionUnlock: (() => void) | null = null;

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

/**
 * After iOS suspends the app, AudioContext goes suspended again; resume() from a timer
 * does not count as a user gesture. Install a one-shot listener so the next tap
 * anywhere in the window re-unlocks audio before the next cycle ends.
 */
export function requestPomodoroAudioUnlockOnNextInteraction(): void {
  if (typeof window === "undefined") return;
  removeInteractionUnlock?.();

  let started = false;
  const onInteract = () => {
    if (started) return;
    started = true;
    void unlockPomodoroAudio().finally(() => {
      removeInteractionUnlock?.();
      removeInteractionUnlock = null;
    });
  };

  const opts = { capture: true, passive: true } as const;
  window.addEventListener("pointerdown", onInteract, opts);
  window.addEventListener("touchstart", onInteract, opts);
  removeInteractionUnlock = () => {
    window.removeEventListener("pointerdown", onInteract, opts);
    window.removeEventListener("touchstart", onInteract, opts);
  };
}

export async function playPomodoroChime(): Promise<void> {
  try {
    const ctx = getPomodoroAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(POMODORO_CHIME_PEAK_GAIN, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1);
  } catch {
    // ignore
  }
}
