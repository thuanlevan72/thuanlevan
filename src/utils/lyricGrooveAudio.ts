import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';
import {
  type BackingInstrumentId,
  buildChordTimeline,
  type DrumPatternId,
  encodePcmToWav,
  type MelodyInstrumentId,
  type MelodyNote,
  midiToNoteName,
  type PitchFrame,
  resolveChordVoicingNotes,
  type SketchpadDraft,
  type SongSection,
} from './lyricGrooveEngine.ts';

interface SynthRig {
  rhodes: Tone.PolySynth;
  piano: Tone.PolySynth;
  guitar: Tone.PolySynth;
  bass: Tone.MonoSynth;
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.NoiseSynth;
  melodyPiano: Tone.PolySynth;
  melodySynth: Tone.PolySynth;
  melodyGuitar: Tone.PolySynth;
  masterGain: Tone.Gain;
  dispose: () => void;
}

function createSynthRig(destination: Tone.InputNode): SynthRig {
  const masterGain = new Tone.Gain(0.85).connect(destination);
  const reverb = new Tone.Reverb({ decay: 1.7, wet: 0.2 }).connect(masterGain);

  const rhodes = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 1.6,
    oscillator: { type: 'sine' },
    modulation: { type: 'triangle' },
    envelope: { attack: 0.015, decay: 0.45, sustain: 0.35, release: 0.9 },
    modulationEnvelope: { attack: 0.01, decay: 0.25, sustain: 0.08, release: 0.4 },
    volume: -8,
  }).connect(reverb);

  const piano = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.012, decay: 0.55, sustain: 0.32, release: 1.1 },
    volume: -7,
  }).connect(reverb);

  const guitarFilter = new Tone.Filter(2400, 'lowpass').connect(reverb);
  const guitar = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle4' },
    envelope: { attack: 0.006, decay: 0.48, sustain: 0.14, release: 0.7 },
    volume: -7,
  }).connect(guitarFilter);

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    filter: { Q: 1.5, type: 'lowpass', rolloff: -12 },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.45, release: 0.35 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
      release: 0.3,
      baseFrequency: 90,
      octaves: 2,
    },
    volume: -9,
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

  const melodyPiano = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.01, decay: 0.35, sustain: 0.45, release: 0.55 },
    volume: -4,
  }).connect(reverb);

  const synthFilter = new Tone.Filter(2100, 'lowpass').connect(reverb);
  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth4' },
    envelope: { attack: 0.03, decay: 0.25, sustain: 0.55, release: 0.45 },
    volume: -9,
  }).connect(synthFilter);

  const melodyGuitar = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle4' },
    envelope: { attack: 0.005, decay: 0.42, sustain: 0.2, release: 0.45 },
    volume: -5,
  }).connect(guitarFilter);

  return {
    rhodes,
    piano,
    guitar,
    bass,
    kick,
    snare,
    hat,
    melodyPiano,
    melodySynth,
    melodyGuitar,
    masterGain,
    dispose: () => {
      rhodes.dispose();
      piano.dispose();
      guitar.dispose();
      guitarFilter.dispose();
      bass.dispose();
      kick.dispose();
      snare.dispose();
      snareFilter.dispose();
      hat.dispose();
      hatFilter.dispose();
      melodyPiano.dispose();
      melodySynth.dispose();
      synthFilter.dispose();
      melodyGuitar.dispose();
      reverb.dispose();
      masterGain.dispose();
    },
  };
}

let liveRig: SynthRig | null = null;
let activeLoopParts: Tone.Part[] = [];
let playheadRafId = 0;

function ensureLiveRig(): SynthRig {
  if (!liveRig) {
    liveRig = createSynthRig(Tone.getDestination());
  }
  return liveRig;
}

function triggerChordWithStyle(
  rig: SynthRig,
  instrument: BackingInstrumentId,
  notes: string[],
  bassNote: string,
  durationSec: number,
  time: number
) {
  if (notes.length === 0) return;
  if (instrument === 'guitar-strum') {
    notes.forEach((n, idx) => {
      rig.guitar.triggerAttackRelease(n, Math.min(durationSec, 1.4), time + idx * 0.038, 0.78);
    });
    // Gentle fingerpicked top arpeggio on beat 2 if duration allows
    if (durationSec > 0.9 && notes.length >= 3) {
      rig.guitar.triggerAttackRelease(notes[notes.length - 1], 0.45, time + durationSec * 0.45, 0.52);
      rig.guitar.triggerAttackRelease(notes[1], 0.4, time + durationSec * 0.72, 0.48);
    }
  } else if (instrument === 'piano-ballad') {
    rig.piano.triggerAttackRelease(notes, Math.min(durationSec * 0.92, 2.2), time, 0.76);
  } else {
    rig.rhodes.triggerAttackRelease(notes, Math.min(durationSec * 0.9, 2.4), time, 0.72);
  }

  rig.bass.triggerAttackRelease(bassNote, Math.min(durationSec * 0.72, 1.6), time, 0.74);
}

function triggerMelodyNote(
  rig: SynthRig,
  instrument: MelodyInstrumentId,
  noteName: string,
  durationSec: number,
  velocity: number,
  time: number
) {
  const synth =
    instrument === 'synth'
      ? rig.melodySynth
      : instrument === 'guitar'
      ? rig.melodyGuitar
      : rig.melodyPiano;
  synth.triggerAttackRelease(noteName, Math.max(0.12, durationSec), time, velocity);
}

export async function auditionChord(
  symbol: string,
  instrument: BackingInstrumentId,
  voicingShift = 0
): Promise<void> {
  await Tone.start();
  const voicing = resolveChordVoicingNotes(symbol, voicingShift);
  if (!voicing.valid) return;
  const rig = ensureLiveRig();
  triggerChordWithStyle(rig, instrument, voicing.notes, voicing.bassNote, 1.2, Tone.now() + 0.01);
}

export async function auditionMidiNote(
  midi: number,
  instrument: MelodyInstrumentId
): Promise<void> {
  await Tone.start();
  const rig = ensureLiveRig();
  triggerMelodyNote(rig, instrument, midiToNoteName(midi), 0.35, 0.85, Tone.now() + 0.01);
}

export interface LoopPlaybackOptions {
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  bpm: number;
  backingInstrument: BackingInstrumentId;
  drumPattern: DrumPatternId;
  melodyInstrument: MelodyInstrumentId;
  onProgressBeat?: (beatInLoop: number, totalLoopBeats: number, currentSectionId: string) => void;
}

export function stopGrooveLoop(): void {
  if (playheadRafId) {
    cancelAnimationFrame(playheadRafId);
    playheadRafId = 0;
  }
  Tone.getTransport().stop();
  Tone.getTransport().cancel(0);
  activeLoopParts.forEach((p) => {
    p.stop();
    p.dispose();
  });
  activeLoopParts = [];
}

function schedulePatternToTransport(
  rig: SynthRig,
  options: LoopPlaybackOptions,
  targetTransport: ReturnType<typeof Tone.getTransport>,
  isLoop: boolean
): { totalBeats: number; sectionBeatSpans: Array<{ id: string; start: number; end: number }> } {
  const { events, totalBeats } = buildChordTimeline(options.sections);
  const secPerBeat = 60 / Math.max(45, Math.min(180, options.bpm));

  const sectionBeatSpans: Array<{ id: string; start: number; end: number }> = [];
  let beatCursor = 0;
  options.sections.forEach((sec) => {
    const dur = sec.bars * 4;
    sectionBeatSpans.push({ id: sec.id, start: beatCursor, end: beatCursor + dur });
    beatCursor += dur;
  });

  // Schedule chords
  const chordSchedule: Array<[number, (typeof events)[number]]> = events.map((ev) => [
    ev.startBeat * secPerBeat,
    ev,
  ]);
  const chordPart = new Tone.Part((time, ev) => {
    triggerChordWithStyle(
      rig,
      options.backingInstrument,
      ev.notes,
      ev.bassNote,
      ev.durationBeats * secPerBeat,
      time
    );
  }, chordSchedule);

  chordPart.loop = isLoop;
  chordPart.loopEnd = totalBeats * secPerBeat;
  chordPart.start(0);
  activeLoopParts.push(chordPart);

  // Schedule melody notes for sections in playback scope
  const melodySchedule: Array<[number, { noteName: string; durSec: number; vel: number }]> = [];
  sectionBeatSpans.forEach((span) => {
    const notesInSec = options.melodyNotes.filter((n) => n.sectionId === span.id);
    notesInSec.forEach((n) => {
      melodySchedule.push([
        (span.start + n.startBeat) * secPerBeat,
        {
          noteName: midiToNoteName(n.midi),
          durSec: n.durationBeats * secPerBeat,
          vel: n.velocity,
        },
      ]);
    });
  });

  if (melodySchedule.length > 0) {
    const melodyPart = new Tone.Part((time, ev) => {
      triggerMelodyNote(rig, options.melodyInstrument, ev.noteName, ev.durSec, ev.vel, time);
    }, melodySchedule);
    melodyPart.loop = isLoop;
    melodyPart.loopEnd = totalBeats * secPerBeat;
    melodyPart.start(0);
    activeLoopParts.push(melodyPart);
  }

  // Schedule Drums across 16th steps (4 steps per beat)
  if (options.drumPattern !== 'none') {
    const totalSteps = Math.round(totalBeats * 4);
    const stepSec = secPerBeat / 4;
    const drumEvents: Array<[number, { kick?: boolean; snare?: boolean; hat?: boolean; vel: number }]> = [];

    for (let step = 0; step < totalSteps; step++) {
      const stepInBar = step % 16;
      const swingOffset = options.drumPattern === 'lofi' && step % 2 === 1 ? stepSec * 0.14 : 0;
      const isKick =
        options.drumPattern === 'lofi'
          ? stepInBar === 0 || stepInBar === 7 || stepInBar === 10
          : stepInBar === 0 || stepInBar === 3 || stepInBar === 10 || stepInBar === 11;
      const isSnare = stepInBar === 4 || stepInBar === 12;
      const isHat = step % 2 === 0;

      if (isKick || isSnare || isHat) {
        drumEvents.push([
          step * stepSec + swingOffset,
          { kick: isKick, snare: isSnare, hat: isHat, vel: step % 4 === 0 ? 0.78 : 0.48 },
        ]);
      }
    }

    const drumPart = new Tone.Part((time, ev) => {
      if (ev.kick) rig.kick.triggerAttackRelease('C1', '8n', time, 0.85);
      if (ev.snare) rig.snare.triggerAttackRelease('16n', time, 0.7);
      if (ev.hat) rig.hat.triggerAttackRelease('32n', time, ev.vel * 0.55);
    }, drumEvents);
    drumPart.loop = isLoop;
    drumPart.loopEnd = totalBeats * secPerBeat;
    drumPart.start(0);
    activeLoopParts.push(drumPart);
  }

  targetTransport.bpm.value = options.bpm;
  return { totalBeats, sectionBeatSpans };
}

export async function startGrooveLoop(options: LoopPlaybackOptions): Promise<void> {
  await Tone.start();
  stopGrooveLoop();
  const rig = ensureLiveRig();
  const transport = Tone.getTransport();
  transport.position = 0;

  const { totalBeats, sectionBeatSpans } = schedulePatternToTransport(rig, options, transport, true);
  const secPerBeat = 60 / Math.max(45, Math.min(180, options.bpm));
  const loopDurationSec = totalBeats * secPerBeat;

  transport.start('+0.02');

  const tick = () => {
    if (transport.state !== 'started') return;
    const elapsedSec = transport.seconds % loopDurationSec;
    const beatInLoop = elapsedSec / secPerBeat;
    const activeSpan =
      sectionBeatSpans.find((s) => beatInLoop >= s.start && beatInLoop < s.end) ??
      sectionBeatSpans[0];
    if (options.onProgressBeat && activeSpan) {
      options.onProgressBeat(beatInLoop, totalBeats, activeSpan.id);
    }
    playheadRafId = requestAnimationFrame(tick);
  };
  playheadRafId = requestAnimationFrame(tick);
}

/**
 * Offline renders the complete song sketch into a downloadable 16-bit PCM .WAV file!
 */
export async function renderDraftToWavBytes(draft: SketchpadDraft): Promise<Uint8Array> {
  const { totalBeats } = buildChordTimeline(draft.sections);
  const secPerBeat = 60 / Math.max(45, Math.min(180, draft.bpm));
  const durationSec = Math.min(120, Math.max(2, totalBeats * secPerBeat + 1.2));

  const buffer = await Tone.Offline(({ transport }) => {
    const rig = createSynthRig(Tone.getDestination());
    const savedParts = activeLoopParts;
    activeLoopParts = [];
    schedulePatternToTransport(
      rig,
      {
        sections: draft.sections,
        melodyNotes: draft.melodyNotes,
        bpm: draft.bpm,
        backingInstrument: draft.backingInstrument,
        drumPattern: draft.drumPattern,
        melodyInstrument: draft.melodyInstrument,
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
