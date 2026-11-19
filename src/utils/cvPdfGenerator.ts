import { jsPDF } from 'jspdf';
import { CvSourceData } from './portfolioLogic.ts';

interface FontAssetsCache {
  serifBoldBase64: string;
  sansRegularBase64: string;
  sansBoldBase64: string;
  monoRegularBase64: string;
  monoBoldBase64: string;
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

async function fetchFontBase64(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Không thể tải font ${path} để xuất PDF.`);
  }
  const buf = await res.arrayBuffer();
  return arrayBufferToBase64(buf);
}

async function loadCvFonts(): Promise<FontAssetsCache> {
  if (cachedFonts) {
    return cachedFonts;
  }
  const [serifBoldBase64, sansRegularBase64, sansBoldBase64, monoRegularBase64, monoBoldBase64] =
    await Promise.all([
      fetchFontBase64('/fonts/NotoSerifDisplay-Bold.ttf'),
      fetchFontBase64('/fonts/NotoSans-Regular.ttf'),
      fetchFontBase64('/fonts/NotoSans-Bold.ttf'),
      fetchFontFontSafe('/fonts/JetBrainsMono-Regular.ttf'),
      fetchFontFontSafe('/fonts/JetBrainsMono-SemiBold.ttf'),
    ]);

  cachedFonts = {
    serifBoldBase64,
    sansRegularBase64,
    sansBoldBase64,
    monoRegularBase64,
    monoBoldBase64,
  };
  return cachedFonts;
}

async function fetchFontFontSafe(path: string): Promise<string> {
  return fetchFontBase64(path);
}

async function loadRoundedImageDataUrl(
  src: string,
  options: { width: number; height: number; radius: number; alignTop?: boolean; bgColor?: string }
): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Image decode failed: ${src}`));
        image.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = options.width;
      canvas.height = options.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = options.bgColor ?? '#FFFFFF';
      ctx.fillRect(0, 0, options.width, options.height);

      ctx.save();
      const r = options.radius;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(options.width - r, 0);
      ctx.quadraticCurveTo(options.width, 0, options.width, r);
      ctx.lineTo(options.width, options.height - r);
      ctx.quadraticCurveTo(options.width, options.height, options.width - r, options.height);
      ctx.lineTo(r, options.height);
      ctx.quadraticCurveTo(0, options.height, 0, options.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();

      // Object-cover crop calculation
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = options.width / options.height;
      let drawW = options.width;
      let drawH = options.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgAspect > boxAspect) {
        drawW = options.height * imgAspect;
        offsetX = (options.width - drawW) / 2;
      } else {
        drawH = options.width / imgAspect;
        offsetY = options.alignTop ? 0 : (options.height - drawH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();

      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

function drawTopGradientStrip(doc: jsPDF, pageWidth: number, heightMm: number) {
  const steps = 42;
  const stepW = pageWidth / steps;
  // Multi-stop: #05080F (5,8,15) -> #0A192F (10,25,47) -> #0284C7 (2,132,199)
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    let r: number;
    let g: number;
    let b: number;
    if (t < 0.45) {
      const u = t / 0.45;
      r = Math.round(5 + (10 - 5) * u);
      g = Math.round(8 + (25 - 8) * u);
      b = Math.round(15 + (47 - 15) * u);
    } else {
      const u = (t - 0.45) / 0.55;
      r = Math.round(10 + (2 - 10) * u);
      g = Math.round(25 + (132 - 25) * u);
      b = Math.round(47 + (199 - 47) * u);
    }
    doc.setFillColor(r, g, b);
    doc.rect(i * stepW, 0, stepW + 0.35, heightMm, 'F');
  }
}

function drawContactIcon(
  doc: jsPDF,
  type: 'phone' | 'mail' | 'pin' | 'github' | 'globe',
  x: number,
  y: number
) {
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.32);

  if (type === 'phone') {
    doc.roundedRect(x + 0.5, y - 2.3, 1.9, 2.9, 0.35, 0.35, 'S');
    doc.line(x + 1.1, y + 0.15, x + 1.8, y + 0.15);
  } else if (type === 'mail') {
    doc.roundedRect(x + 0.2, y - 2.1, 2.8, 2.1, 0.3, 0.3, 'S');
    doc.line(x + 0.25, y - 1.95, x + 1.6, y - 0.95);
    doc.line(x + 2.95, y - 1.95, x + 1.6, y - 0.95);
  } else if (type === 'pin') {
    doc.circle(x + 1.5, y - 1.35, 1.05, 'S');
    doc.circle(x + 1.5, y - 1.35, 0.32, 'S');
    doc.line(x + 0.85, y - 0.55, x + 1.5, y + 0.3);
    doc.line(x + 2.15, y - 0.55, x + 1.5, y + 0.3);
  } else if (type === 'github') {
    doc.circle(x + 1.55, y - 1.0, 1.35, 'S');
    doc.line(x + 0.95, y - 0.75, x + 0.65, y - 1.05);
    doc.line(x + 0.65, y - 1.05, x + 0.95, y - 1.35);
    doc.line(x + 2.15, y - 0.75, x + 2.45, y - 1.05);
    doc.line(x + 2.45, y - 1.05, x + 2.15, y - 1.35);
  } else {
    doc.circle(x + 1.5, y - 1.0, 1.35, 'S');
    doc.line(x + 0.2, y - 1.0, x + 2.8, y - 1.0);
    doc.ellipse(x + 1.5, y - 1.0, 0.62, 1.35, 'S');
  }
}

/**
 * Renders a bullet row with bold title followed inline by normal description,
 * wrapping cleanly across the full specified line width without clipping or drift.
 */
function drawMixedBullet(
  doc: jsPDF,
  title: string,
  description: string,
  startX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  colors: { titleRgb: readonly [number, number, number]; bodyRgb: readonly [number, number, number] }
): number {
  const fontSize = 8;
  const bulletX = startX + 1.2;
  const textX = startX + 4.2;
  const availW = maxWidth - 4.2;

  doc.setFillColor(71, 85, 105);
  doc.circle(bulletX, startY - 0.9, 0.55, 'F');

  const words = [
    ...title
      .trim()
      .split(/\s+/)
      .map((w) => ({ word: w, bold: true })),
    ...description
      .trim()
      .split(/\s+/)
      .map((w) => ({ word: w, bold: false })),
  ];

  let lineWords: { word: string; bold: boolean }[] = [];
  let currentWidth = 0;
  let cursorY = startY;

  const measureToken = (token: { word: string; bold: boolean }, hasSpace: boolean): number => {
    doc.setFont('NotoSans', token.bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    return doc.getTextWidth((hasSpace ? ' ' : '') + token.word);
  };

  const flushLine = () => {
    let x = textX;
    for (let i = 0; i < lineWords.length; i++) {
      const token = lineWords[i];
      const prefix = i === 0 ? '' : ' ';
      doc.setFont('NotoSans', token.bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(...(token.bold ? colors.titleRgb : colors.bodyRgb));
      const str = prefix + token.word;
      doc.text(str, x, cursorY);
      x += doc.getTextWidth(str);
    }
    cursorY += lineHeight;
    lineWords = [];
    currentWidth = 0;
  };

  for (const token of words) {
    const w = measureToken(token, lineWords.length > 0);
    if (lineWords.length > 0 && currentWidth + w > availW) {
      flushLine();
      const freshW = measureToken(token, false);
      lineWords.push(token);
      currentWidth = freshW;
    } else {
      lineWords.push(token);
      currentWidth += w;
    }
  }

  if (lineWords.length > 0) {
    flushLine();
  }

  return cursorY;
}

function measureMixedBulletHeight(
  doc: jsPDF,
  title: string,
  description: string,
  maxWidth: number,
  lineHeight: number
): number {
  const fontSize = 8;
  const availW = maxWidth - 4.2;
  const words = [
    ...title
      .trim()
      .split(/\s+/)
      .map((w) => ({ word: w, bold: true })),
    ...description
      .trim()
      .split(/\s+/)
      .map((w) => ({ word: w, bold: false })),
  ];

  let lines = 1;
  let currentWidth = 0;
  let isFirstInLine = true;

  for (const token of words) {
    doc.setFont('NotoSans', token.bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    const w = doc.getTextWidth((isFirstInLine ? '' : ' ') + token.word);
    if (!isFirstInLine && currentWidth + w > availW) {
      lines += 1;
      currentWidth = doc.getTextWidth(token.word);
    } else {
      currentWidth += w;
      isFirstInLine = false;
    }
  }

  return lines * lineHeight;
}

export async function downloadPortfolioCvPdf(
  data: CvSourceData,
  options: { portraitSrc?: string; summaryParagraph: string }
): Promise<string> {
  const { profile, metrics, projects, skillGroups, aiAgents } = data;
  const [fonts, brandLogoDataUrl, portraitDataUrl] = await Promise.all([
    loadCvFonts(),
    loadRoundedImageDataUrl('/brand-logo.png', {
      width: 128,
      height: 128,
      radius: 26,
      bgColor: '#0A192F',
    }),
    options.portraitSrc
      ? loadRoundedImageDataUrl(options.portraitSrc, {
          width: 420,
          height: 525,
          radius: 44,
          alignTop: true,
          bgColor: '#0A192F',
        })
      : Promise.resolve(null),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  doc.addFileToVFS('NotoSerifDisplay-Bold.ttf', fonts.serifBoldBase64);
  doc.addFont('NotoSerifDisplay-Bold.ttf', 'NotoSerifDisplay', 'bold');

  doc.addFileToVFS('NotoSans-Regular.ttf', fonts.sansRegularBase64);
  doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');

  doc.addFileToVFS('NotoSans-Bold.ttf', fonts.sansBoldBase64);
  doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');

  doc.addFileToVFS('JetBrainsMono-Regular.ttf', fonts.monoRegularBase64);
  doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'normal');

  doc.addFileToVFS('JetBrainsMono-SemiBold.ttf', fonts.monoBoldBase64);
  doc.addFont('JetBrainsMono-SemiBold.ttf', 'JetBrainsMono', 'bold');

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 15;

  const colors = {
    navy: [10, 25, 47] as const,
    cobalt: [29, 78, 216] as const,
    ocean: [3, 105, 161] as const,
    oceanBright: [2, 132, 199] as const,
    ink: [7, 11, 20] as const,
    bodyDark: [51, 65, 85] as const,
    muted: [71, 85, 105] as const,
    softBg: [245, 248, 252] as const,
    border: [220, 230, 242] as const,
    hairline: [233, 240, 248] as const,
  };

  let cursorY = 12;

  const startNewPage = () => {
    doc.addPage();
    drawTopGradientStrip(doc, pageWidth, 1.8);
    cursorY = 14;
  };

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > bottomLimit) {
      startNewPage();
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(12);
    doc.setFont('JetBrainsMono', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.ocean);
    doc.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 2.2;
    doc.setDrawColor(...colors.hairline);
    doc.setLineWidth(0.35);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5.0;
  };

  // Top gradient accent strip matching Web CV sheet
  drawTopGradientStrip(doc, pageWidth, 2.6);

  // Header block: Candidate details (left) + Rounded Portrait (right)
  const portraitWidth = portraitDataUrl ? 26.5 : 0;
  const portraitHeight = portraitDataUrl ? 33.2 : 0;
  const headerTextWidth = portraitDataUrl ? contentWidth - portraitWidth - 8 : contentWidth;

  if (portraitDataUrl) {
    const px = pageWidth - marginX - portraitWidth;
    const py = cursorY;
    doc.addImage(portraitDataUrl, 'PNG', px, py, portraitWidth, portraitHeight);
    doc.setDrawColor(203, 216, 230);
    doc.setLineWidth(0.35);
    doc.roundedRect(px, py, portraitWidth, portraitHeight, 3.2, 3.2, 'S');
  }

  // Brand logo + Eyebrow
  let eyebrowX = marginX;
  if (brandLogoDataUrl) {
    doc.addImage(brandLogoDataUrl, 'PNG', marginX, cursorY - 0.5, 4.8, 4.8);
    eyebrowX += 6.6;
  }
  doc.setFont('JetBrainsMono', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(...colors.ocean);
  doc.text(
    `HỒ SƠ ỨNG VIÊN · ${profile.birthInfo.toUpperCase()}`,
    eyebrowX,
    cursorY + 3.0
  );

  // Candidate Full Name (Display Serif matching Cormorant Garamond)
  doc.setFont('NotoSerifDisplay', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...colors.ink);
  doc.text(profile.fullLegalName, marginX, cursorY + 11.2);

  // Role subtitle
  doc.setFont('NotoSans', 'bold');
  doc.setFontSize(9.8);
  doc.setTextColor(...colors.cobalt);
  doc.text(profile.role, marginX, cursorY + 16.8);

  // 2x2 Contact Grid matching Web CV
  const contactY1 = cursorY + 23.2;
  const contactY2 = cursorY + 28.4;
  const contactCol2X = marginX + Math.min(68, headerTextWidth * 0.48);

  drawContactIcon(doc, 'phone', marginX, contactY1);
  doc.setFont('JetBrainsMono', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(...colors.muted);
  doc.text(profile.phoneFormatted, marginX + 4.8, contactY1);

  drawContactIcon(doc, 'mail', contactCol2X, contactY1);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(8.2);
  doc.text(profile.email, contactCol2X + 4.8, contactY1);

  drawContactIcon(doc, 'pin', marginX, contactY2);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(8.2);
  doc.text(profile.location, marginX + 4.8, contactY2);

  drawContactIcon(doc, 'github', contactCol2X, contactY2);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(8.2);
  doc.text('github.com/thuanlevan72', contactCol2X + 4.8, contactY2);

  cursorY = Math.max(contactY2 + 5.5, cursorY + portraitHeight + 5.5);

  // Header bottom divider
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.35);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 5.5;

  // 4 Quantitative KPI Cards (single crisp value line + muted label)
  const metricGap = 3.2;
  const metricBoxWidth = (contentWidth - metricGap * 3) / 4;
  const metricBoxHeight = 19.5;

  metrics.forEach((metric, index) => {
    const boxX = marginX + index * (metricBoxWidth + metricGap);
    doc.setFillColor(...colors.softBg);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, cursorY, metricBoxWidth, metricBoxHeight, 2.4, 2.4, 'FD');

    doc.setFont('JetBrainsMono', 'bold');
    doc.setFontSize(12.2);
    doc.setTextColor(...colors.ink);
    doc.text(metric.value, boxX + 3.2, cursorY + 7.2);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...colors.muted);
    const labelLines = doc.splitTextToSize(metric.label, metricBoxWidth - 6.4);
    doc.text(labelLines.slice(0, 2), boxX + 3.2, cursorY + 12.2, { lineHeightFactor: 1.3 });
  });

  cursorY += metricBoxHeight + 7.5;

  // Section 1: Summary
  drawSectionHeading('Tóm Tắt Chuyên Môn');
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.ink);
  const summaryLines = doc.splitTextToSize(options.summaryParagraph, contentWidth);
  doc.text(summaryLines, marginX, cursorY, { lineHeightFactor: 1.42 });
  cursorY += summaryLines.length * 4.2 + 5.5;

  // Section 2: Production Experience & Systems
  drawSectionHeading('Kinh Nghiệm & Hệ Thống Production Trọng Điểm');

  projects.forEach((project, idx) => {
    // Always set exact font/size BEFORE every splitTextToSize!
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(8.2);
    const projectSummaryWrapped = doc.splitTextToSize(project.summary, contentWidth);

    doc.setFont('JetBrainsMono', 'normal');
    doc.setFontSize(7.4);
    const techWrapped = doc.splitTextToSize(
      `Công nghệ: ${project.tags.join(' · ')}`,
      contentWidth
    );

    const highlightHeights = project.highlights.map((h) =>
      measureMixedBulletHeight(doc, h.title, h.description, contentWidth, 3.9)
    );
    const totalHighlightsH = highlightHeights.reduce((acc, h) => acc + h + 0.9, 0);

    const totalProjectH =
      6.5 +
      projectSummaryWrapped.length * 4.0 +
      1.5 +
      totalHighlightsH +
      techWrapped.length * 3.7 +
      5.5;

    ensureSpace(totalProjectH);

    // Project Title (left) + Org & Meta (right)
    doc.setFont('NotoSerifDisplay', 'bold');
    doc.setFontSize(11.4);
    doc.setTextColor(...colors.ink);
    doc.text(project.title, marginX, cursorY);

    doc.setFont('JetBrainsMono', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.ocean);
    const orgPrefix = `${project.orgBadge} · `;
    doc.setFont('JetBrainsMono', 'normal');
    const metaSuffix = project.meta;

    doc.setFont('JetBrainsMono', 'normal');
    const metaW = doc.getTextWidth(metaSuffix);
    doc.setFont('JetBrainsMono', 'bold');
    const orgW = doc.getTextWidth(orgPrefix);

    const orgX = pageWidth - marginX - metaW - orgW;
    doc.setTextColor(...colors.ocean);
    doc.text(orgPrefix, orgX, cursorY);
    doc.setFont('JetBrainsMono', 'normal');
    doc.setTextColor(...colors.muted);
    doc.text(metaSuffix, pageWidth - marginX - metaW, cursorY);

    cursorY += 4.6;

    // Summary line (medium/dark)
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...colors.bodyDark);
    doc.text(projectSummaryWrapped, marginX, cursorY, { lineHeightFactor: 1.38 });
    cursorY += projectSummaryWrapped.length * 4.0 + 1.4;

    // Highlights with inline bold title + normal description
    for (const h of project.highlights) {
      cursorY = drawMixedBullet(doc, h.title, h.description, marginX, cursorY, contentWidth, 3.9, {
        titleRgb: colors.ink,
        bodyRgb: colors.muted,
      });
      cursorY += 0.9;
    }

    // Tech stack line
    doc.setFont('JetBrainsMono', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(...colors.navy);
    doc.text(techWrapped, marginX, cursorY + 0.6, { lineHeightFactor: 1.35 });
    cursorY += techWrapped.length * 3.7 + 2.5;

    if (idx < projects.length - 1) {
      doc.setDrawColor(...colors.hairline);
      doc.setLineWidth(0.25);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 4.5;
    } else {
      cursorY += 3.5;
    }
  });

  // Section 3: Technical Skills Matrix (2x2 Rounded Cards matching Web CV)
  drawSectionHeading('Năng Lực Kỹ Thuật & Hệ Sinh Thái Công Nghệ');

  const cardGap = 4.0;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardPadX = 3.8;
  const cardPadY = 4.8;
  const cardInnerW = cardWidth - cardPadX * 2;

  for (let i = 0; i < skillGroups.length; i += 2) {
    const leftGroup = skillGroups[i];
    const rightGroup = skillGroups[i + 1];

    const prepareSkillCard = (group: typeof leftGroup | undefined) => {
      if (!group) return null;
      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(7.4);
      const descLines = doc.splitTextToSize(group.description, cardInnerW);

      doc.setFont('JetBrainsMono', 'normal');
      doc.setFontSize(7.1);
      const itemLines = doc.splitTextToSize(group.items.join(' · '), cardInnerW);

      const height =
        cardPadY + 4.4 + descLines.length * 3.5 + 1.8 + itemLines.length * 3.5 + cardPadY - 1.2;
      return { group, descLines, itemLines, height };
    };

    const leftPrepared = prepareSkillCard(leftGroup);
    const rightPrepared = prepareSkillCard(rightGroup);
    const rowHeight = Math.max(leftPrepared?.height ?? 0, rightPrepared?.height ?? 0);

    ensureSpace(rowHeight + 3.5);

    const drawSkillCard = (
      prepared: ReturnType<typeof prepareSkillCard>,
      x: number,
      y: number
    ) => {
      if (!prepared) return;
      doc.setFillColor(...colors.softBg);
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, cardWidth, rowHeight, 2.5, 2.5, 'FD');

      let cy = y + cardPadY + 1.2;
      doc.setFont('NotoSerifDisplay', 'bold');
      doc.setFontSize(10.2);
      doc.setTextColor(...colors.ink);
      doc.text(prepared.group.title, x + cardPadX, cy);

      cy += 4.4;
      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(...colors.muted);
      doc.text(prepared.descLines, x + cardPadX, cy, { lineHeightFactor: 1.32 });

      cy += prepared.descLines.length * 3.5 + 1.8;
      doc.setFont('JetBrainsMono', 'normal');
      doc.setFontSize(7.1);
      doc.setTextColor(...colors.ocean);
      doc.text(prepared.itemLines, x + cardPadX, cy, { lineHeightFactor: 1.35 });
    };

    drawSkillCard(leftPrepared, marginX, cursorY);
    drawSkillCard(rightPrepared, marginX + cardWidth + cardGap, cursorY);

    cursorY += rowHeight + cardGap;
  }

  cursorY += 2.5;

  // Section 4: AI Agent Practical Experience (2x2 Rounded Cards matching Web CV)
  if (aiAgents && aiAgents.length > 0) {
    drawSectionHeading('Kinh Nghiệm Sử Dụng AI Agent (Claude · Gemini · Codex · Grok)');

    for (let i = 0; i < aiAgents.length; i += 2) {
      const leftAgent = aiAgents[i];
      const rightAgent = aiAgents[i + 1];

      const prepareAgentCard = (agent: typeof leftAgent | undefined) => {
        if (!agent) return null;
        doc.setFont('JetBrainsMono', 'normal');
        doc.setFontSize(7.0);
        const roleLines = doc.splitTextToSize(agent.roleSummary, cardInnerW);

        doc.setFont('NotoSans', 'normal');
        doc.setFontSize(7.6);
        const usageLines = doc.splitTextToSize(agent.simpleUsage, cardInnerW);

        const height =
          cardPadY + 4.4 + roleLines.length * 3.3 + 2.0 + usageLines.length * 3.6 + cardPadY - 1.0;
        return { agent, roleLines, usageLines, height };
      };

      const leftPrepared = prepareAgentCard(leftAgent);
      const rightPrepared = prepareAgentCard(rightAgent);
      const rowHeight = Math.max(leftPrepared?.height ?? 0, rightPrepared?.height ?? 0);

      ensureSpace(rowHeight + 3.5);

      const drawAgentCard = (
        prepared: ReturnType<typeof prepareAgentCard>,
        x: number,
        y: number
      ) => {
        if (!prepared) return;
        doc.setFillColor(...colors.softBg);
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardWidth, rowHeight, 2.5, 2.5, 'FD');

        let cy = y + cardPadY + 1.2;
        doc.setFont('NotoSerifDisplay', 'bold');
        doc.setFontSize(10.2);
        doc.setTextColor(...colors.ink);
        doc.text(prepared.agent.name, x + cardPadX, cy);

        cy += 4.1;
        doc.setFont('JetBrainsMono', 'normal');
        doc.setFontSize(7.0);
        doc.setTextColor(...colors.ocean);
        doc.text(prepared.roleLines, x + cardPadX, cy, { lineHeightFactor: 1.3 });

        cy += prepared.roleLines.length * 3.3 + 2.0;
        doc.setFont('NotoSans', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(...colors.muted);
        doc.text(prepared.usageLines, x + cardPadX, cy, { lineHeightFactor: 1.36 });
      };

      drawAgentCard(leftPrepared, marginX, cursorY);
      drawAgentCard(rightPrepared, marginX + cardWidth + cardGap, cursorY);

      cursorY += rowHeight + cardGap;
    }
  }

  // Sheet Reference Footer matching Web CV
  ensureSpace(12);
  cursorY += 1.5;
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  cursorY += 5.2;

  drawContactIcon(doc, 'globe', marginX, cursorY);
  doc.setFont('NotoSans', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.muted);
  doc.text(
    'Hồ sơ trực tuyến & minh chứng năng lực sáng tạo hình ảnh AI · Cập nhật 2026',
    marginX + 4.8,
    cursorY
  );
  doc.setFont('JetBrainsMono', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.ocean);
  doc.text('thuanlevan.vercel.app', pageWidth - marginX, cursorY, { align: 'right' });

  // Page numbers & clean footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, pageHeight - 10.5, pageWidth - marginX, pageHeight - 10.5);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...colors.muted);
    doc.text(
      `CV Kỹ Sư Senior .NET — ${profile.fullLegalName} (${profile.email})`,
      marginX,
      pageHeight - 6.2
    );
    doc.text(
      `Trang ${pageNum} / ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 6.2,
      { align: 'right' }
    );
  }

  const filename = 'Le-Van-Thuan-CV-Senior-NET.pdf';
  doc.save(filename);
  return filename;
}
