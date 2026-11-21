import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';
import { Note } from 'tonal';
import { GrandPianoEngine } from './grandPianoEngine.ts';
import {
  type BackingInstrumentId,
  type BackingPatternId,
  buildChordTimeline,
  type DrumPatternId,
  encodePcmToWav,
  type MelodyInstrumentId,
  type MelodyNote,
  midiToNoteName,
  type PianistVoicing,
  type PitchFrame,
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
  melodySynth: Tone.PolySynth;
  melodyGuitar: Tone.PolySynth;
  masterGain: Tone.Gain;
  dispose: () => void;
}

function createSynthRig(destination: Tone.InputNode): SynthRig {
  const masterGain = new Tone.Gain(0.88).connect(destination);
  const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.22 }).connect(masterGain);

  // Concert Grand Piano physical model engine (connected directly to masterGain.input for zero extra synth latency)
  const grandPiano = new GrandPianoEngine(masterGain.context, masterGain.input);

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
    filter: { Q: 1.4, type: 'lowpass', rolloff: -12 },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.45, release: 0.35 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
      release: 0.3,
      baseFrequency: 95,
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

  const metronome = new Tone.MembraneSynth({
    pitchDecay: 0.012,
    octaves: 2.0,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.055, sustain: 0, release: 0.025 },
    volume: -12,
  }).connect(masterGain);

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
    melodySynth,
    melodyGuitar,
    masterGain,
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
let progressionTimers: number[] = [];

function ensureLiveRig(): SynthRig {
  if (!liveRig) {
    liveRig = createSynthRig(Tone.getDestination());
  }
  return liveRig;
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

  if (pattern === 'ballad-arpeggio') {
    // Left hand warm bass root on beat 0 + subtle fifth half-beat later
    if (bassMidis[0] !== undefined) {
      rig.grandPiano.triggerNote(
        bassMidis[0],
        Math.min(totalDurSec * 0.96, 2.8),
        time,
        0.78,
        sustainPedal
      );
    }
    if (bassMidis[1] !== undefined && durationBeats >= 1.25) {
      rig.grandPiano.triggerNote(
        bassMidis[1],
        Math.min(totalDurSec * 0.78, 2.1),
        time + secPerBeat * 0.5,
        0.58,
        sustainPedal
      );
    }

    // Expressive rolled foundation on beat 0 (inner voices subtle, top note sings slightly brighter)
    const lastIdx = rightHandMidis.length - 1;
    rightHandMidis.forEach((midi, idx) => {
      const isTop = idx === lastIdx;
      const rollDelay = idx * 0.015;
      rig.grandPiano.triggerNote(
        midi,
        Math.min(totalDurSec * 0.85, 2.0),
        time + rollDelay,
        isTop ? 0.72 : 0.56 + (idx % 2) * 0.04,
        sustainPedal
      );
    });

    // Broken pianist arpeggio ripples on eighth-note subdivisions inside longer chords
    if (rightHandMidis.length >= 2 && durationBeats >= 1.75) {
      const steps = Math.floor((durationBeats - 0.35) / 0.5);
      for (let s = 2; s <= steps; s++) {
        const arpBeat = s * 0.5;
        const noteIdx = (s - 1) % rightHandMidis.length;
        const targetMidi = rightHandMidis[noteIdx];
        const vel = 0.44 + (noteIdx === lastIdx ? 0.1 : 0);
        rig.grandPiano.triggerNote(
          targetMidi,
          Math.max(0.45, secPerBeat * 0.95),
          time + arpBeat * secPerBeat,
          vel,
          sustainPedal
        );
      }
    }
    return;
  }

  if (pattern === 'pop-comp') {
    const hitBeats = [0, 1.5, 3].filter((b) => b < durationBeats - 0.2);
    hitBeats.forEach((beatOff, hitIdx) => {
      const hitTime = time + beatOff * secPerBeat;
      const isDownbeat = hitIdx === 0;
      const durSec = isDownbeat
        ? Math.min(totalDurSec * 0.72, secPerBeat * 1.4)
        : Math.max(0.28, secPerBeat * 0.65);

      if (isDownbeat || beatOff >= 2.5) {
        bassMidis.forEach((bm, bi) => {
          rig.grandPiano.triggerNote(
            bm,
            Math.max(0.4, secPerBeat * 1.35),
            hitTime + bi * 0.01,
            isDownbeat ? (bi === 0 ? 0.8 : 0.58) : 0.62,
            sustainPedal
          );
        });
      }

      rightHandMidis.forEach((midi, idx) => {
        const isTop = idx === rightHandMidis.length - 1;
        rig.grandPiano.triggerNote(
          midi,
          durSec,
          hitTime + idx * 0.008,
          isDownbeat ? (isTop ? 0.78 : 0.64) : isTop ? 0.62 : 0.5,
          sustainPedal
        );
      });
    });
    return;
  }

  // 'rich-block': Concert Grand full two-hand chord with authentic finger micro-roll + midpoint breathe
  bassMidis.forEach((bm, bi) => {
    rig.grandPiano.triggerNote(
      bm,
      Math.min(totalDurSec * 0.96, 2.9),
      time + bi * 0.012,
      bi === 0 ? 0.82 : 0.62,
      sustainPedal
    );
  });

  rightHandMidis.forEach((midi, idx) => {
    const isTop = idx === rightHandMidis.length - 1;
    rig.grandPiano.triggerNote(
      midi,
      Math.min(totalDurSec * 0.94, 2.6),
      time + 0.008 + idx * 0.013,
      isTop ? 0.76 : 0.58 + (idx % 2) * 0.03,
      sustainPedal
    );
  });

  if (durationBeats >= 3 && rightHandMidis.length >= 2) {
    const midTime = time + (durationBeats * 0.5) * secPerBeat;
    rightHandMidis.slice(1).forEach((midi, idx) => {
      rig.grandPiano.triggerNote(
        midi,
        Math.min(totalDurSec * 0.45, 1.4),
        midTime + idx * 0.012,
        0.46,
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
  }
) {
  if (notes.length === 0) return;
  const durationSec = Math.max(0.25, durationBeats * secPerBeat);
  const pattern = options?.backingPattern ?? 'ballad-arpeggio';
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
      pattern,
      sustainPedal
    );
    return;
  }

  if (instrument === 'guitar-strum') {
    const strumSpacing = pattern === 'ballad-arpeggio' ? 0.055 : 0.034;
    notes.forEach((n, idx) => {
      rig.guitar.triggerAttackRelease(
        n,
        Math.min(durationSec, 1.5),
        time + idx * strumSpacing,
        0.78
      );
    });
    if (durationSec > 0.85 && notes.length >= 3) {
      if (pattern === 'pop-comp' && durationBeats >= 2) {
        notes.forEach((n, idx) => {
          rig.guitar.triggerAttackRelease(
            n,
            0.4,
            time + secPerBeat * 1.5 + idx * 0.02,
            0.55
          );
        });
      } else {
        rig.guitar.triggerAttackRelease(
          notes[notes.length - 1],
          0.45,
          time + durationSec * 0.46,
          0.54
        );
        rig.guitar.triggerAttackRelease(
          notes[1],
          0.4,
          time + durationSec * 0.72,
          0.48
        );
      }
    }
  } else {
    // Rhodes EP warm backing
    if (pattern === 'pop-comp' && durationBeats >= 2.2) {
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(secPerBeat * 1.3, 1.2),
        time,
        0.74
      );
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(secPerBeat * 1.1, 1.0),
        time + secPerBeat * 1.5,
        0.58
      );
    } else {
      rig.rhodes.triggerAttackRelease(
        notes,
        Math.min(durationSec * 0.92, 2.4),
        time,
        0.72
      );
    }
  }

  rig.bass.triggerAttackRelease(
    bassNote,
    Math.min(durationSec * 0.72, 1.6),
    time,
    0.72
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
      velocity,
      sustainPedal
    );
    return;
  }
  const noteName = midiToNoteName(midi);
  const synth = instrument === 'synth' ? rig.melodySynth : rig.melodyGuitar;
  synth.triggerAttackRelease(noteName, Math.max(0.12, durationSec), time, velocity);
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
  const secPerBeat = 60 / Math.max(55, Math.min(165, bpm));
  const chordBeats = 2;
  const stepSec = Math.max(0.75, Math.min(1.85, chordBeats * secPerBeat));
  const baseTime = Tone.now() + 0.03;

  let prevRh: number[] | undefined;
  symbols.forEach((sym, idx) => {
    const voicing = resolvePianistVoicing(sym, 0, prevRh);
    if (!voicing.valid) return;
    prevRh = voicing.rightHandMidis;
    const when = baseTime + idx * stepSec;
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
        backingPattern,
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

export interface LoopPlaybackOptions {
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  bpm: number;
  backingInstrument: BackingInstrumentId;
  backingPattern?: BackingPatternId;
  sustainPedal?: boolean;
  metronomeEnabled?: boolean;
  drumPattern: DrumPatternId;
  melodyInstrument: MelodyInstrumentId;
  onProgressBeat?: (
    beatInLoop: number,
    totalLoopBeats: number,
    currentSectionId: string
  ) => void;
}

export function stopGrooveLoop(): void {
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

function schedulePatternToTransport(
  rig: SynthRig,
  options: LoopPlaybackOptions,
  targetTransport: ReturnType<typeof Tone.getTransport>,
  isLoop: boolean
): {
  totalBeats: number;
  sectionBeatSpans: Array<{ id: string; start: number; end: number }>;
} {
  const { events, totalBeats } = buildChordTimeline(options.sections);
  const secPerBeat = 60 / Math.max(45, Math.min(180, options.bpm));
  const backingPattern = options.backingPattern ?? 'ballad-arpeggio';
  const sustainPedal = options.sustainPedal ?? true;

  const sectionBeatSpans: Array<{ id: string; start: number; end: number }> = [];
  let beatCursor = 0;
  options.sections.forEach((sec) => {
    const dur = sec.bars * 4;
    sectionBeatSpans.push({
      id: sec.id,
      start: beatCursor,
      end: beatCursor + dur,
    });
    beatCursor += dur;
  });

  // Schedule chords with smooth two-hand voicing & pattern style
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
      ev.durationBeats,
      secPerBeat,
      time,
      {
        rightHandMidis: ev.rightHandMidis,
        bassMidis: ev.bassMidis,
        backingPattern,
        sustainPedal,
      }
    );
  }, chordSchedule);

  chordPart.loop = isLoop;
  chordPart.loopEnd = totalBeats * secPerBeat;
  chordPart.start(0);
  activeLoopParts.push(chordPart);

  // Schedule melody notes
  const melodySchedule: Array<
    [number, { midi: number; durSec: number; vel: number }]
  > = [];
  sectionBeatSpans.forEach((span) => {
    const notesInSec = options.melodyNotes.filter((n) => n.sectionId === span.id);
    notesInSec.forEach((n) => {
      melodySchedule.push([
        (span.start + n.startBeat) * secPerBeat,
        {
          midi: n.midi,
          durSec: n.durationBeats * secPerBeat,
          vel: n.velocity,
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
      [number, { kick?: boolean; snare?: boolean; hat?: boolean; vel: number }]
    > = [];

    for (let step = 0; step < totalSteps; step++) {
      const stepInBar = step % 16;
      const swingOffset =
        options.drumPattern === 'lofi' && step % 2 === 1 ? stepSec * 0.14 : 0;
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

  const { totalBeats, sectionBeatSpans } = schedulePatternToTransport(
    rig,
    options,
    transport,
    true
  );
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
 * Offline renders the complete song sketch into a downloadable 16-bit PCM .WAV file using Concert Grand Piano!
 */
export async function renderDraftToWavBytes(
  draft: SketchpadDraft
): Promise<Uint8Array> {
  const { totalBeats } = buildChordTimeline(draft.sections);
  const secPerBeat = 60 / Math.max(45, Math.min(180, draft.bpm));
  const durationSec = Math.min(120, Math.max(2, totalBeats * secPerBeat + 1.6));

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
        backingPattern: draft.backingPattern ?? 'ballad-arpeggio',
        sustainPedal: draft.sustainPedal ?? true,
        metronomeEnabled: false,
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
