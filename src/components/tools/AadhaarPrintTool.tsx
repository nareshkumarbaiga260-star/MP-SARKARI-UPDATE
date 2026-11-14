import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  CreditCard,
  Upload,
  Download,
  FileText,
  RotateCw,
  Scissors,
  Printer,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';
import {
  DPI,
  MM_PER_INCH,
  canvasTo300DpiJpegBlob,
  triggerBlobDownload
} from '../../utils/passportExport';

interface AadhaarPrintToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

// ISO CR80 standard smart card size (85.60 × 53.98 mm ≈ 85.6 × 54 mm)
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 54.0;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PX_PER_MM = DPI / MM_PER_INCH;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * PX_PER_MM); // 2480
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * PX_PER_MM); // 3508
const CARD_WIDTH_PX = Math.round(CARD_WIDTH_MM * PX_PER_MM); // 1011
const CARD_HEIGHT_PX = Math.round(CARD_HEIGHT_MM * PX_PER_MM); // 638

interface SideState {
  url: string | null;
  img: HTMLImageElement | null;
  rotation: number; // 0, 90, 180, 270
}

export const AadhaarPrintTool: React.FC<AadhaarPrintToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const [front, setFront] = useState<SideState>({ url: null, img: null, rotation: 0 });
  const [back, setBack] = useState<SideState>({ url: null, img: null, rotation: 0 });
  const [arrangement, setArrangement] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (front.url) URL.revokeObjectURL(front.url);
      if (back.url) URL.revokeObjectURL(back.url);
    };
  }, [front.url, back.url]);

  const loadSideFile = (side: 'front' | 'back', file: File | undefined | null) => {
    if (!file) return;
    setErrorMsg(null);
    setNoticeMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('कृपया आधार कार्ड के आगे या पीछे की वैध इमेज (JPG/PNG) चुनें।');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (side === 'front') {
        if (front.url) URL.revokeObjectURL(front.url);
        setFront({ url, img, rotation: 0 });
      } else {
        if (back.url) URL.revokeObjectURL(back.url);
        setBack({ url, img, rotation: 0 });
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg('फोटो लोड करने में समस्या आई। कृपया दूसरी इमेज चुनें।');
    };
    img.src = url;
  };

  const renderCardCanvas = (side: SideState): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH_PX;
    canvas.height = CARD_HEIGHT_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CARD_WIDTH_PX, CARD_HEIGHT_PX);

    if (!side.img) return canvas;

    const rotRad = (side.rotation * Math.PI) / 180;
    const isSwapped = side.rotation === 90 || side.rotation === 270;
    const srcW = isSwapped ? side.img.naturalHeight : side.img.naturalWidth;
    const srcH = isSwapped ? side.img.naturalWidth : side.img.naturalHeight;

    // Fit nicely inside 85.6 × 54 mm card keeping full content visible
    const scale = Math.min(CARD_WIDTH_PX / srcW, CARD_HEIGHT_PX / srcH);
    const drawW = side.img.naturalWidth * scale;
    const drawH = side.img.naturalHeight * scale;

    ctx.save();
    ctx.translate(CARD_WIDTH_PX / 2, CARD_HEIGHT_PX / 2);
    ctx.rotate(rotRad);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(side.img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    return canvas;
  };

  const buildA4SheetCanvas = (): HTMLCanvasElement => {
    const sheet = document.createElement('canvas');
    sheet.width = A4_WIDTH_PX;
    sheet.height = A4_HEIGHT_PX;
    const ctx = sheet.getContext('2d');
    if (!ctx) return sheet;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

    const positions =
      arrangement === 'side-by-side'
        ? [
            { xMm: (A4_WIDTH_MM - (CARD_WIDTH_MM * 2 + 8)) / 2, yMm: 22, side: front },
            {
              xMm: (A4_WIDTH_MM - (CARD_WIDTH_MM * 2 + 8)) / 2 + CARD_WIDTH_MM + 8,
              yMm: 22,
              side: back
            }
          ]
        : [
            { xMm: (A4_WIDTH_MM - CARD_WIDTH_MM) / 2, yMm: 22, side: front },
            { xMm: (A4_WIDTH_MM - CARD_WIDTH_MM) / 2, yMm: 22 + CARD_HEIGHT_MM + 10, side: back }
          ];

    for (const pos of positions) {
      const xPx = Math.round(pos.xMm * PX_PER_MM);
      const yPx = Math.round(pos.yMm * PX_PER_MM);
      if (pos.side.img) {
        const cardCanvas = renderCardCanvas(pos.side);
        ctx.drawImage(cardCanvas, xPx, yPx, CARD_WIDTH_PX, CARD_HEIGHT_PX);
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(xPx, yPx, CARD_WIDTH_PX, CARD_HEIGHT_PX);
      }

      if (showBorders) {
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 2;
        ctx.strokeRect(xPx, yPx, CARD_WIDTH_PX, CARD_HEIGHT_PX);
      }
    }

    return sheet;
  };

  useEffect(() => {
    const preview = previewCanvasRef.current;
    if (!preview) return;
    const full = buildA4SheetCanvas();
    const scale = Math.min(1, 840 / full.width);
    preview.width = Math.round(full.width * scale);
    preview.height = Math.round(full.height * scale);
    const ctx = preview.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(full, 0, 0, preview.width, preview.height);
  });

  const handleDownloadJpg = async () => {
    if (!front.img && !back.img) {
      setErrorMsg('कृपया कम से कम फ्रंट या बैक कार्ड फोटो अपलोड करें।');
      return;
    }
    const sheet = buildA4SheetCanvas();
    const blob = await canvasTo300DpiJpegBlob(sheet);
    triggerBlobDownload(blob, 'mp-sarkari-aadhaar-print-a4-300dpi.jpg');
    setNoticeMsg('300 DPI A4 प्रिंट JPG डाउनलोड हो गई।');
  };

  const handleDownloadPdf = () => {
    if (!front.img && !back.img) {
      setErrorMsg('कृपया कम से कम फ्रंट या बैक कार्ड फोटो अपलोड करें।');
      return;
    }
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const positions =
      arrangement === 'side-by-side'
        ? [
            { xMm: (A4_WIDTH_MM - (CARD_WIDTH_MM * 2 + 8)) / 2, yMm: 22, side: front },
            {
              xMm: (A4_WIDTH_MM - (CARD_WIDTH_MM * 2 + 8)) / 2 + CARD_WIDTH_MM + 8,
              yMm: 22,
              side: back
            }
          ]
        : [
            { xMm: (A4_WIDTH_MM - CARD_WIDTH_MM) / 2, yMm: 22, side: front },
            { xMm: (A4_WIDTH_MM - CARD_WIDTH_MM) / 2, yMm: 22 + CARD_HEIGHT_MM + 10, side: back }
          ];

    for (const pos of positions) {
      if (pos.side.img) {
        const cardDataUrl = renderCardCanvas(pos.side).toDataURL('image/jpeg', 0.96);
        pdf.addImage(cardDataUrl, 'JPEG', pos.xMm, pos.yMm, CARD_WIDTH_MM, CARD_HEIGHT_MM);
      }
      if (showBorders) {
        pdf.setDrawColor(100, 116, 139);
        pdf.setLineWidth(0.25);
        pdf.rect(pos.xMm, pos.yMm, CARD_WIDTH_MM, CARD_HEIGHT_MM, 'S');
      }
    }

    pdf.save('mp-sarkari-aadhaar-print-a4-85.6x54mm.pdf');
    setNoticeMsg('A4 प्रिंट-रेडी PDF (85.6 × 54 mm स्मार्ट कार्ड साइज) डाउनलोड हो गई।');
  };

  return (
    <ToolPageShell
      titleHindi="आधार कार्ड A4 / स्मार्ट कार्ड प्रिंट मेकर (Aadhaar Print)"
      subtitleHindi="सटीक 85.6 × 54 mm (CR80) साइज में आगे व पीछे का भाग A4 शीट पर प्रिंट हेतु तैयार करें"
      onBackToTools={onBackToTools}
      onBackToPortal={onBackToPortal}
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {noticeMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{noticeMsg}</span>
        </div>
      )}

      <input
        ref={frontInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => loadSideFile('front', e.target.files?.[0])}
        className="hidden"
      />
      <input
        ref={backInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => loadSideFile('back', e.target.files?.[0])}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-4">
          {/* Front & Back Uploaders */}
          {[
            { key: 'front' as const, label: '1. आगे का भाग (Front Side)', state: front, inputRef: frontInputRef },
            { key: 'back' as const, label: '2. पीछे का भाग (Back Side)', state: back, inputRef: backInputRef }
          ].map((item) => (
            <section
              key={item.key}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#BA0000]" />
                  <span>{item.label}</span>
                </h2>
                {item.state.img && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        item.key === 'front'
                          ? setFront((p) => ({ ...p, rotation: (p.rotation + 90) % 360 }))
                          : setBack((p) => ({ ...p, rotation: (p.rotation + 90) % 360 }))
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>घुमाएं</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        item.key === 'front'
                          ? setFront({ url: null, img: null, rotation: 0 })
                          : setBack({ url: null, img: null, rotation: 0 })
                      }
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      aria-label="हटाएं"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => item.inputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#001F3F] bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 flex items-center justify-center gap-2 transition cursor-pointer min-h-[44px]"
              >
                <Upload className="w-4 h-4 text-[#BA0000]" />
                <span>{item.state.img ? 'अन्य फोटो चुनें' : 'फोटो अपलोड करें'}</span>
              </button>
            </section>
          ))}

          {/* Layout Settings */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-black text-slate-900">3. प्रिंट सेटिंग (A4 शीट)</h2>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setArrangement('side-by-side')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                  arrangement === 'side-by-side'
                    ? 'bg-[#001F3F] text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                साथ-साथ (Side by Side)
              </button>
              <button
                type="button"
                onClick={() => setArrangement('stacked')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                  arrangement === 'stacked'
                    ? 'bg-[#001F3F] text-white'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                ऊपर-नीचे (Stacked)
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showBorders}
                onChange={(e) => setShowBorders(e.target.checked)}
                className="accent-[#001F3F] w-4 h-4"
              />
              <Scissors className="w-3.5 h-3.5 text-slate-500" />
              <span>कार्ड कटिंग बॉर्डर दिखाएं (85.6 × 54 mm)</span>
            </label>
          </section>
        </div>

        {/* Right: A4 Live Preview & Downloads */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                A4 प्रिंट शीट प्रीव्यू (300 DPI)
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                प्रत्येक कार्ड साइज: 85.6 × 54 mm · केवल ब्राउज़र मेमोरी में प्रोसेसिंग
              </p>
            </div>
          </div>

          <div className="bg-slate-200/70 rounded-xl p-4 flex items-center justify-center border border-slate-200">
            <canvas
              ref={previewCanvasRef}
              className="bg-white shadow-md border border-slate-300 max-h-[460px] w-auto max-w-full aspect-[210/297]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>सीधे प्रिंट करें</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadJpg}
              className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>JPG डाउनलोड (300 DPI)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span>A4 PDF डाउनलोड</span>
            </button>
          </div>
        </section>
      </div>
    </ToolPageShell>
  );
};
