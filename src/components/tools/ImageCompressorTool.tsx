import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Minimize2, AlertCircle, Check } from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';
import { triggerBlobDownload } from '../../utils/passportExport';

interface ImageCompressorToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

export const ImageCompressorTool: React.FC<ImageCompressorToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

  const [targetMaxKb, setTargetMaxKb] = useState<number>(50);
  const [targetWidth, setTargetWidth] = useState<number>(400);
  const [targetHeight, setTargetHeight] = useState<number>(500);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputPreviewUrl, setOutputPreviewUrl] = useState<string | null>(null);
  const [usedQuality, setUsedQuality] = useState<number>(90);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      if (outputPreviewUrl) URL.revokeObjectURL(outputPreviewUrl);
    };
  }, [srcUrl, outputPreviewUrl]);

  const handleFile = (file: File | undefined | null) => {
    if (!file) return;
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('कृपया वैध इमेज फ़ाइल (JPG, PNG, WebP) चुनें।');
      return;
    }

    const url = URL.createObjectURL(file);
    const loaded = new Image();
    loaded.onload = () => {
      if (srcUrl) URL.revokeObjectURL(srcUrl);
      setSrcUrl(url);
      setImg(loaded);
      setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
      setTargetWidth(Math.min(loaded.naturalWidth, 800));
      setTargetHeight(
        Math.round((Math.min(loaded.naturalWidth, 800) / loaded.naturalWidth) * loaded.naturalHeight)
      );
    };
    loaded.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg('फोटो लोड नहीं हो सकी।');
    };
    loaded.src = url;
  };

  // Compress locally to match target KB via binary quality search
  useEffect(() => {
    if (!img || targetWidth < 20 || targetHeight < 20) return;

    let cancelled = false;
    (async () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const targetBytes = targetMaxKb * 1024;
      let low = 0.1;
      let high = 0.96;
      let bestBlob: Blob | null = null;
      let bestQ = 0.85;

      for (let i = 0; i < 7; i++) {
        const mid = (low + high) / 2;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', mid)
        );
        if (!blob) break;
        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQ = mid;
          low = mid;
        } else {
          high = mid;
          if (!bestBlob) {
            bestBlob = blob;
            bestQ = mid;
          }
        }
      }

      if (cancelled || !bestBlob) return;
      const previewUrl = URL.createObjectURL(bestBlob);
      setOutputBlob(bestBlob);
      setUsedQuality(Math.round(bestQ * 100));
      setOutputPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [img, targetWidth, targetHeight, targetMaxKb]);

  const applyPreset = (w: number, h: number, kb: number) => {
    setKeepAspect(false);
    setTargetWidth(w);
    setTargetHeight(h);
    setTargetMaxKb(kb);
  };

  return (
    <ToolPageShell
      titleHindi="फोटो रिसाइज़र एवं KB कंप्रेसर (Image Tools)"
      subtitleHindi="सरकारी आवेदन फॉर्म (MPESB, MPPSC, SSC) के लिए 20 KB – 200 KB तक सटीक फोटो साइज"
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
          <div className="w-14 h-14 bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto">
            <Minimize2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            कंप्रेस या रिसाइज़ करने के लिए फोटो चुनें
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            ब्राउज़र में ही सेकंडों में फोटो का साइज 20 KB, 50 KB या 100 KB के भीतर लाएं।
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl text-sm cursor-pointer min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>फोटो चुनें</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">साइज व KB सेटिंग</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#BA0000] hover:underline cursor-pointer"
              >
                नई फोटो चुनें
              </button>
            </div>

            {/* Quick Govt Form Presets */}
            <div>
              <span className="block text-xs font-bold text-slate-700 mb-1.5">
                सरकारी फॉर्म प्रीसेट (Quick Presets)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyPreset(413, 531, 50)}
                  className="p-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-left cursor-pointer"
                >
                  पासपोर्ट (413×531 px · 50KB)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(200, 230, 50)}
                  className="p-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-left cursor-pointer"
                >
                  SSC/व्यापमं फोटो (200×230 · 50KB)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(140, 60, 20)}
                  className="p-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-left cursor-pointer"
                >
                  हस्ताक्षर (140×60 · 20KB)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(800, 1100, 150)}
                  className="p-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 font-bold text-left cursor-pointer"
                >
                  दस्तावेज़/मार्कशीट (150KB)
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                <span>अधिकतम फाइल साइज (Target KB)</span>
                <span className="font-mono tabular-nums text-[#BA0000]">{targetMaxKb} KB</span>
              </div>
              <input
                type="range"
                min={15}
                max={300}
                step={5}
                value={targetMaxKb}
                onChange={(e) => setTargetMaxKb(Number(e.target.value))}
                className="w-full accent-[#BA0000] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">चौड़ाई (Width px)</label>
                <input
                  type="number"
                  min={50}
                  max={2500}
                  value={targetWidth}
                  onChange={(e) => {
                    const w = Math.max(50, Number(e.target.value) || 50);
                    setTargetWidth(w);
                    if (keepAspect && img) {
                      setTargetHeight(Math.round((w / img.naturalWidth) * img.naturalHeight));
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ऊँचाई (Height px)</label>
                <input
                  type="number"
                  min={50}
                  max={2500}
                  value={targetHeight}
                  onChange={(e) => {
                    const h = Math.max(50, Number(e.target.value) || 50);
                    setTargetHeight(h);
                    if (keepAspect && img) {
                      setTargetWidth(Math.round((h / img.naturalHeight) * img.naturalWidth));
                    }
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={keepAspect}
                onChange={(e) => setKeepAspect(e.target.checked)}
                className="accent-[#001F3F] w-4 h-4"
              />
              <span>सही अनुपात बनाए रखें (Lock Aspect Ratio)</span>
            </label>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs tabular-nums">
              <span>
                मूल फाइल: <strong>{originalSizeKb} KB</strong> ({img.naturalWidth}×{img.naturalHeight} px)
              </span>
              {outputBlob && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                  <Check className="w-4 h-4" />
                  नया साइज: {(outputBlob.size / 1024).toFixed(1)} KB ({targetWidth}×{targetHeight} px · {usedQuality}% गुणवत्ता)
                </span>
              )}
            </div>

            <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[260px] border border-slate-200">
              {outputPreviewUrl && (
                <img
                  src={outputPreviewUrl}
                  alt="Compressed Preview"
                  className="max-h-[320px] w-auto border border-slate-300 shadow-sm bg-white"
                />
              )}
            </div>

            <button
              type="button"
              disabled={!outputBlob}
              onClick={() =>
                outputBlob &&
                triggerBlobDownload(
                  outputBlob,
                  `mp-sarkari-resized-${targetWidth}x${targetHeight}-${Math.round(outputBlob.size / 1024)}kb.jpg`
                )
              }
              className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl text-sm cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>कंप्रेस्ड JPG डाउनलोड करें</span>
            </button>
          </section>
        </div>
      )}
    </ToolPageShell>
  );
};
