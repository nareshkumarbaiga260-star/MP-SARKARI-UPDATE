import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileImage,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  AlertCircle,
  Check
} from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';

interface ImageToPdfToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

interface ImageItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
}

export const ImageToPdfTool: React.FC<ImageToPdfToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [marginMm, setMarginMm] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImageItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    };
  }, []);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const added: ImageItem[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = reject;
          img.src = url;
        });
        added.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url,
          width: dims.w,
          height: dims.h
        });
      } catch {
        URL.revokeObjectURL(url);
      }
    }

    if (added.length === 0) {
      setErrorMsg('कृपया वैध JPG या PNG फोटो चुनें।');
      return;
    }
    setItems((prev) => [...prev, ...added]);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const tmp = copy[idx];
    copy[idx] = copy[next];
    copy[next] = tmp;
    setItems(copy);
  };

  const removeItem = (idx: number) => {
    const target = items[idx];
    if (target) URL.revokeObjectURL(target.url);
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreatePdf = async () => {
    if (items.length === 0) return;
    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageW = 210;
      const pageH = 297;
      const availW = pageW - marginMm * 2;
      const availH = pageH - marginMm * 2;

      for (let i = 0; i < items.length; i++) {
        if (i > 0) pdf.addPage('a4', 'portrait');
        const it = items[i];

        // Normalize orientation & canvas encoding safely into JPEG data URL
        const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = it.url;
        });

        const canvas = document.createElement('canvas');
        const scalePx = Math.min(1, 1800 / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
        canvas.width = Math.round(imgEl.naturalWidth * scalePx);
        canvas.height = Math.round(imgEl.naturalHeight * scalePx);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
        }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        const fitScale = Math.min(availW / it.width, availH / it.height);
        const drawW = it.width * fitScale;
        const drawH = it.height * fitScale;
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
      }

      pdf.save(`mp-sarkari-documents-${items.length}-pages.pdf`);
      setSuccessMsg(`${items.length} पेज की A4 PDF सफलतापूर्वक डाउनलोड हो गई।`);
    } catch {
      setErrorMsg('PDF बनाने में समस्या हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolPageShell
      titleHindi="इमेज से PDF कन्वर्टर (Image to PDF)"
      subtitleHindi="अंकसूची, प्रमाण पत्र व दस्तावेज़ों की फोटो को क्रम से जोड़कर मल्टी-पेज A4 PDF बनाएं"
      onBackToTools={onBackToTools}
      onBackToPortal={onBackToPortal}
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-[#BA0000]" />
              <span>चयनित दस्तावेज़ फोटो ({items.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              आप एक साथ कई फोटो चुन सकते हैं और ऊपर-नीचे क्रम बदल सकते हैं।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>मार्जिन:</span>
              <select
                value={marginMm}
                onChange={(e) => setMarginMm(Number(e.target.value))}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
              >
                <option value={0}>कोई मार्जिन नहीं (0 mm)</option>
                <option value={10}>मानक (10 mm)</option>
                <option value={18}>बड़ा (18 mm)</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer min-h-[40px]"
            >
              <Upload className="w-4 h-4" />
              <span>फोटो जोड़ें</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">
              अभी कोई फोटो नहीं जोड़ी गई है
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm cursor-pointer min-h-[44px]"
            >
              <Upload className="w-4 h-4" />
              <span>दस्तावेज़ फोटो चुनें</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((it, idx) => (
              <div
                key={it.id}
                className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex flex-col gap-2"
              >
                <div className="aspect-[3/4] bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={it.url}
                    alt={it.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-800 truncate">
                  {idx + 1}. {it.name}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                      aria-label="ऊपर ले जाएं"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                      aria-label="नीचे ले जाएं"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                    aria-label="हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleCreatePdf}
            className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-sm cursor-pointer min-h-[46px]"
          >
            <FileText className="w-4 h-4" />
            <span>
              {isGenerating
                ? 'PDF तैयार की जा रही है...'
                : `A4 PDF बनाएं और डाउनलोड करें (${items.length} पेज)`}
            </span>
          </button>
        )}
      </div>
    </ToolPageShell>
  );
};
