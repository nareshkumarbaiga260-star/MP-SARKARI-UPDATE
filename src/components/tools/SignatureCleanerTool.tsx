import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, PenTool, AlertCircle } from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';
import { triggerBlobDownload } from '../../utils/passportExport';

interface SignatureCleanerToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

export const SignatureCleanerTool: React.FC<SignatureCleanerToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState<number>(155);
  const [outWidth, setOutWidth] = useState<number>(280);
  const [outHeight, setOutHeight] = useState<number>(110);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [finalKb, setFinalKb] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
    };
  }, [srcUrl]);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('कृपया हस्ताक्षर की वैध इमेज फ़ाइल चुनें।');
      return;
    }
    const url = URL.createObjectURL(file);
    const loaded = new Image();
    loaded.onload = () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      setSrcUrl(url);
      setImg(loaded);
    };
    loaded.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg('फोटो लोड नहीं हो सकी।');
    };
    loaded.src = url;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outWidth, outHeight);

    const scale = Math.min(outWidth / img.naturalWidth, outHeight / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    ctx.drawImage(img, (outWidth - drawW) / 2, (outHeight - drawH) / 2, drawW, drawH);

    // High-contrast local cleaning: turn gray paper shadows to crisp pure white, keep dark ink sharp
    const imgData = ctx.getImageData(0, 0, outWidth, outHeight);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum > threshold) {
        d[i] = 255;
        d[i + 1] = 255;
        d[i + 2] = 255;
      } else {
        // Darken ink slightly for crisp form upload legibility
        const factor = Math.max(0.15, lum / threshold);
        d[i] = Math.round(d[i] * factor * 0.75);
        d[i + 1] = Math.round(d[i + 1] * factor * 0.75);
        d[i + 2] = Math.round(d[i + 2] * factor * 0.75);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob(
      (b) => {
        if (b) setFinalKb(Math.round((b.size / 1024) * 10) / 10);
      },
      'image/jpeg',
      0.92
    );
  }, [img, threshold, outWidth, outHeight]);

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    );
    if (blob) {
      triggerBlobDownload(blob, `mp-sarkari-signature-${outWidth}x${outHeight}.jpg`);
    }
  };

  return (
    <ToolPageShell
      titleHindi="हस्ताक्षर (Signature) बैकग्राउंड क्लीनर"
      subtitleHindi="सादे कागज़ के हस्ताक्षर की फोटो से ग्रे छाया हटाकर साफ़ डिजिटल सिग्नेचर तैयार करें"
      onBackToTools={onBackToTools}
      onBackToPortal={onBackToPortal}
    >
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />

      {!img ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto">
            <PenTool className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">हस्ताक्षर की फोटो अपलोड करें</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            सफेद कागज़ पर काली या नीली स्याही से किए गए हस्ताक्षर की फोटो चुनें।
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl text-sm cursor-pointer min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>हस्ताक्षर फोटो चुनें</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">क्लीनअप एवं साइज सेटिंग</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#BA0000] hover:underline cursor-pointer"
              >
                फोटो बदलें
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                <span>सफेदी / क्लीन थ्रेशोल्ड (Brightness Cutoff)</span>
                <span className="font-mono tabular-nums">{threshold}</span>
              </div>
              <input
                type="range"
                min={70}
                max={235}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-[#001F3F] cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 mb-1.5">सिग्नेचर साइज चुनें</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { w: 140, h: 60, label: '140×60 px' },
                  { w: 280, h: 110, label: '280×110 px' },
                  { w: 400, h: 160, label: '400×160 px' }
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setOutWidth(p.w);
                      setOutHeight(p.h);
                    }}
                    className={`py-2 px-2 rounded-lg border font-bold cursor-pointer ${
                      outWidth === p.w
                        ? 'bg-[#001F3F] text-white border-[#001F3F]'
                        : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs tabular-nums">
              <span className="font-black text-slate-900 text-sm">साफ़ सिग्नेचर प्रीव्यू</span>
              <span className="font-bold text-emerald-700">
                {outWidth}×{outHeight} px · लगभग {finalKb} KB
              </span>
            </div>

            <div className="bg-slate-100 rounded-xl p-6 flex items-center justify-center border border-slate-200 min-h-[200px]">
              <canvas
                ref={canvasRef}
                className="border-2 border-slate-400 bg-white shadow-sm max-w-full h-auto"
              />
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-5 py-3 rounded-xl text-sm cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>क्लीन सिग्नेचर JPG डाउनलोड करें</span>
            </button>
          </section>
        </div>
      )}
    </ToolPageShell>
  );
};
