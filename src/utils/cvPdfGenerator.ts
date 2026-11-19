import { jsPDF } from 'jspdf';
import { CvSourceData } from './portfolioLogic.ts';

interface FontAssetsCache {
  regularBase64: string;
  boldBase64: string;
}

let cachedFonts: FontAssetsCache | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function loadVietnameseFonts(): Promise<FontAssetsCache> {
  if (cachedFonts) {
    return cachedFonts;
  }
  const [regularRes, boldRes] = await Promise.all([
    fetch('/fonts/DejaVuSans.ttf'),
    fetch('/fonts/DejaVuSans-Bold.ttf'),
  ]);
  if (!regularRes.ok || !boldRes.ok) {
    throw new Error('Không thể tải bộ font Unicode tiếng Việt để xuất PDF.');
  }
  const [regularBuf, boldBuf] = await Promise.all([
    regularRes.arrayBuffer(),
    boldRes.arrayBuffer(),
  ]);
  cachedFonts = {
    regularBase64: arrayBufferToBase64(regularBuf),
    boldBase64: arrayBufferToBase64(boldBuf),
  };
  return cachedFonts;
}

async function loadPortraitAsJpegDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Portrait decode failed'));
        image.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      const targetWidth = 360;
      const targetHeight = Math.round((img.naturalHeight / img.naturalWidth) * targetWidth);
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#0A192F';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.9);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

export async function downloadPortfolioCvPdf(
  data: CvSourceData,
  options: { portraitSrc?: string; summaryParagraph: string }
): Promise<string> {
  const { profile, metrics, projects, skillGroups, aiAgents } = data;
  const fonts = await loadVietnameseFonts();
  const portraitDataUrl = options.portraitSrc
    ? await loadPortraitAsJpegDataUrl(options.portraitSrc)
    : null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.addFileToVFS('DejaVuSans.ttf', fonts.regularBase64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.boldBase64);
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 16;

  const colors = {
    navy: [10, 25, 47] as const,
    ocean: [2, 132, 199] as const,
    ink: [7, 11, 20] as const,
    muted: [71, 85, 105] as const,
    softBg: [244, 247, 251] as const,
    border: [215, 226, 238] as const,
  };

  let cursorY = 14;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > bottomLimit) {
      doc.addPage();
      cursorY = 15;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(12);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colors.navy);
    doc.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 2.2;
    doc.setDrawColor(...colors.ocean);
    doc.setLineWidth(0.5);
    doc.line(marginX, cursorY, marginX + 26, cursorY);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.25);
    doc.line(marginX + 26, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5.5;
  };

  // Top decorative navy bar
  doc.setFillColor(...colors.navy);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Header block
  const portraitWidth = portraitDataUrl ? 26 : 0;
  const portraitHeight = portraitDataUrl ? 34 : 0;
  const headerTextWidth = portraitDataUrl ? contentWidth - portraitWidth - 6 : contentWidth;

  if (portraitDataUrl) {
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.addImage(
      portraitDataUrl,
      'JPEG',
      pageWidth - marginX - portraitWidth,
      cursorY,
      portraitWidth,
      portraitHeight
    );
    doc.rect(pageWidth - marginX - portraitWidth, cursorY, portraitWidth, portraitHeight);
  }

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(...colors.navy);
  doc.text(profile.fullLegalName, marginX, cursorY + 5.5);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colors.ocean);
  doc.text(profile.role, marginX, cursorY + 11.5);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.muted);
  const contactLine1 = `${profile.birthInfo}  ·  ${profile.location}  ·  SĐT: ${profile.phoneFormatted}`;
  const contactLine2 = `Email: ${profile.email}  ·  GitHub: github.com/thuanlevan72`;
  const line1Wrapped = doc.splitTextToSize(contactLine1, headerTextWidth);
  const line2Wrapped = doc.splitTextToSize(contactLine2, headerTextWidth);

  doc.text(line1Wrapped, marginX, cursorY + 18);
  doc.text(line2Wrapped, marginX, cursorY + 23);

  const headerBottom = Math.max(cursorY + 30, cursorY + portraitHeight + 2);
  cursorY = headerBottom + 4;

  // Metrics strip (4 boxes)
  const metricGap = 3;
  const metricBoxWidth = (contentWidth - metricGap * 3) / 4;
  const metricBoxHeight = 16.5;

  metrics.forEach((metric, index) => {
    const boxX = marginX + index * (metricBoxWidth + metricGap);
    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(boxX, cursorY, metricBoxWidth, metricBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.navy);
    doc.text(metric.value, boxX + 2.5, cursorY + 6);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(...colors.muted);
    const labelLines = doc.splitTextToSize(metric.label, metricBoxWidth - 5);
    doc.text(labelLines.slice(0, 2), boxX + 2.5, cursorY + 10.5);
  });

  cursorY += metricBoxHeight + 7;

  // Summary section
  drawSectionHeading('Tóm Tắt Chuyên Môn');
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...colors.ink);
  const summaryLines = doc.splitTextToSize(options.summaryParagraph, contentWidth);
  doc.text(summaryLines, marginX, cursorY);
  cursorY += summaryLines.length * 4.3 + 5.5;

  // Projects / Experience section
  drawSectionHeading('Kinh Nghiệm & Hệ Thống Production Trọng Điểm');

  for (const project of projects) {
    const summaryWrapped = doc.splitTextToSize(project.summary, contentWidth);
    const techWrapped = doc.splitTextToSize(
      `Công nghệ: ${project.tags.join(' · ')}`,
      contentWidth
    );

    // Measure estimated height for cleaner pagination
    let highlightLinesCount = 0;
    const preparedHighlights = project.highlights.map((h) => {
      const text = `• ${h.title} ${h.description}`;
      const wrapped = doc.splitTextToSize(text, contentWidth - 3);
      highlightLinesCount += wrapped.length;
      return wrapped;
    });

    const estimatedHeight =
      11 +
      summaryWrapped.length * 4 +
      highlightLinesCount * 4 +
      techWrapped.length * 3.8 +
      5;
    ensureSpace(Math.min(estimatedHeight, 48));

    // Project Title + Meta on same line
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.navy);
    doc.text(project.title, marginX, cursorY);

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.ocean);
    const metaRight = `${project.orgBadge}  |  ${project.meta}`;
    doc.text(metaRight, pageWidth - marginX, cursorY, { align: 'right' });

    cursorY += 4.3;
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...colors.ink);
    doc.text(summaryWrapped, marginX, cursorY);
    cursorY += summaryWrapped.length * 4 + 1.2;

    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    for (const wrapped of preparedHighlights) {
      ensureSpace(wrapped.length * 3.9 + 2);
      doc.text(wrapped, marginX + 2, cursorY);
      cursorY += wrapped.length * 3.9 + 0.8;
    }

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(...colors.navy);
    doc.text(techWrapped, marginX, cursorY + 0.5);
    cursorY += techWrapped.length * 3.8 + 4.5;
  }

  // Skills section
  drawSectionHeading('Năng Lực Kỹ Thuật & Công Nghệ');

  const colGap = 6;
  const colWidth = (contentWidth - colGap) / 2;

  for (let i = 0; i < skillGroups.length; i += 2) {
    const leftGroup = skillGroups[i];
    const rightGroup = skillGroups[i + 1];

    const leftItems = doc.splitTextToSize(leftGroup.items.join(' · '), colWidth);
    const rightItems = rightGroup
      ? doc.splitTextToSize(rightGroup.items.join(' · '), colWidth)
      : [];
    const maxLines = Math.max(leftItems.length, rightItems.length);
    const rowHeight = 6 + maxLines * 4 + 3.5;

    ensureSpace(rowHeight);

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(...colors.navy);
    doc.text(leftGroup.title, marginX, cursorY);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.muted);
    doc.text(leftItems, marginX, cursorY + 4.3);

    if (rightGroup) {
      const rightX = marginX + colWidth + colGap;
      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...colors.navy);
      doc.text(rightGroup.title, rightX, cursorY);

      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(rightItems, rightX, cursorY + 4.3);
    }

    cursorY += rowHeight;
  }

  // AI Agent Practical Experience section
  if (aiAgents && aiAgents.length > 0) {
    cursorY += 3;
    drawSectionHeading('Kinh Nghiệm Sử Dụng AI Agent (Claude · Gemini · Codex · Grok)');

    for (const agent of aiAgents) {
      const descText = `${agent.roleSummary}: ${agent.simpleUsage}`;
      const descWrapped = doc.splitTextToSize(descText, contentWidth);
      const itemHeight = 5 + descWrapped.length * 3.9 + 2.5;
      ensureSpace(itemHeight);

      doc.setFont('DejaVuSans', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(...colors.navy);
      doc.text(`${agent.name} (${agent.provider})`, marginX, cursorY);

      cursorY += 4.1;
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.muted);
      doc.text(descWrapped, marginX, cursorY);
      cursorY += descWrapped.length * 3.9 + 2.4;
    }
  }

  // Page numbers & clean footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.muted);
    doc.text(
      `CV Kỹ Sư Senior .NET — ${profile.fullLegalName} (${profile.email})`,
      marginX,
      pageHeight - 6.5
    );
    doc.text(
      `Trang ${pageNum} / ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 6.5,
      { align: 'right' }
    );
  }

  const filename = 'Le-Van-Thuan-CV-Senior-NET.pdf';
  doc.save(filename);
  return filename;
}
