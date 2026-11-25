export type CloudValleySfx =
  | 'hoe'
  | 'water'
  | 'seed'
  | 'harvest'
  | 'compost'
  | 'build'
  | 'coin'
  | 'levelup'
  | 'hybrid'
  | 'error';

class CloudValleyAudioController {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(next: boolean): void {
    this.muted = next;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public play(kind: CloudValleySfx): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const jitter = 0.94 + Math.random() * 0.12;

    if (kind === 'hoe') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.095);
      return;
    }

    if (kind === 'water') {
      [520, 680].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * jitter, now + i * 0.035);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + i * 0.035 + 0.07);
        gain.gain.setValueAtTime(0.06, now + i * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.035 + 0.08);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.035);
        osc.stop(now + i * 0.035 + 0.09);
      });
      return;
    }

    if (kind === 'seed') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 * jitter, now);
      osc.frequency.exponentialRampToValueAtTime(620 * jitter, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      return;
    }

    if (kind === 'harvest') {
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * jitter, now + i * 0.04);
        gain.gain.setValueAtTime(0.08, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.15);
      });
      return;
    }

    if (kind === 'compost') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.11);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      return;
    }

    if (kind === 'build') {
      [220, 330].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.04, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.09);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.1);
      });
      return;
    }

    if (kind === 'coin') {
      [987.77, 1318.51].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.07, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.16);
      });
      return;
    }

    if (kind === 'hybrid' || kind === 'levelup') {
      const notes = kind === 'hybrid' ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.09, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.3);
      });
      return;
    }

    if (kind === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.11);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  }
}

export const cloudValleyAudio = new CloudValleyAudioController();
