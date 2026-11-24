import { jsPDF } from 'jspdf';
import {
  analyzeSectionLyrics,
  buildMidiFileBytes,
  MOOD_STYLE_OPTIONS,
  resolveBeatsPerBar,
  type SketchpadDraft,
} from './lyricGrooveEngine.ts';
import { renderDraftToWavBytes } from './lyricGrooveAudio.ts';

function sanitizeFilename(raw: string): string {
  return (
    raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ban-nhap-sang-tac'
  );
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Renders a crisp high-DPI Lead Sheet with chords anchored right above Vietnamese lyrics.
 */
export function renderLeadSheetCanvas(draft: SketchpadDraft): HTMLCanvasElement {
  const width = 1240;
  const paddingX = 76;
  const lineHeight = 58;

  const beatsPerBar = resolveBeatsPerBar(draft.timeSignature);
  // First pass: calculate total height accurately
  let estimatedHeight = 230;
  const analyzedSections = draft.sections.map((section) => ({
    section,
    analysis: analyzeSectionLyrics(section, beatsPerBar),
  }));
  analyzedSections.forEach(({ analysis }) => {
    estimatedHeight += 76 + Math.max(1, analysis.lines.length) * lineHeight + 28;
  });
  estimatedHeight = Math.max(900, estimatedHeight + 90);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = estimatedHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Clean off-white paper canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, estimatedHeight);

  // Subtle top accent hairline
  ctx.fillStyle = '#0A192F';
  ctx.fillRect(0, 0, width, 8);

  // Title & Metadata
  ctx.fillStyle = '#070B14';
  ctx.font = '700 40px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(draft.title || 'Bản Nháp Sáng Tác', paddingX, 92);

  const moodLabel =
    MOOD_STYLE_OPTIONS.find((m) => m.id === draft.mood)?.label ?? draft.mood;
  const metaLine = `Tông ${draft.keyRoot} ${
    draft.scaleMode === 'major' ? 'Trưởng' : 'Thứ'
  }  ·  Nhịp ${draft.timeSignature ?? '4/4'}  ·  ${draft.bpm} BPM  ·  Phong cách: ${moodLabel}  ·  ${
    draft.sections.length
  } đoạn nhạc`;

  ctx.fillStyle = '#475569';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(metaLine, paddingX, 134);

  // Hairline divider
  ctx.strokeStyle = '#DCE6F2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingX, 162);
  ctx.lineTo(width - paddingX, 162);
  ctx.stroke();

  let y = 216;

  analyzedSections.forEach(({ section, analysis }) => {
    // Section Header
    ctx.fillStyle = '#0284C7';
    ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${section.kind.toUpperCase()} — ${section.label} (${section.bars} ô nhịp)`,
      paddingX,
      y
    );
    y += 42;

    analysis.lines.forEach((line) => {
      if (!line.rawLine.trim()) {
        y += 22;
        return;
      }

      // Draw chords positioned proportionally along the line
      ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
      const lyricText = line.lyricOnlyLine || '';
      const lyricWidth = Math.max(260, ctx.measureText(lyricText).width);

      let lastChordX = -999;
      line.chords.forEach((ch) => {
        const ratio =
          lyricText.length > 0
            ? Math.min(0.96, ch.charIndex / Math.max(1, lyricText.length))
            : 0;
        let chordX = paddingX + ratio * lyricWidth;
        if (chordX < lastChordX + 68) {
          chordX = lastChordX + 68;
        }
        ctx.fillStyle = '#0369A1';
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.fillText(ch.symbol, chordX, y);
        lastChordX = chordX;
      });

      // Draw lyric line below chord row
      ctx.fillStyle = '#0F172A';
      ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(lyricText, paddingX, y + 27);

      // Right-aligned syllable count marker
      ctx.fillStyle = '#64748B';
      ctx.font = '500 15px "JetBrains Mono", monospace';
      const countText = `${line.syllableCount} tiếng`;
      const countW = ctx.measureText(countText).width;
      ctx.fillText(countText, width - paddingX - countW, y + 26);

      y += lineHeight;
    });

    y += 28;
  });

  // Footer
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'Xuất từ Lyric & Groove Sketchpad — Bàn Nháp Sáng Tác Tức Thì',
    paddingX,
    estimatedHeight - 36
  );

  return canvas;
}

export function exportLeadSheetPng(draft: SketchpadDraft): void {
  const canvas = renderLeadSheetCanvas(draft);
  canvas.toBlob((blob) => {
    if (!blob) return;
    triggerBlobDownload(blob, `${sanitizeFilename(draft.title)}-lead-sheet.png`);
  }, 'image/png');
}

export function exportLeadSheetPdf(draft: SketchpadDraft): void {
  const canvas = renderLeadSheetCanvas(draft);
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let remainingHeight = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  remainingHeight -= pageHeight;

  while (remainingHeight > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
  }

  pdf.save(`${sanitizeFilename(draft.title)}-lead-sheet.pdf`);
}

export function exportMidiFile(draft: SketchpadDraft): void {
  const bytes = buildMidiFileBytes(draft);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'audio/midi' });
  triggerBlobDownload(blob, `${sanitizeFilename(draft.title)}.mid`);
}

export async function exportWavAudioDemo(draft: SketchpadDraft): Promise<void> {
  const wavBytes = await renderDraftToWavBytes(draft);
  const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
  triggerBlobDownload(blob, `${sanitizeFilename(draft.title)}-demo.wav`);
}
