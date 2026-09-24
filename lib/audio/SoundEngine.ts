// lib/audio/SoundEngine.ts
import { TonicNote } from '@/types/music';
import { getSwarFrequency } from './tuning';

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
  private harmoniumGain: GainNode | null = null;

  // Real Audio Streaming
  private audioElement: HTMLAudioElement | null = null;
  private isDronePlaying = false;
  private currentTonic: TonicNote | null = null;

  // Volume levels (0.0 to 1.0)
  private droneVolume: number = 0.7;
  private harmoniumVolume: number = 0.85;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.harmoniumGain = this.ctx.createGain();
      this.harmoniumGain.gain.setValueAtTime(this.harmoniumVolume, this.ctx.currentTime);
      this.harmoniumGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setDroneVolume(volume: number): void {
    this.droneVolume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.droneVolume;
    }
  }

  public setHarmoniumVolume(volume: number): void {
    this.harmoniumVolume = Math.max(0, Math.min(1, volume));
    if (this.harmoniumGain && this.ctx) {
      this.harmoniumGain.gain.setValueAtTime(this.harmoniumVolume, this.ctx.currentTime);
    }
  }

  public startRootDrone(root: TonicNote): void {
    this.initContext();

    const targetSrc = TANPURA_AUDIO_MAP[root] || '/audio/tanpura_Csharp.mp3';

    if (this.isDronePlaying && this.currentTonic === root && this.audioElement) {
      return;
    }

    if (this.audioElement) {
      this.audioElement.pause();
    }

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.loop = true;
    }

    this.audioElement.src = targetSrc;
    this.audioElement.volume = this.droneVolume;
    this.audioElement.playbackRate = 1.0;
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

  public async playHarmoniumNote(root: TonicNote, offset: number, durationSec: number = 1.2): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

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
    noteGain.connect(this.harmoniumGain!);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);
  }

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