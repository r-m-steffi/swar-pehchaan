// lib/audio/SoundEngine.ts
import { TonicNote } from '@/types/music';
import { getSwarFrequency } from './tuning';

// Explicit mapping from every tonic note to its dedicated studio loop
const TANPURA_AUDIO_MAP: Record<TonicNote, string> = {
  'A':      '/audio/tanpura_A.mp3',
  'A#':     '/audio/tanpura_Asharp.mp3',
  'B':      '/audio/tanpura_B.mp3',
  'C':      '/audio/tanpura_C.mp3',
  'C#':     '/audio/tanpura_Csharp.mp3',
  'D':      '/audio/tanpura_D.mp3',
  'D#':     '/audio/tanpura_Dsharp.mp3',
  'E':      '/audio/tanpura_E.mp3',
  'F':      '/audio/tanpura_F.mp3',
  'F#':     '/audio/tanpura_Fsharp.mp3',
  'G':      '/audio/tanpura_G.mp3',
  'G#':     '/audio/tanpura_Gsharp.mp3',
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Real Audio Streaming
  private audioElement: HTMLAudioElement | null = null;
  private isDronePlaying = false;
  private currentTonic: TonicNote | null = null;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Starts or seamlessly updates the authentic Tanpura drone
   * using a dedicated recording for the chosen tonic note.
   */
  public startRootDrone(root: TonicNote): void {
    this.initContext();

    const targetSrc = TANPURA_AUDIO_MAP[root];

    // If already playing the requested key, don't restart it
    if (this.isDronePlaying && this.currentTonic === root && this.audioElement) {
      return;
    }

    // Stop current track if switching keys
    if (this.audioElement) {
      this.audioElement.pause();
    }

    // Instantiate or re-source the audio element
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.loop = true;
      this.audioElement.volume = 0.75;
    }

    this.audioElement.src = targetSrc;
    this.audioElement.playbackRate = 1.0; // Pure acoustic speed, no pitch shifting
    this.currentTonic = root;

    this.audioElement.play().catch((err) => {
      console.warn('Playback requires a user interaction:', err);
    });

    this.isDronePlaying = true;
  }

  public stopRootDrone(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isDronePlaying = false;
    this.currentTonic = null;
  }

  public getIsDronePlaying(): boolean {
    return this.isDronePlaying;
  }

  /**
   * Harmonium Swar Player (Synthesizer)
   */
  public playHarmoniumNote(root: TonicNote, offset: number, durationSec: number = 1.2): void {
    const ctx = this.initContext();
    const freq = getSwarFrequency(root, offset);
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);

    osc1.detune.setValueAtTime(-2.5, now);
    osc2.detune.setValueAtTime(3.5, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(1.5, now);

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(0.38, now + 0.05);
    noteGain.gain.exponentialRampToValueAtTime(0.22, now + durationSec * 0.75);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);
  }

  /**
   * Phrase / Combination Player
   */
  public playSwarSequence(
    root: TonicNote,
    offsets: number[],
    noteDurationSec: number = 0.7,
    gapSec: number = 0.25
  ): void {
    const stepDuration = noteDurationSec + gapSec;

    offsets.forEach((offset, idx) => {
      setTimeout(() => {
        this.playHarmoniumNote(root, offset, noteDurationSec);
      }, idx * stepDuration * 1000);
    });
  }
}

let instance: SoundEngine | null = null;
export function getSoundEngine(): SoundEngine {
  if (!instance) {
    instance = new SoundEngine();
  }
  return instance;
}