import { jsPDF } from 'jspdf';

export type PaperLayout = '4x6' | 'a4';
export type CopyCount = 6 | 12 | 24;
export type BackgroundColorOption = 'white' | 'blue' | 'red';

export interface CropTransform {
  /** Zoom factor relative to cover-fit (1 = cover-fit inside 35x45mm frame) */
  zoom: number;
  /** Horizontal offset in normalized frame units (-1 to +1, where 1 = half frame width) */
  offsetX: number;
  /** Vertical offset in normalized frame units (-1 to +1, where 1 = half frame height) */
  offsetY: number;
}

// Exact 300 DPI conversion constants
export const DPI = 300;
export const MM_PER_INCH = 25.4;
export const PX_PER_MM = DPI / MM_PER_INCH; // 11.811023622047244 px/mm

// Main passport photo physical & pixel dimensions at 300 DPI
export const PHOTO_WIDTH_MM = 35;
export const PHOTO_HEIGHT_MM = 45;
export const PHOTO_WIDTH_PX = Math.round(PHOTO_WIDTH_MM * PX_PER_MM); // 413 px
export const PHOTO_HEIGHT_PX = Math.round(PHOTO_HEIGHT_MM * PX_PER_MM); // 531 px

export const BACKGROUND_COLORS: Record<
  BackgroundColorOption,
  { id: BackgroundColorOption; hex: string; labelHindi: string; labelEn: string }
> = {
  white: { id: 'white', hex: '#FFFFFF', labelHindi: 'सफेद', labelEn: 'White' },
  blue: { id: 'blue', hex: '#1D63B8', labelHindi: 'नीला', labelEn: 'Blue' },
  red: { id: 'red', hex: '#C81E1E', labelHindi: 'लाल', labelEn: 'Red' }
};

export interface SheetPhotoSlot {
  index: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface SheetLayoutSpec {
  paperSize: PaperLayout;
  paperLabel: string;
  paperWidthMm: number;
  paperHeightMm: number;
  paperWidthPx: number;
  paperHeightPx: number;
  totalCopies: CopyCount;
  perSheetCapacity: number;
  totalSheets: number;
  cols: number;
  rows: number;
  sheets: SheetPhotoSlot[][];
}

/**
 * Computes exact physical millimeter coordinates on 4x6 inch or A4 paper
 * guaranteeing every photo slot stays strictly 35 x 45 mm at 300 DPI.
 */
export function computeSheetLayout(
  paperSize: PaperLayout,
  totalCopies: CopyCount
): SheetLayoutSpec {
  const is4x6 = paperSize === '4x6';
  const paperWidthMm = is4x6 ? 101.6 : 210; // 4 in = 101.6 mm | A4 = 210 mm
  const paperHeightMm = is4x6 ? 152.4 : 297; // 6 in = 152.4 mm | A4 = 297 mm
  const paperWidthPx = is4x6 ? 1200 : 2480; // 4*300 = 1200 px | 210/25.4*300 = 2480 px
  const paperHeightPx = is4x6 ? 1800 : 3508; // 6*300 = 1800 px | 297/25.4*300 = 3508 px

  let cols = 2;
  let rows = 3;
  let gapXMm = 4;
  let gapYMm = 4;

  if (is4x6) {
    // 4x6 portrait cleanly holds 2 x 3 = 6 exact 35x45mm photos per sheet
    // 2*35 + 4 = 74mm width (13.8mm L/R margins); 3*45 + 8 = 143mm height (4.7mm T/B margins)
    cols = 2;
    rows = 3;
    gapXMm = 4;
    gapYMm = 4;
  } else {
    // A4 holds all 6, 12, or 24 exact 35x45mm photos on 1 single sheet with safe printer margins
    if (totalCopies === 6) {
      cols = 3;
      rows = 2;
      gapXMm = 5;
      gapYMm = 5;
    } else if (totalCopies === 12) {
      cols = 4;
      rows = 3;
      gapXMm = 5;
      gapYMm = 5;
    } else {
      // 24 copies on A4: 5 columns x 5 rows (5,5,5,5,4)
      // Width: 5*35 + 4*4 = 191mm -> 9.5mm side margins
      // Height: 5*45 + 4*4 = 241mm -> 28mm top/bottom total margin
      cols = 5;
      rows = 5;
      gapXMm = 4;
      gapYMm = 4;
    }
  }

  const perSheetCapacity = cols * rows;
  const totalSheets = Math.ceil(totalCopies / perSheetCapacity);

  const gridWidthMm = cols * PHOTO_WIDTH_MM + (cols - 1) * gapXMm;
  const startXMm = (paperWidthMm - gridWidthMm) / 2;

  const sheets: SheetPhotoSlot[][] = [];
  let remaining = totalCopies;
  let runningIndex = 0;

  for (let s = 0; s < totalSheets; s++) {
    const countOnThisSheet = Math.min(perSheetCapacity, remaining);
    const actualRowsOnSheet = Math.ceil(countOnThisSheet / cols);
    const gridHeightMm = actualRowsOnSheet * PHOTO_HEIGHT_MM + (actualRowsOnSheet - 1) * gapYMm;
    const startYMm = is4x6
      ? (paperHeightMm - gridHeightMm) / 2
      : Math.min(18, (paperHeightMm - gridHeightMm) / 2);

    const slots: SheetPhotoSlot[] = [];
    for (let i = 0; i < countOnThisSheet; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      slots.push({
        index: runningIndex++,
        xMm: startXMm + col * (PHOTO_WIDTH_MM + gapXMm),
        yMm: startYMm + row * (PHOTO_HEIGHT_MM + gapYMm),
        widthMm: PHOTO_WIDTH_MM,
        heightMm: PHOTO_HEIGHT_MM
      });
    }
    sheets.push(slots);
    remaining -= countOnThisSheet;
  }

  return {
    paperSize,
    paperLabel: is4x6 ? '4×6 इंच (101.6 × 152.4 mm)' : 'A4 (210 × 297 mm)',
    paperWidthMm,
    paperHeightMm,
    paperWidthPx,
    paperHeightPx,
    totalCopies,
    perSheetCapacity,
    totalSheets,
    cols,
    rows,
    sheets
  };
}

/**
 * Renders a single 35 × 45 mm passport photo at exact 300 DPI (413 × 531 px).
 */
export function renderSinglePassportPhotoCanvas(params: {
  source: HTMLImageElement | HTMLCanvasElement;
  backgroundHex: string | null; // null keeps original photo without solid fill
  crop: CropTransform;
}): HTMLCanvasElement {
  const { source, backgroundHex, crop } = params;
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_WIDTH_PX;
  canvas.height = PHOTO_HEIGHT_PX;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Paint selected passport background (White / Blue / Red)
  ctx.fillStyle = backgroundHex || '#FFFFFF';
  ctx.fillRect(0, 0, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);

  const srcW = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  if (!srcW || !srcH) return canvas;

  // Cover-fit base scale inside 35x45mm frame
  const baseScale = Math.max(PHOTO_WIDTH_PX / srcW, PHOTO_HEIGHT_PX / srcH);
  const drawW = srcW * baseScale * crop.zoom;
  const drawH = srcH * baseScale * crop.zoom;

  const centerX = PHOTO_WIDTH_PX / 2 + crop.offsetX * (PHOTO_WIDTH_PX / 2);
  const centerY = PHOTO_HEIGHT_PX / 2 + crop.offsetY * (PHOTO_HEIGHT_PX / 2);

  ctx.drawImage(source, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
  return canvas;
}

/**
 * Renders one complete print sheet (4x6 inch or A4) at exact 300 DPI pixel resolution.
 */
export function renderPrintSheetCanvas(params: {
  singlePhotoCanvas: HTMLCanvasElement;
  layout: SheetLayoutSpec;
  sheetIndex: number;
  showCutBorders: boolean;
}): HTMLCanvasElement {
  const { singlePhotoCanvas, layout, sheetIndex, showCutBorders } = params;
  const canvas = document.createElement('canvas');
  canvas.width = layout.paperWidthPx;
  canvas.height = layout.paperHeightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Pure white print paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const slots = layout.sheets[sheetIndex] || [];
  const scaleX = layout.paperWidthPx / layout.paperWidthMm;
  const scaleY = layout.paperHeightPx / layout.paperHeightMm;

  for (const slot of slots) {
    const xPx = Math.round(slot.xMm * scaleX);
    const yPx = Math.round(slot.yMm * scaleY);
    const wPx = Math.round(slot.widthMm * scaleX);
    const hPx = Math.round(slot.heightMm * scaleY);

    ctx.drawImage(singlePhotoCanvas, xPx, yPx, wPx, hPx);

    if (showCutBorders) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xPx + 0.5, yPx + 0.5, wPx - 1, hPx - 1);

      // Subtle outer corner crop ticks (1.5mm)
      const tick = Math.round(1.8 * scaleX);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(xPx - tick, yPx);
      ctx.lineTo(xPx, yPx);
      ctx.lineTo(xPx, yPx - tick);
      // Top-right
      ctx.moveTo(xPx + wPx + tick, yPx);
      ctx.lineTo(xPx + wPx, yPx);
      ctx.lineTo(xPx + wPx, yPx - tick);
      // Bottom-left
      ctx.moveTo(xPx - tick, yPx + hPx);
      ctx.lineTo(xPx, yPx + hPx);
      ctx.lineTo(xPx, yPx + hPx + tick);
      // Bottom-right
      ctx.moveTo(xPx + wPx + tick, yPx + hPx);
      ctx.lineTo(xPx + wPx, yPx + hPx);
      ctx.lineTo(xPx + wPx, yPx + hPx + tick);
      ctx.stroke();
    }
  }

  return canvas;
}

/**
 * Patches or inserts a JFIF APP0 header setting exact 300 × 300 DPI metadata on a JPEG buffer.
 */
function embed300DpiInJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return bytes;
  }

  // Check if JFIF APP0 is already at offset 2
  if (
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && // J
    bytes[7] === 0x46 && // F
    bytes[8] === 0x49 && // I
    bytes[9] === 0x46 && // F
    bytes[10] === 0x00
  ) {
    const out = new Uint8Array(bytes);
    out[13] = 0x01; // units = pixels per inch
    out[14] = (DPI >> 8) & 0xff;
    out[15] = DPI & 0xff;
    out[16] = (DPI >> 8) & 0xff;
    out[17] = DPI & 0xff;
    return out;
  }

  // Insert valid 18-byte APP0 JFIF segment directly after SOI (0xFF 0xD8)
  const app0 = new Uint8Array([
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x01, // 1 = DPI
    (DPI >> 8) & 0xff,
    DPI & 0xff,
    (DPI >> 8) & 0xff,
    DPI & 0xff,
    0x00,
    0x00
  ]);

  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.slice(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.slice(2), 2 + app0.length);
  return out;
}

/**
 * Converts a canvas to a print-ready 300 DPI JPEG Blob.
 */
export async function canvasTo300DpiJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const rawBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('JPG निर्माण में त्रुटि हुई।'))),
      'image/jpeg',
      0.96
    );
  });

  const buffer = await rawBlob.arrayBuffer();
  const patched = embed300DpiInJpeg(new Uint8Array(buffer));
  const safeArrayBuffer = new ArrayBuffer(patched.byteLength);
  new Uint8Array(safeArrayBuffer).set(patched);
  return new Blob([safeArrayBuffer], { type: 'image/jpeg' });
}

/**
 * Triggers a clean browser download for a Blob without opening popups.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Exports an exact millimeter print-ready multi-page PDF using jsPDF.
 * Every photo slot is placed at exact 35.0 x 45.0 mm using a 300 DPI image.
 */
export function exportPassportPdf(params: {
  singlePhotoCanvas: HTMLCanvasElement;
  layout: SheetLayoutSpec;
  showCutBorders: boolean;
  filename: string;
}): void {
  const { singlePhotoCanvas, layout, showCutBorders, filename } = params;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format:
      layout.paperSize === 'a4'
        ? 'a4'
        : [layout.paperWidthMm, layout.paperHeightMm],
    compress: true
  });

  const singlePhotoDataUrl = singlePhotoCanvas.toDataURL('image/jpeg', 0.98);

  layout.sheets.forEach((slots, sheetIdx) => {
    if (sheetIdx > 0) {
      pdf.addPage(
        layout.paperSize === 'a4'
          ? 'a4'
          : [layout.paperWidthMm, layout.paperHeightMm],
        'portrait'
      );
    }

    for (const slot of slots) {
      pdf.addImage(
        singlePhotoDataUrl,
        'JPEG',
        slot.xMm,
        slot.yMm,
        slot.widthMm,
        slot.heightMm,
        'passport_slot',
        'NONE'
      );

      if (showCutBorders) {
        pdf.setDrawColor(148, 163, 184);
        pdf.setLineWidth(0.2);
        pdf.rect(slot.xMm, slot.yMm, slot.widthMm, slot.heightMm, 'S');

        // Crisp 1.8mm outer crop marks
        const t = 1.8;
        pdf.setDrawColor(100, 116, 139);
        pdf.setLineWidth(0.25);
        // Top-left
        pdf.line(slot.xMm - t, slot.yMm, slot.xMm, slot.yMm);
        pdf.line(slot.xMm, slot.yMm - t, slot.xMm, slot.yMm);
        // Top-right
        pdf.line(slot.xMm + slot.widthMm, slot.yMm, slot.xMm + slot.widthMm + t, slot.yMm);
        pdf.line(slot.xMm + slot.widthMm, slot.yMm - t, slot.xMm + slot.widthMm, slot.yMm);
        // Bottom-left
        pdf.line(slot.xMm - t, slot.yMm + slot.heightMm, slot.xMm, slot.yMm + slot.heightMm);
        pdf.line(slot.xMm, slot.yMm + slot.heightMm, slot.xMm, slot.yMm + slot.heightMm + t);
        // Bottom-right
        pdf.line(
          slot.xMm + slot.widthMm,
          slot.yMm + slot.heightMm,
          slot.xMm + slot.widthMm + t,
          slot.yMm + slot.heightMm
        );
        pdf.line(
          slot.xMm + slot.widthMm,
          slot.yMm + slot.heightMm,
          slot.xMm + slot.widthMm,
          slot.yMm + slot.heightMm + t
        );
      }
    }
  });

  pdf.save(filename);
}
