import type { SoundscapeId } from './chronosTypes.ts';

class ChronosAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private activeMode: SoundscapeId = 'none';
  private volume = 0.35;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public stop(): void {
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          (node as AudioScheduledSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // Ignore already stopped audio nodes
      }
    }
    this.activeNodes = [];
    this.masterGain = null;
    this.activeMode = 'none';
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.45, this.ctx.currentTime, 0.08);
    }
  }

  public play(mode: SoundscapeId, vol?: number): void {
    if (vol !== undefined) {
      this.volume = Math.max(0, Math.min(1, vol));
    }
    if (mode === 'none') {
      this.stop();
      return;
    }
    if (this.activeMode === mode && this.activeNodes.length > 0) {
      this.setVolume(this.volume);
      return;
    }

    this.stop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const master = ctx.createGain();
    master.gain.value = this.volume * 0.45;
    master.connect(ctx.destination);
    this.masterGain = master;
    this.activeNodes.push(master);
    this.activeMode = mode;

    if (mode === 'white' || mode === 'brown' || mode === 'rain') {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (mode === 'white') {
            data[i] = white * 0.35;
          } else if (mode === 'brown') {
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 2.6;
          } else {
            // Rain texture: filtered pink/brown blend with subtle droplet shimmer
            lastOut = (lastOut + 0.045 * white) / 1.045;
            const droplet = Math.random() > 0.9985 ? white * 0.45 : 0;
            data[i] = lastOut * 1.45 + white * 0.14 + droplet;
          }
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      if (mode === 'rain') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1150;
        filter.Q.value = 0.55;
        source.connect(filter);
        filter.connect(master);
        this.activeNodes.push(filter);
      } else if (mode === 'white') {
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = 4200;
        source.connect(lpf);
        lpf.connect(master);
        this.activeNodes.push(lpf);
      } else {
        source.connect(master);
      }

      source.start();
      this.activeNodes.push(source);
    } else if (mode === 'binaural40') {
      // 40Hz Gamma Binaural Beats: 200Hz Left Ear, 240Hz Right Ear + soft warm pad
      const merger = ctx.createChannelMerger(2);

      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.value = 200;

      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.value = 240;

      const gainTone = ctx.createGain();
      gainTone.gain.value = 0.28;

      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(gainTone);
      gainTone.connect(master);

      oscL.start();
      oscR.start();
      this.activeNodes.push(oscL, oscR, merger, gainTone);
    }
  }

  public playChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.11 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.7);
    });
  }
}

export const chronosAudio = new ChronosAudioEngine();
