import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';
import { Note } from 'tonal';
import {
  ensurePianoSamplesDecoded,
  getDecodedPianoSampleCount,
  getDecodedPianoSampleSnapshot,
  GrandPianoEngine,
  preloadPianoSampleBytes,
} from './grandPianoEngine.ts';
import {
  type BackingInstrumentId,
  type BackingPatternId,
  buildChordTimeline,
  type ConcreteArpeggioPatternId,
  type DrumPatternId,
  encodePcmToWav,
  isSectionMelodyMuted,
  type MelodyInstrumentId,
  type MelodyNote,
  type MelodyPlaybackMode,
  midiToNoteName,
  type MoodStyleId,
  type PianistVoicing,
  type PitchFrame,
  resolveConcreteArpPattern,
  resolveMelodyPlaybackMode,
  resolvePianistVoicing,
  type SketchpadDraft,
  type SongSection,
} from './lyricGrooveEngine.ts';

interface SynthRig {
  grandPiano: GrandPianoEngine;
  rhodes: Tone.PolySynth;
  guitar: Tone.PolySynth;
  bass: Tone.MonoSynth;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.NoiseSynth;
  metronome: Tone.MembraneSynth;
  stringsPad: Tone.PolySynth;
  melodySynth: Tone.PolySynth;
  melodyGuitar: Tone.PolySynth;
  masterGain: Tone.Gain;
  fftAnalyser: Tone.Analyser | null;
  waveAnalyser: Tone.Analyser | null;
  dispose: () => void;
}

function createSynthRig(
  destination: Tone.InputNode,
  enableAnalyser = false,
  predecodedPianoBuffers?: Map<string, AudioBuffer>
): SynthRig {
  const masterGain = new Tone.Gain(0.88);
  masterGain.connect(destination);
  let fftAnalyser: Tone.Analyser | null = null;
  let waveAnalyser: Tone.Analyser | null = null;
  if (enableAnalyser) {
    try {
      fftAnalyser = new Tone.Analyser('fft', 128);
      fftAnalyser.smoothing = 0.78;
      waveAnalyser = new Tone.Analyser('waveform', 128);
      masterGain.connect(fftAnalyser);
      masterGain.connect(waveAnalyser);
    } catch {
      fftAnalyser = null;
      waveAnalyser = null;
    }
  }
  const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.22 }).connect(masterGain);

  // Concert Grand Piano studio sample + acoustic engine
  const grandPiano = new GrandPianoEngine(
    masterGain.context,
    masterGain.input,
    predecodedPianoBuffers
  );

  const rhodesFilter = new Tone.Filter(3400, 'lowpass').connect(reverb);
  const rhodes = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 1.45,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.012, decay: 0.55, sustain: 0.34, release: 0.95 },
    modulationEnvelope: { attack: 0.008, decay: 0.24, sustain: 0.08, release: 0.38 },
    volume: -7,
  }).connect(rhodesFilter);

  const guitarFilter = new Tone.Filter(2600, 'lowpass').connect(reverb);
  const guitar = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle4' },
    envelope: { attack: 0.005, decay: 0.52, sustain: 0.14, release: 0.72 },
    volume: -6,
  }).connect(guitarFilter);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { Q: 1.2, type: 'lowpass', rolloff: -12 },
    envelope: { attack: 0.025, decay: 0.34, sustain: 0.45, release: 0.38 },
    filterEnvelope: {
      attack: 0.014,
      decay: 0.22,
      sustain: 0.28,
      release: 0.3,
      baseFrequency: 68,
      octaves: 1.4,
    },
    volume: -12,
  }).connect(masterGain);

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 4.5,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.28, sustain: 0.01, release: 0.25 },
    volume: -6,
  }).connect(masterGain);

  const snareFilter = new Tone.Filter(1800, 'bandpass').connect(reverb);
  const snare = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.003, decay: 0.14, sustain: 0 },
    volume: -14,
  }).connect(snareFilter);

  const hatFilter = new Tone.Filter(6800, 'highpass').connect(masterGain);
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.045, sustain: 0 },
    volume: -20,
  }).connect(hatFilter);

  const metronome = new Tone.MembraneSynth({
    pitchDecay: 0.012,
    octaves: 2.0,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.025 },
    volume: -12,
  }).connect(masterGain);

  const stringsFilter = new Tone.Filter(1250, 'lowpass').connect(reverb);
  const stringsPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth4' },
    envelope: { attack: 0.56, decay: 0.38, sustain: 0.7, release: 1.55 },
    volume: -18,
  }).connect(stringsFilter);

  const synthFilter = new Tone.Filter(2300, 'lowpass').connect(reverb);
  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth4' },
    envelope: { attack: 0.025, decay: 0.25, sustain: 0.52, release: 0.45 },
    volume: -8,
  }).connect(synthFilter);

  const melodyGuitar = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle4' },
    envelope: { attack: 0.004, decay: 0.46, sustain: 0.18, release: 0.48 },
    volume: -5,
  }).connect(guitarFilter);

  return {
    grandPiano,
    rhodes,
    guitar,
    bass,
    kick,
    snare,
    hat,
    metronome,
    stringsPad,
    melodySynth,
    melodyGuitar,
    masterGain,
    fftAnalyser,
    waveAnalyser,
    dispose: () => {
      grandPiano.dispose();
      rhodes.dispose();
      rhodesFilter.dispose();
      guitar.dispose();
      guitarFilter.dispose();
      bass.dispose();
      kick.dispose();
      snare.dispose();
      snareFilter.dispose();
      hat.dispose();
      hatFilter.dispose();
      metronome.dispose();
      stringsPad.dispose();
      stringsFilter.dispose();
      melodySynth.dispose();
      synthFilter.dispose();
      melodyGuitar.dispose();
      reverb.dispose();
      fftAnalyser?.dispose();
      waveAnalyser?.dispose();
      masterGain.dispose();
    },
  };
}

let liveRig: SynthRig | null = null;
let activeLoopParts: Tone.Part[] = [];
let playheadRafId = 0;
let progressionTimers: number[] = [];
let activePlaybackSessionId = 0;
let activeEndTimerId = 0;
let analyserTimeBuf: Float32Array<ArrayBuffer> | null = null;
let analyserFreqBuf: Uint8Array<ArrayBuffer> | null = null;

function ensureLiveRig(): SynthRig {
  if (!liveRig) {
    liveRig = createSynthRig(Tone.getDestination(), true);
  }
  return liveRig;
}

export function warmConcertGrandSamples(): Promise<void> {
  return preloadPianoSampleBytes();
}

export function getLoadedPianoSampleCount(): number {
  return getDecodedPianoSampleCount();
}

async function ensureLivePianoSamplesReady(rig: SynthRig, maxWaitMs = 2500): Promise<void> {
  if (rig.grandPiano.hasDecodedSamples() && getDecodedPianoSampleCount() >= 30) {
    return;
  }
  await Promise.race([
    rig.grandPiano.ensureLoaded().then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, maxWaitMs)),
  ]);
}

export interface LiveAudioFrame {
  waveform: Float32Array;
  spectrum: Uint8Array;
  rms: number;
}

export function getLiveAudioFrame(): LiveAudioFrame | null {
  const fft = liveRig?.fftAnalyser;
  const wave = liveRig?.waveAnalyser;
  if (!fft || !wave) return null;

  const waveVals = wave.getValue();
  const fftVals = fft.getValue();
  const waveArr = waveVals instanceof Float32Array ? waveVals : waveVals[0];
  const fftArr = fftVals instanceof Float32Array ? fftVals : fftVals[0];
  if (!waveArr || !fftArr) return null;

  if (!analyserTimeBuf || analyserTimeBuf.length !== waveArr.length) {
    analyserTimeBuf = new Float32Array(new ArrayBuffer(waveArr.length * 4));
  }
  if (!analyserFreqBuf || analyserFreqBuf.length !== fftArr.length) {
    analyserFreqBuf = new Uint8Array(new ArrayBuffer(fftArr.length));
  }

  let sumSq = 0;
  for (let i = 0; i < waveArr.length; i++) {
    const sample = Number.isFinite(waveArr[i]) ? waveArr[i] : 0;
    analyserTimeBuf[i] = sample;
    sumSq += sample * sample;
  }
  for (let i = 0; i < fftArr.length; i++) {
    const db = Number.isFinite(fftArr[i]) ? fftArr[i] : -100;
    analyserFreqBuf[i] = Math.max(0, Math.min(255, Math.round(((db + 92) / 68) * 255)));
  }

  const rms = Math.sqrt(sumSq / Math.max(1, waveArr.length));
  return {
    waveform: analyserTimeBuf,
    spectrum: analyserFreqBuf,
    rms,
  };
}

export function setMasterVolume(gain: number): void {
  const clamped = Math.max(0, Math.min(1, gain));
  if (liveRig) {
    try {
      liveRig.masterGain.gain.rampTo(clamped, 0.08);
    } catch {
      liveRig.masterGain.gain.value = clamped;
    }
  }
}

function resolveMidisFromNoteNames(notes: string[]): number[] {
  return notes
    .map((n) => Note.midi(n))
    .filter((m): m is number => typeof m === 'number');
}

function triggerGrandPianoBacking(
  rig: SynthRig,
  bassMidis: number[],
  rightHandMidis: number[],
  durationBeats: number,
  secPerBeat: number,
  time: number,
  pattern: BackingPatternId,
  sustainPedal: boolean
) {
  if (rightHandMidis.length === 0 && bassMidis.length === 0) return;
  const totalDurSec = Math.max(0.28, durationBeats * secPerBeat);
  const concretePattern: ConcreteArpeggioPatternId =
    resolveConcreteArpPattern(pattern) ?? 'ballad-wave';
  const lastRhIdx = Math.max(0, rightHandMidis.length - 1);
  const rootMidi = bassMidis[0] ?? (rightHandMidis[0] ? rightHandMidis[0] - 12 : 48);
  const fifthMidi = bassMidis[1] ?? rootMidi + 7;

  if (concretePattern === 'ballad-wave') {
    // Bass root beat 0, gentle fifth at 0.5 beat, warm octave color at 1.0 beat
    rig.grandPiano.triggerNote(
      rootMidi,
      Math.min(totalDurSec * 0.96, 2.9),
      time,
      0.43,
      sustainPedal
    );
    if (durationBeats >= 1.25) {
      rig.grandPiano.triggerNote(
        fifthMidi,
        Math.min(totalDurSec * 0.8, 2.1),
        time + secPerBeat * 0.5,
        0.29,
        sustainPedal
      );
    }
    if (durationBeats >= 1.75 && rootMidi + 12 <= 58) {
      rig.grandPiano.triggerNote(
        rootMidi + 12,
        Math.min(totalDurSec * 0.7, 1.8),
        time + secPerBeat,
        0.26,
        sustainPedal
      );
    }

    // Soft rolled RH pad on beat 0 with natural finger roll
    rightHandMidis.forEach((midi, idx) => {
      const isTop = idx === lastRhIdx;
      rig.grandPiano.triggerNote(
        midi,
        Math.min(totalDurSec * 0.88, 2.2),
        time + idx * 0.016,
        isTop ? 0.39 : 0.25 + (idx % 2) * 0.025,
        sustainPedal
      );
    });

    // Gentle 8th-note ballad ripple (velvet touch) from beat 1.5 onward
    if (rightHandMidis.length >= 2 && durationBeats >= 2) {
      const steps = Math.floor((durationBeats - 0.35) / 0.5);
      for (let s = 3; s <= steps; s++) {
        const noteIdx = (s - 2) % rightHandMidis.length;
        const targetMidi = rightHandMidis[noteIdx];
        const vel = noteIdx === lastRhIdx ? 0.29 : 0.21;
        rig.grandPiano.triggerNote(
          targetMidi,
          Math.max(0.48, secPerBeat * 1.0),
          time + s * 0.5 * secPerBeat + (s % 2 === 1 ? 0.004 : 0),
          vel,
          sustainPedal
        );
      }
    }
    return;
  }

  if (concretePattern === 'lofi-broken') {
    // Dusty, breathing Lofi Piano voicing with subtle pocket swing & airy spaces
    rig.grandPiano.triggerNote(
      rootMidi,
      Math.min(totalDurSec * 0.95, 2.6),
      time,
      0.44,
      sustainPedal
    );
    if (durationBeats >= 1.75) {
      rig.grandPiano.triggerNote(
        fifthMidi,
        Math.min(totalDurSec * 0.72, 1.8),
        time + secPerBeat * 1.52,
        0.32,
        sustainPedal
      );
    }
    const brokenOffsets = [0.18, 0.78, 1.78, 2.75, 3.52].filter(
      (b) => b < durationBeats - 0.2
    );
    brokenOffsets.forEach((beatOff, stepIdx) => {
      const midi = rightHandMidis[stepIdx % rightHandMidis.length];
      if (midi === undefined) return;
      const isColor = stepIdx === brokenOffsets.length - 1 || stepIdx === 0;
      rig.grandPiano.triggerNote(
        midi,
        Math.max(0.48, secPerBeat * 1.15),
        time + beatOff * secPerBeat,
        isColor ? 0.38 : 0.26,
        sustainPedal
      );
    });
    return;
  }

  if (concretePattern === 'rising-arp') {
    // Ascending harp-like arpeggio from bass up through upper chord extensions
    const allNotes = [rootMidi, fifthMidi, ...rightHandMidis];
    const uniqueAsc = allNotes.filter((m, idx) => idx === 0 || m !== allNotes[idx - 1]);
    const stepBeats =
      durationBeats >= 3.5 ? 0.5 : Math.max(0.25, (durationBeats * 0.72) / Math.max(2, uniqueAsc.length));
    uniqueAsc.forEach((midi, idx) => {
      const beatPos = idx * stepBeats;
      if (beatPos >= durationBeats - 0.15) return;
      const progress = idx / Math.max(1, uniqueAsc.length - 1);
      rig.grandPiano.triggerNote(
        midi,
        Math.max(0.55, (durationBeats - beatPos) * secPerBeat * 0.92),
        time + beatPos * secPerBeat,
        0.32 + progress * 0.12,
        sustainPedal
      );
    });
    // Gentle echo of upper two notes at tail if 4-beat bar
    if (durationBeats >= 3.5 && rightHandMidis.length >= 2) {
      rig.grandPiano.triggerNote(
        rightHandMidis[lastRhIdx - 1],
        secPerBeat * 0.9,
        time + 3.0 * secPerBeat,
        0.27,
        sustainPedal
      );
      rig.grandPiano.triggerNote(
        rightHandMidis[lastRhIdx],
        secPerBeat * 0.85,
        time + 3.5 * secPerBeat,
        0.31,
        sustainPedal
      );
    }
    return;
  }

  if (concretePattern === 'falling-arp') {
    // Luminous top note + bass pinch on beat 0, then cascading downward
    rig.grandPiano.triggerNote(
      rootMidi,
      Math.min(totalDurSec * 0.95, 2.7),
      time,
      0.46,
      sustainPedal
    );
    const descNotes = [...rightHandMidis].reverse();
    if (descNotes[0] !== undefined) {
      rig.grandPiano.triggerNote(
        descNotes[0],
        Math.min(totalDurSec * 0.88, 2.2),
        time + 0.012,
        0.44,
        sustainPedal
      );
    }
    const stepBeats = durationBeats >= 3 ? 0.5 : Math.max(0.25, (durationBeats * 0.65) / Math.max(2, descNotes.length));
    descNotes.slice(1).forEach((midi, idx) => {
      const beatPos = (idx + 1) * stepBeats;
      if (beatPos >= durationBeats - 0.15) return;
      rig.grandPiano.triggerNote(
        midi,
        Math.max(0.45, (durationBeats - beatPos) * secPerBeat * 0.85),
        time + beatPos * secPerBeat,
        Math.max(0.25, 0.36 - idx * 0.03),
        sustainPedal
      );
    });
    if (durationBeats >= 3 && fifthMidi) {
      rig.grandPiano.triggerNote(
        fifthMidi,
        secPerBeat * 1.1,
        time + (durationBeats - 1) * secPerBeat,
        0.31,
        sustainPedal
      );
    }
    return;
  }

  if (concretePattern === 'pinch-plucked') {
    // Acoustic fingerstyle pinch: bass + top note together, alternating thumb & inner strings
    const topMidi = rightHandMidis[lastRhIdx] ?? rootMidi + 12;
    rig.grandPiano.triggerNote(
      rootMidi,
      Math.min(totalDurSec * 0.92, 2.3),
      time,
      0.46,
      sustainPedal
    );
    rig.grandPiano.triggerNote(
      topMidi,
      Math.min(totalDurSec * 0.82, 1.8),
      time + 0.008,
      0.42,
      sustainPedal
    );
    const innerPool =
      rightHandMidis.length > 1 ? rightHandMidis.slice(0, lastRhIdx) : rightHandMidis;
    const pluckBeats = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].filter(
      (b) => b < durationBeats - 0.15
    );
    pluckBeats.forEach((beatOff, pIdx) => {
      if (pIdx === 3 && durationBeats >= 2.5) {
        // Thumb alternates to fifth on beat 2
        rig.grandPiano.triggerNote(
          fifthMidi,
          secPerBeat * 0.9,
          time + beatOff * secPerBeat,
          0.34,
          sustainPedal
        );
      } else {
        const midi =
          pIdx % 2 === 1 && rightHandMidis.length >= 2
            ? topMidi
            : innerPool[pIdx % Math.max(1, innerPool.length)] ?? topMidi;
        rig.grandPiano.triggerNote(
          midi,
          Math.max(0.35, secPerBeat * 0.8),
          time + beatOff * secPerBeat,
          0.27 + (pIdx % 2) * 0.05,
          sustainPedal
        );
      }
    });
    return;
  }

  if (concretePattern === 'pop-comp') {
    const hitBeats = [0, 1.5, 3].filter((b) => b < durationBeats - 0.2);
    hitBeats.forEach((beatOff, hitIdx) => {
      const hitTime = time + beatOff * secPerBeat;
      const isDownbeat = hitIdx === 0;
      const durSec = isDownbeat
        ? Math.min(totalDurSec * 0.72, secPerBeat * 1.35)
        : Math.max(0.28, secPerBeat * 0.65);

      if (isDownbeat || beatOff >= 2.5) {
        bassMidis.forEach((bm, bi) => {
          rig.grandPiano.triggerNote(
            bm,
            Math.max(0.4, secPerBeat * 1.3),
            hitTime + bi * 0.01,
            isDownbeat ? (bi === 0 ? 0.5 : 0.36) : 0.38,
            sustainPedal
          );
        });
      }

      rightHandMidis.forEach((midi, idx) => {
        const isTop = idx === lastRhIdx;
        rig.grandPiano.triggerNote(
          midi,
          durSec,
          hitTime + idx * 0.008,
          isDownbeat ? (isTop ? 0.44 : 0.35) : isTop ? 0.36 : 0.28,
          sustainPedal
        );
      });
    });
    return;
  }

  // 'rich-block': Concert Grand full two-hand chord with micro-roll + midpoint breathe
  bassMidis.forEach((bm, bi) => {
    rig.grandPiano.triggerNote(
      bm,
      Math.min(totalDurSec * 0.96, 2.8),
      time + bi * 0.012,
      bi === 0 ? 0.52 : 0.38,
      sustainPedal
    );
  });

  rightHandMidis.forEach((midi, idx) => {
    const isTop = idx === lastRhIdx;
    rig.grandPiano.triggerNote(
      midi,
      Math.min(totalDurSec * 0.94, 2.5),
      time + 0.008 + idx * 0.013,
      isTop ? 0.46 : 0.34 + (idx % 2) * 0.03,
      sustainPedal
    );
  });

  if (durationBeats >= 3 && rightHandMidis.length >= 2) {
    const midTime = time + durationBeats * 0.5 * secPerBeat;
    rightHandMidis.slice(1).forEach((midi, idx) => {
      rig.grandPiano.triggerNote(
        midi,
        Math.min(totalDurSec * 0.45, 1.35),
        midTime + idx * 0.012,
        0.29,
        sustainPedal
      );
    });
  }
}

function triggerChordWithStyle(
  rig: SynthRig,
  instrument: BackingInstrumentId,
  notes: string[],
  bassNote: string,
  durationBeats: number,
  secPerBeat: number,
  time: number,
  options?: {
    rightHandMidis?: number[];
    bassMidis?: number[];
    backingPattern?: BackingPatternId;
    sustainPedal?: boolean;
    addSoftBass?: boolean;
  }
) {
  if (notes.length === 0) return;
  const durationSec = Math.max(0.25, durationBeats * secPerBeat);
  const pattern = options?.backingPattern ?? 'ballad-wave';
  const concretePattern: ConcreteArpeggioPatternId =
    resolveConcreteArpPattern(pattern) ?? 'ballad-wave';
  const sustainPedal = options?.sustainPedal ?? true;

  if (instrument === 'piano-ballad') {
    const rightMidis =
      options?.rightHandMidis && options.rightHandMidis.length > 0
        ? options.rightHandMidis
        : resolveMidisFromNoteNames(notes);
    const bassRootFallback = Note.midi(bassNote) ?? 48;
    const bassMidis =
      options?.bassMidis && options.bassMidis.length > 0
        ? options.bassMidis
        : [bassRootFallback];

    triggerGrandPianoBacking(
      rig,
      bassMidis,
      rightMidis,
      durationBeats,
      secPerBeat,
      time,
      concretePattern,
      sustainPedal
    );
    if (options?.addSoftBass) {
      rig.bass.triggerAttackRelease(
        bassNote,
        Math.min(durationSec * 0.72, 1.9),
        time,
        0.34
      );
      if (durationBeats >= 3.25) {
        rig.bass.triggerAttackRelease(
          bassNote,
          Math.max(0.35, secPerBeat * 1.1),
          time + secPerBeat * 2.5,
          0.26
        );
      }
    }
    return;
  }

  if (instrument === 'guitar-strum') {
    if (concretePattern === 'rising-arp' || concretePattern === 'pinch-plucked') {
      const order = concretePattern === 'rising-arp' ? notes : [...notes.slice(1), notes[0]];
      order.forEach((n, idx) => {
        const beatOff = idx * Math.min(0.45, (durationBeats * 0.65) / Math.max(2, order.length));
        rig.guitar.triggerAttackRelease(
          n,
          Math.min(durationSec * 0.85, 1.35),
          time + beatOff * secPerBeat,
          idx === order.length - 1 ? 0.5 : 0.42
        );
      });
    } else if (concretePattern === 'falling-arp') {
      const desc = [...notes].reverse();
      desc.forEach((n, idx) => {
        const beatOff = idx * Math.min(0.42, (durationBeats * 0.65) / Math.max(2, desc.length));
        rig.guitar.triggerAttackRelease(
          n,
          Math.min(durationSec * 0.8, 1.3),
          time + beatOff * secPerBeat,
          idx === 0 ? 0.5 : 0.38
        );
      });
    } else if (concretePattern === 'pop-comp' && durationBeats >= 2) {
      [0, 1.5, 3]
        .filter((b) => b < durationBeats - 0.2)
        .forEach((beatOff, hIdx) => {
          notes.forEach((n, idx) => {
            rig.guitar.triggerAttackRelease(
              n,
              hIdx === 0 ? Math.min(durationSec * 0.6, 0.9) : 0.36,
              time + beatOff * secPerBeat + idx * 0.018,
              hIdx === 0 ? 0.52 : 0.38
            );
          });
        });
    } else {
      const strumSpacing =
        concretePattern === 'lofi-broken'
          ? 0.068
          : concretePattern === 'ballad-wave'
          ? 0.052
          : 0.026;
      notes.forEach((n, idx) => {
        rig.guitar.triggerAttackRelease(
          n,
          Math.min(durationSec, 1.5),
          time + idx * strumSpacing,
          0.52
        );
      });
      if (durationSec > 0.85 && notes.length >= 3) {
        rig.guitar.triggerAttackRelease(
          notes[notes.length - 1],
          0.45,
          time + durationSec * 0.48,
          0.38
        );
        rig.guitar.triggerAttackRelease(
          notes[1],
          0.4,
          time + durationSec * 0.74,
          0.34
        );
      }
    }
  } else {
    // Rhodes EP warm backing across all 7 styles
    if (concretePattern === 'pop-comp' && durationBeats >= 2.2) {
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(secPerBeat * 1.25, 1.15),
        time,
        0.52
      );
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(secPerBeat * 1.0, 0.95),
        time + secPerBeat * 1.5,
        0.4
      );
    } else if (concretePattern === 'rising-arp' || concretePattern === 'falling-arp') {
      const seq = concretePattern === 'falling-arp' ? [...notes].reverse() : notes;
      seq.forEach((n, idx) => {
        rig.rhodes.triggerAttackRelease(
          n,
          Math.min(durationSec * 0.85, 1.6),
          time + idx * Math.min(0.28, secPerBeat * 0.4),
          0.42
        );
      });
    } else if (concretePattern === 'lofi-broken') {
      const baseChord = notes.slice(0, Math.max(2, notes.length - 1));
      const colorTop = notes[notes.length - 1];
      rig.rhodes.triggerAttackRelease(
        baseChord,
        Math.min(durationSec * 0.9, 2.2),
        time + 0.012,
        0.46
      );
      if (colorTop && durationBeats >= 1.5) {
        rig.rhodes.triggerAttackRelease(
          colorTop,
          Math.min(durationSec * 0.6, 1.3),
          time + secPerBeat * 0.75,
          0.38
        );
      }
    } else {
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(durationSec * 0.92, 2.3),
        time,
        0.48
      );
    }
  }

  rig.bass.triggerAttackRelease(
    bassNote,
    Math.min(durationSec * 0.72, 1.6),
    time,
    0.5
  );
}

function triggerMelodyNote(
  rig: SynthRig,
  instrument: MelodyInstrumentId,
  midi: number,
  durationSec: number,
  velocity: number,
  time: number,
  sustainPedal = true
) {
  if (instrument === 'piano') {
    rig.grandPiano.triggerNote(
      midi,
      Math.max(0.14, durationSec),
      time,
      Math.min(0.95, velocity * 1.05),
      sustainPedal,
      true
    );
    return;
  }
  const noteName = midiToNoteName(midi);
  const synth = instrument === 'synth' ? rig.melodySynth : rig.melodyGuitar;
  synth.triggerAttackRelease(noteName, Math.max(0.12, durationSec), time, Math.min(1, velocity * 1.08));
}

export async function auditionChord(
  symbol: string,
  instrument: BackingInstrumentId,
  voicingShift = 0,
  sustainPedal = true,
  backingPattern: BackingPatternId = 'rich-block'
): Promise<PianistVoicing | null> {
  await Tone.start();
  const voicing = resolvePianistVoicing(symbol, voicingShift);
  if (!voicing.valid) return null;
  const rig = ensureLiveRig();
  if (instrument === 'piano-ballad') {
    await ensureLivePianoSamplesReady(rig);
  }
  triggerChordWithStyle(
    rig,
    instrument,
    voicing.notes,
    voicing.bassNote,
    2.4,
    0.72,
    Tone.now() + 0.015,
    {
      rightHandMidis: voicing.rightHandMidis,
      bassMidis: voicing.bassMidis,
      backingPattern,
      sustainPedal,
    }
  );
  return voicing;
}

export function stopProgressionAudition(): void {
  progressionTimers.forEach((id) => window.clearTimeout(id));
  progressionTimers = [];
}

export async function auditionProgression(
  symbols: string[],
  instrument: BackingInstrumentId,
  backingPattern: BackingPatternId,
  bpm: number,
  sustainPedal = true,
  onStepChord?: (step: { symbol: string; voicing: PianistVoicing; index: number } | null) => void
): Promise<void> {
  stopProgressionAudition();
  if (symbols.length === 0) return;

  await Tone.start();
  const rig = ensureLiveRig();
  if (instrument === 'piano-ballad') {
    await ensureLivePianoSamplesReady(rig);
  }
  const secPerBeat = 60 / Math.max(55, Math.min(165, bpm));
  const chordBeats = 2;
  const stepSec = Math.max(0.75, Math.min(1.85, chordBeats * secPerBeat));
  const baseTime = Tone.now() + 0.03;

  const autoAuditionCycle: ConcreteArpeggioPatternId[] = [
    'rising-arp',
    'lofi-broken',
    'ballad-wave',
    'falling-arp',
  ];
  let prevRh: number[] | undefined;
  symbols.forEach((sym, idx) => {
    const voicing = resolvePianistVoicing(sym, 0, prevRh);
    if (!voicing.valid) return;
    prevRh = voicing.rightHandMidis;
    const when = baseTime + idx * stepSec;
    const stepPattern =
      backingPattern === 'auto-song'
        ? autoAuditionCycle[idx % autoAuditionCycle.length]
        : backingPattern;
    triggerChordWithStyle(
      rig,
      instrument,
      voicing.notes,
      voicing.bassNote,
      chordBeats,
      stepSec / chordBeats,
      when,
      {
        rightHandMidis: voicing.rightHandMidis,
        bassMidis: voicing.bassMidis,
        backingPattern: stepPattern,
        sustainPedal,
      }
    );

    if (onStepChord) {
      const tid = window.setTimeout(() => {
        onStepChord({ symbol: sym, voicing, index: idx });
      }, Math.round(idx * stepSec * 1000));
      progressionTimers.push(tid);
    }
  });

  if (onStepChord) {
    const endTid = window.setTimeout(() => {
      onStepChord(null);
    }, Math.round(symbols.length * stepSec * 1000 + 350));
    progressionTimers.push(endTid);
  }
}

export async function auditionMidiNote(
  midi: number,
  instrument: MelodyInstrumentId,
  sustainPedal = true
): Promise<void> {
  await Tone.start();
  const rig = ensureLiveRig();
  if (instrument === 'piano') {
    await ensureLivePianoSamplesReady(rig);
  }
  triggerMelodyNote(
    rig,
    instrument,
    midi,
    instrument === 'piano' ? 0.55 : 0.35,
    0.84,
    Tone.now() + 0.01,
    sustainPedal
  );
}

export interface PlaybackProgressDetail {
  beatInSection: number;
  sectionStartBeat: number;
  sectionTotalBeats: number;
  activeChordSymbol: string | null;
  nextChordSymbol: string | null;
}

export interface ChordTriggerEvent {
  symbol: string;
  nextSymbol: string | null;
  sectionId: string;
  bassMidis: number[];
  rightHandMidis: number[];
  durationBeats: number;
  startBeat: number;
  arpPattern?: ConcreteArpeggioPatternId;
}

export interface MelodyTriggerEvent {
  midi: number;
  noteName: string;
  sectionId: string;
  durationBeats: number;
  startBeat: number;
}

export interface LoopPlaybackOptions {
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  bpm: number;
  backingInstrument: BackingInstrumentId;
  backingPattern?: BackingPatternId;
  chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
  songMood?: MoodStyleId;
  sustainPedal?: boolean;
  metronomeEnabled?: boolean;
  drumPattern: DrumPatternId;
  melodyInstrument: MelodyInstrumentId;
  melodyMuted?: boolean;
  melodyPlaybackMode?: MelodyPlaybackMode;
  mutedMelodySectionIds?: string[];
  repeatLoop?: boolean;
  startBeatOffset?: number;
  volumeGain?: number;
  onChordTrigger?: (event: ChordTriggerEvent | null) => void;
  onMelodyTrigger?: (event: MelodyTriggerEvent | null) => void;
  onPlaybackEnded?: () => void;
  onProgressBeat?: (
    beatInLoop: number,
    totalLoopBeats: number,
    currentSectionId: string,
    detail?: PlaybackProgressDetail
  ) => void;
}

export function stopGrooveLoop(): void {
  activePlaybackSessionId += 1;
  if (activeEndTimerId) {
    window.clearTimeout(activeEndTimerId);
    activeEndTimerId = 0;
  }
  stopProgressionAudition();
  if (playheadRafId) {
    cancelAnimationFrame(playheadRafId);
    playheadRafId = 0;
  }
  const partsToDispose = activeLoopParts;
  activeLoopParts = [];
  partsToDispose.forEach((p) => {
    try {
      p.clear();
      p.dispose();
    } catch {
      // Ignore cleanup errors on already-disposed parts
    }
  });
  try {
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel(0);
  } catch {
    // Ignore transport reset edge cases
  }
}

export function seekGroovePlayback(beat: number, bpm: number): void {
  const secPerBeat = 60 / Math.max(45, Math.min(180, bpm));
  const targetSec = Math.max(0, beat) * secPerBeat;
  try {
    const transport = Tone.getTransport();
    const wasStarted = transport.state === 'started';
    if (wasStarted) {
      transport.pause();
    }
    transport.seconds = targetSec;
    if (wasStarted) {
      transport.start('+0.01', targetSec);
    }
  } catch {
    // Ignore seek edge case
  }
}

function schedulePatternToTransport(
  rig: SynthRig,
  options: LoopPlaybackOptions,
  targetTransport: ReturnType<typeof Tone.getTransport>,
  isLoop: boolean,
  sessionId = 0
): {
  totalBeats: number;
  sectionBeatSpans: Array<{ id: string; start: number; end: number }>;
  chordEvents: ReturnType<typeof buildChordTimeline>['events'];
} {
  const { events, totalBeats } = buildChordTimeline(options.sections, {
    backingPattern: options.backingPattern,
    chordArpStyles: options.chordArpStyles,
    songMood: options.songMood,
    melodyNotes: options.melodyNotes,
  });
  const secPerBeat = 60 / Math.max(45, Math.min(180, options.bpm));
  const sustainPedal = options.sustainPedal ?? true;

  const sectionBeatSpans: Array<{
    id: string;
    kind: SongSection['kind'];
    start: number;
    end: number;
  }> = [];
  let beatCursor = 0;
  options.sections.forEach((sec) => {
    const dur = sec.bars * 4;
    sectionBeatSpans.push({
      id: sec.id,
      kind: sec.kind,
      start: beatCursor,
      end: beatCursor + dur,
    });
    beatCursor += dur;
  });

  const isBalladArrangement = options.drumPattern === 'ballad';

  // Schedule chords with smooth two-hand voicing & per-chord arpeggio style
  const chordSchedule: Array<
    [
      number,
      {
        ev: (typeof events)[number];
        nextSymbol: string | null;
        addSoftBass: boolean;
      },
    ]
  > = events.map((ev, idx) => {
    const span =
      sectionBeatSpans.find((s) => s.id === ev.sectionId) ?? sectionBeatSpans[0];
    const localBeat = span ? ev.startBeat - span.start : 0;
    const isSoftBassActive =
      isBalladArrangement &&
      span !== undefined &&
      !(span.kind === 'Intro' && localBeat < 16);

    return [
      ev.startBeat * secPerBeat,
      {
        ev,
        nextSymbol:
          events[idx + 1]?.symbol ?? (isLoop && events[0] ? events[0].symbol : null),
        addSoftBass: isSoftBassActive,
      },
    ];
  });

  const chordPart = new Tone.Part((time, item) => {
    const { ev, nextSymbol, addSoftBass } = item;
    triggerChordWithStyle(
      rig,
      options.backingInstrument,
      ev.notes,
      ev.bassNote,
      ev.durationBeats,
      secPerBeat,
      time,
      {
        rightHandMidis: ev.rightHandMidis,
        bassMidis: ev.bassMidis,
        backingPattern: ev.arpPattern,
        sustainPedal,
        addSoftBass,
      }
    );
    if (options.onChordTrigger) {
      Tone.Draw.schedule(() => {
        if (sessionId !== activePlaybackSessionId) return;
        options.onChordTrigger?.({
          symbol: ev.symbol,
          nextSymbol,
          sectionId: ev.sectionId,
          bassMidis: ev.bassMidis ?? [],
          rightHandMidis: ev.rightHandMidis ?? [],
          durationBeats: ev.durationBeats,
          startBeat: ev.startBeat,
          arpPattern: ev.arpPattern,
        });
      }, time);
    }
  }, chordSchedule);

  chordPart.loop = isLoop;
  chordPart.loopEnd = totalBeats * secPerBeat;
  chordPart.start(0);
  activeLoopParts.push(chordPart);

  // Schedule Warm Strings Pad Swells when using Ballad Beat arrangement
  if (isBalladArrangement) {
    const stringsSchedule: Array<
      [number, { notes: string[]; durSec: number; vel: number }]
    > = [];
    events.forEach((ev) => {
      const span = sectionBeatSpans.find((s) => s.id === ev.sectionId);
      if (!span) return;
      const localBeat = ev.startBeat - span.start;
      let vel = 0;
      if (span.kind === 'Chorus' || span.kind === 'Bridge') {
        vel = 0.42;
      } else if (span.kind === 'Pre-Chorus' || span.kind === 'Interlude') {
        vel = 0.34;
      } else if (span.kind === 'Verse' && localBeat >= 16) {
        vel = 0.28;
      } else if (span.kind === 'Intro' && localBeat >= 8) {
        vel = 0.24;
      } else if (span.kind === 'Outro' && localBeat < span.end - span.start - 4) {
        vel = 0.26;
      }
      if (vel <= 0) return;

      const stringNotes =
        ev.rightHandMidis && ev.rightHandMidis.length > 0
          ? ev.rightHandMidis.slice(0, 3).map((m) => midiToNoteName(m))
          : ev.notes.slice(0, 3);
      if (stringNotes.length === 0) return;
      stringsSchedule.push([
        ev.startBeat * secPerBeat,
        {
          notes: stringNotes,
          durSec: Math.min(Math.max(0.55, ev.durationBeats * secPerBeat * 0.92), 3.6),
          vel,
        },
      ]);
    });

    if (stringsSchedule.length > 0) {
      const stringsPart = new Tone.Part((time, item) => {
        rig.stringsPad.triggerAttackRelease(item.notes, item.durSec, time, item.vel);
      }, stringsSchedule);
      stringsPart.loop = isLoop;
      stringsPart.loopEnd = totalBeats * secPerBeat;
      stringsPart.start(0);
      activeLoopParts.push(stringsPart);
    }
  }

  // Schedule melody notes according to MelodyPlaybackMode ('all' | 'intro-only' | 'off') & per-section mute list
  const effectiveMelodyMode = resolveMelodyPlaybackMode(options);
  const melodySchedule: Array<
    [
      number,
      {
        midi: number;
        durSec: number;
        vel: number;
        sectionId: string;
        durationBeats: number;
        startBeat: number;
      },
    ]
  > = [];
  sectionBeatSpans.forEach((span) => {
    if (isSectionMelodyMuted(span, effectiveMelodyMode, options.mutedMelodySectionIds)) {
      return;
    }
    const notesInSec = options.melodyNotes.filter((n) => n.sectionId === span.id);
    notesInSec.forEach((n) => {
      melodySchedule.push([
        (span.start + n.startBeat) * secPerBeat,
        {
          midi: n.midi,
          durSec: n.durationBeats * secPerBeat,
          vel: n.velocity,
          sectionId: span.id,
          durationBeats: n.durationBeats,
          startBeat: n.startBeat,
        },
      ]);
    });
  });

  if (melodySchedule.length > 0) {
    const melodyPart = new Tone.Part((time, ev) => {
      triggerMelodyNote(
        rig,
        options.melodyInstrument,
        ev.midi,
        ev.durSec,
        ev.vel,
        time,
        sustainPedal
      );
      if (options.onMelodyTrigger) {
        Tone.Draw.schedule(() => {
          if (sessionId !== activePlaybackSessionId) return;
          options.onMelodyTrigger?.({
            midi: ev.midi,
            noteName: midiToNoteName(ev.midi),
            sectionId: ev.sectionId,
            durationBeats: ev.durationBeats,
            startBeat: ev.startBeat,
          });
        }, time);
      }
    }, melodySchedule);
    melodyPart.loop = isLoop;
    melodyPart.loopEnd = totalBeats * secPerBeat;
    melodyPart.start(0);
    activeLoopParts.push(melodyPart);
  }

  // Schedule Optional Metronome Quarter-Note Clicks
  if (options.metronomeEnabled) {
    const metroEvents: Array<[number, { isBarAccent: boolean }]> = [];
    for (let beat = 0; beat < totalBeats; beat++) {
      metroEvents.push([beat * secPerBeat, { isBarAccent: beat % 4 === 0 }]);
    }
    const metroPart = new Tone.Part((time, ev) => {
      rig.metronome.triggerAttackRelease(
        ev.isBarAccent ? 'G5' : 'C5',
        '32n',
        time,
        ev.isBarAccent ? 0.72 : 0.42
      );
    }, metroEvents);
    metroPart.loop = isLoop;
    metroPart.loopEnd = totalBeats * secPerBeat;
    metroPart.start(0);
    activeLoopParts.push(metroPart);
  }

  // Schedule Drums across 16th steps (4 steps per beat)
  if (options.drumPattern !== 'none') {
    const totalSteps = Math.round(totalBeats * 4);
    const stepSec = secPerBeat / 4;
    const drumEvents: Array<
      [
        number,
        { kick?: boolean; snare?: boolean; hat?: boolean; kickVel: number; snareVel: number; hatVel: number },
      ]
    > = [];
    const firstVerseId = sectionBeatSpans.find((s) => s.kind === 'Verse')?.id;

    for (let step = 0; step < totalSteps; step++) {
      const stepBeat = step / 4;
      const stepInBar = step % 16;
      const span =
        sectionBeatSpans.find((s) => stepBeat >= s.start && stepBeat < s.end) ??
        sectionBeatSpans[0];

      if (options.drumPattern === 'ballad') {
        if (!span) continue;
        const localBeat = stepBeat - span.start;
        const spanDur = span.end - span.start;

        // Expressive ballad dynamics: soft beat enters halfway through an 8-bar Intro and anchors Verse 1 from Bar 1
        if (span.kind === 'Intro' && (spanDur < 24 || localBeat < 16)) continue;
        if (span.kind === 'Outro' && localBeat >= spanDur - 4) continue;

        const isFirstVerse = span.id === firstVerseId;
        const isSoftEntry = span.kind === 'Intro' || (isFirstVerse && localBeat < 16);
        const isChorusIntensity =
          span.kind === 'Chorus' || span.kind === 'Bridge' || span.kind === 'Interlude';
        const isKick = isChorusIntensity
          ? stepInBar === 0 || stepInBar === 6 || stepInBar === 8 || stepInBar === 14
          : stepInBar === 0 || stepInBar === 10;
        const isSnare = stepInBar === 4 || stepInBar === 12;
        const isHat = step % 2 === 0;

        if (isKick || isSnare || isHat) {
          const baseHatVel = step % 4 === 0 ? 0.76 : 0.46;
          drumEvents.push([
            step * stepSec,
            {
              kick: isKick,
              snare: isSnare,
              hat: isHat,
              kickVel: isChorusIntensity ? 0.56 : isSoftEntry ? 0.36 : 0.44,
              snareVel: isChorusIntensity ? 0.44 : isSoftEntry ? 0.22 : 0.3,
              hatVel: baseHatVel * (isChorusIntensity ? 0.34 : isSoftEntry ? 0.17 : 0.23),
            },
          ]);
        }
        continue;
      }

      const isLofiKit = options.drumPattern === 'lofi';
      const swingOffset = isLofiKit && step % 2 === 1 ? stepSec * 0.14 : 0;
      const isKick = isLofiKit
        ? stepInBar === 0 || stepInBar === 7 || stepInBar === 10
        : stepInBar === 0 || stepInBar === 3 || stepInBar === 10 || stepInBar === 11;
      const isSnare = stepInBar === 4 || stepInBar === 12;
      const isHat = step % 2 === 0;

      if (isKick || isSnare || isHat) {
        const hatBase = step % 4 === 0 ? 0.78 : 0.48;
        drumEvents.push([
          step * stepSec + swingOffset,
          {
            kick: isKick,
            snare: isSnare,
            hat: isHat,
            kickVel: isLofiKit ? 0.48 : 0.62,
            snareVel: isLofiKit ? 0.42 : 0.56,
            hatVel: hatBase * (isLofiKit ? 0.32 : 0.42),
          },
        ]);
      }
    }

    if (drumEvents.length > 0) {
      const drumPart = new Tone.Part((time, ev) => {
        if (ev.kick) rig.kick.triggerAttackRelease('C1', '8n', time, ev.kickVel);
        if (ev.snare) rig.snare.triggerAttackRelease('16n', time, ev.snareVel);
        if (ev.hat) rig.hat.triggerAttackRelease('32n', time, ev.hatVel);
      }, drumEvents);
      drumPart.loop = isLoop;
      drumPart.loopEnd = totalBeats * secPerBeat;
      drumPart.start(0);
      activeLoopParts.push(drumPart);
    }
  }

  targetTransport.bpm.value = options.bpm;
  return { totalBeats, sectionBeatSpans, chordEvents: events };
}

export async function startGrooveLoop(options: LoopPlaybackOptions): Promise<void> {
  await Tone.start();
  stopGrooveLoop();
  const sessionId = activePlaybackSessionId;
  const rig = ensureLiveRig();
  if (
    options.backingInstrument === 'piano-ballad' ||
    options.melodyInstrument === 'piano'
  ) {
    await ensureLivePianoSamplesReady(rig);
    if (sessionId !== activePlaybackSessionId) return;
  }
  if (typeof options.volumeGain === 'number') {
    setMasterVolume(options.volumeGain);
  }
  const transport = Tone.getTransport();
  const repeatLoop = options.repeatLoop ?? true;

  const { totalBeats, sectionBeatSpans, chordEvents } = schedulePatternToTransport(
    rig,
    options,
    transport,
    repeatLoop,
    sessionId
  );
  const secPerBeat = 60 / Math.max(45, Math.min(180, options.bpm));
  const loopDurationSec = Math.max(0.5, totalBeats * secPerBeat);
  const startBeatOffset = Math.max(
    0,
    Math.min(Math.max(0, totalBeats - 0.25), options.startBeatOffset ?? 0)
  );
  const startOffsetSec = startBeatOffset * secPerBeat;
  transport.seconds = startOffsetSec;
  transport.start(undefined, startOffsetSec);
  const startedWallMs = performance.now();
  let hasObservedStarted = transport.state === 'started';

  if (!repeatLoop) {
    const remainingMs = Math.max(
      400,
      (totalBeats - startBeatOffset) * secPerBeat * 1000 + 950
    );
    activeEndTimerId = window.setTimeout(() => {
      if (sessionId !== activePlaybackSessionId) return;
      stopGrooveLoop();
      options.onChordTrigger?.(null);
      options.onMelodyTrigger?.(null);
      options.onPlaybackEnded?.();
    }, remainingMs);
  }

  const tick = () => {
    if (sessionId !== activePlaybackSessionId) return;
    if (transport.state === 'started') {
      hasObservedStarted = true;
    } else if (hasObservedStarted) {
      return;
    }

    const rawSec =
      transport.state === 'started'
        ? Math.max(0, transport.seconds)
        : startOffsetSec + Math.max(0, (performance.now() - startedWallMs) / 1000);
    const elapsedSec = repeatLoop
      ? rawSec % loopDurationSec
      : Math.min(loopDurationSec, rawSec);
    const beatInLoop = elapsedSec / secPerBeat;
    const activeSpan =
      sectionBeatSpans.find((s) => beatInLoop >= s.start && beatInLoop < s.end) ??
      sectionBeatSpans[sectionBeatSpans.length - 1] ??
      sectionBeatSpans[0];

    let activeChordSymbol: string | null = null;
    let nextChordSymbol: string | null = null;
    for (let i = chordEvents.length - 1; i >= 0; i--) {
      if (chordEvents[i].startBeat <= beatInLoop + 0.02) {
        activeChordSymbol = chordEvents[i].symbol;
        nextChordSymbol =
          chordEvents[i + 1]?.symbol ?? (repeatLoop ? chordEvents[0]?.symbol ?? null : null);
        break;
      }
    }

    if (options.onProgressBeat && activeSpan) {
      options.onProgressBeat(beatInLoop, totalBeats, activeSpan.id, {
        beatInSection: Math.max(0, beatInLoop - activeSpan.start),
        sectionStartBeat: activeSpan.start,
        sectionTotalBeats: activeSpan.end - activeSpan.start,
        activeChordSymbol,
        nextChordSymbol,
      });
    }
    playheadRafId = requestAnimationFrame(tick);
  };
  playheadRafId = requestAnimationFrame(tick);
}

/**
 * Offline renders the complete song sketch into a downloadable 16-bit PCM .WAV file using Concert Grand Piano!
 */
export async function renderDraftToWavBytes(
  draft: SketchpadDraft
): Promise<Uint8Array> {
  const { totalBeats } = buildChordTimeline(draft.sections, {
    backingPattern: draft.backingPattern,
    chordArpStyles: draft.chordArpStyles,
    songMood: draft.mood,
    melodyNotes: draft.melodyNotes,
  });
  const secPerBeat = 60 / Math.max(45, Math.min(180, draft.bpm));
  const durationSec = Math.min(240, Math.max(2, totalBeats * secPerBeat + 2.0));

  // Ensure real Yamaha C5 samples are decoded prior to OfflineAudioContext rendering
  await ensurePianoSamplesDecoded(Tone.getContext()).catch(() => 0);
  const predecodedPianoBuffers = getDecodedPianoSampleSnapshot();

  const buffer = await Tone.Offline(({ transport }) => {
    const rig = createSynthRig(
      Tone.getDestination(),
      false,
      predecodedPianoBuffers
    );
    const savedParts = activeLoopParts;
    activeLoopParts = [];
    schedulePatternToTransport(
      rig,
      {
        sections: draft.sections,
        melodyNotes: draft.melodyNotes,
        bpm: draft.bpm,
        backingInstrument: draft.backingInstrument,
        backingPattern: draft.backingPattern ?? 'auto-song',
        chordArpStyles: draft.chordArpStyles,
        songMood: draft.mood,
        sustainPedal: draft.sustainPedal ?? true,
        metronomeEnabled: false,
        drumPattern: draft.drumPattern,
        melodyInstrument: draft.melodyInstrument,
        melodyMuted: draft.melodyMuted ?? false,
        melodyPlaybackMode: resolveMelodyPlaybackMode(draft),
        mutedMelodySectionIds: draft.mutedMelodySectionIds ?? [],
      },
      transport,
      false
    );
    activeLoopParts = savedParts;
    transport.start(0);
  }, durationSec);

  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  return encodePcmToWav([left, right], buffer.sampleRate);
}

export interface MicPitchSession {
  stop: () => PitchFrame[];
}

/**
 * Captures real-time vocal humming via navigator.mediaDevices.getUserMedia + Pitchy autocorrelation.
 */
export async function startMicPitchCapture(callbacks: {
  onFrame: (info: {
    freqHz: number;
    clarity: number;
    rms: number;
    waveform: Float32Array;
  }) => void;
  onError?: (message: string) => void;
}): Promise<MicPitchSession> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== 'function'
  ) {
    throw new Error('Trình duyệt hiện tại không hỗ trợ truy cập Micro.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const detector = PitchDetector.forFloat32Array(analyser.fftSize);
  detector.clarityThreshold = 0.72;
  detector.minVolumeDecibels = -36;
  const inputBuffer = new Float32Array(analyser.fftSize);

  const capturedFrames: PitchFrame[] = [];
  const startedAt = performance.now();
  let stopped = false;
  let rafId = 0;

  const sampleLoop = () => {
    if (stopped) return;
    analyser.getFloatTimeDomainData(inputBuffer);

    let sumSq = 0;
    for (let i = 0; i < inputBuffer.length; i++) {
      sumSq += inputBuffer[i] * inputBuffer[i];
    }
    const rms = Math.sqrt(sumSq / inputBuffer.length);

    const [freqHz, clarity] = detector.findPitch(inputBuffer, audioCtx.sampleRate);
    const timeSec = (performance.now() - startedAt) / 1000;

    if (clarity >= 0.72 && freqHz >= 75 && freqHz <= 1100) {
      capturedFrames.push({ timeSec, freqHz, clarity });
    }

    callbacks.onFrame({
      freqHz: clarity >= 0.72 ? freqHz : 0,
      clarity,
      rms,
      waveform: inputBuffer.slice(0, 128),
    });

    rafId = requestAnimationFrame(sampleLoop);
  };

  rafId = requestAnimationFrame(sampleLoop);

  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      stream.getTracks().forEach((t) => t.stop());
      source.disconnect();
      void audioCtx.close().catch(() => {});
      return capturedFrames;
    },
  };
}
