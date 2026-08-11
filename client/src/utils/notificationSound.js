/**
 * notificationSound.js
 *
 * Ultra-lightweight, zero-dependency notification sound synthesizer powered by the Web Audio API.
 * Ensures 100% reliable sound playback across all modern browsers and mobile WebViews without
 * external audio file dependencies or 404 network errors.
 */

let audioCtx = null;

// Get or initialize the AudioContext safely
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Auto-unlock AudioContext on first user gesture to comply with browser autoplay policies
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { passive: true, once: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true, once: true });
  window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
}

// ── Sound Preferences ────────────────────────────────────────────────────────
const SOUND_STORAGE_KEY = "app_notification_sound_enabled";

export const isNotificationSoundEnabled = () => {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
};

export const setNotificationSoundEnabled = (enabled) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent("notification-sound-change", { detail: { enabled } }),
    );
  } catch {}
};

export const toggleNotificationSound = () => {
  const current = isNotificationSoundEnabled();
  const next = !current;
  setNotificationSoundEnabled(next);
  return next;
};

// ── Synthesized Chimes ───────────────────────────────────────────────────────

/**
 * Plays a synthesized notification tone using Web Audio API.
 * @param {'query'|'message'|'chime'|'success'|'pop'|'alert'} type - Type of sound tone
 * @param {Object} options - Optional volume overrides
 */
export const playNotificationSound = (type = "query", options = {}) => {
  if (!isNotificationSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const baseVolume = options.volume !== undefined ? options.volume : 0.28;

    switch (type) {
      case "query":
      case "message": {
        // Elegant, pleasant double-bell chime (D5: 587.33Hz -> A5: 880Hz)
        const notes = [
          { freq: 587.33, start: 0, duration: 0.22, decay: 0.18 },
          { freq: 880.0, start: 0.09, duration: 0.38, decay: 0.32 },
        ];

        notes.forEach(({ freq, start, duration, decay }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + start);

          // Soft bell attack and exponential decay
          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(baseVolume, now + start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + duration + 0.05);
        });
        break;
      }

      case "chime":
      case "notification": {
        // Modern 3-note melodic chime (C5: 523.25Hz -> E5: 659.25Hz -> G5: 783.99Hz)
        const notes = [
          { freq: 523.25, start: 0, duration: 0.16 },
          { freq: 659.25, start: 0.08, duration: 0.18 },
          { freq: 783.99, start: 0.16, duration: 0.35 },
        ];

        notes.forEach(({ freq, start, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + start);

          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(baseVolume * 0.9, now + start + 0.012);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + duration + 0.05);
        });
        break;
      }

      case "success": {
        // Upbeat harmonic arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [
          { freq: 523.25, start: 0, duration: 0.14 },
          { freq: 659.25, start: 0.07, duration: 0.14 },
          { freq: 783.99, start: 0.14, duration: 0.18 },
          { freq: 1046.5, start: 0.21, duration: 0.42 },
        ];

        notes.forEach(({ freq, start, duration }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + start);

          gain.gain.setValueAtTime(0.001, now + start);
          gain.gain.exponentialRampToValueAtTime(baseVolume * 0.85, now + start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + start);
          osc.stop(now + start + duration + 0.05);
        });
        break;
      }

      case "pop": {
        // Subtle interface pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

        gain.gain.setValueAtTime(baseVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }

      default: {
        // Default chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(baseVolume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }
    }
  } catch (err) {
    // Fail silently without disrupting UI
    console.debug("[notificationSound] Playback error:", err);
  }
};

export const testNotificationSound = () => {
  playNotificationSound("query", { volume: 0.32 });
};

export default playNotificationSound;
