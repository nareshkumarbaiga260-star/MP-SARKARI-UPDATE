import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  FileText,
  Eye,
  Printer,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
  Scissors,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import {
  computePortraitAlphaMask,
  buildTransparentCutoutCanvas
} from '../utils/backgroundRemoval';
import {
  PaperLayout,
  CopyCount,
  BackgroundColorOption,
  CropTransform,
  BACKGROUND_COLORS,
  PHOTO_WIDTH_MM,
  PHOTO_HEIGHT_MM,
  PHOTO_WIDTH_PX,
  PHOTO_HEIGHT_PX,
  computeSheetLayout,
  renderSinglePassportPhotoCanvas,
  renderPrintSheetCanvas,
  canvasTo300DpiJpegBlob,
  triggerBlobDownload,
  exportPassportPdf
} from '../utils/passportExport';

interface PassportPhotoMakerProps {
  initialPaperLayout?: PaperLayout;
  initialCopies?: CopyCount;
  onBackToPortal?: () => void;
  onBackToTools?: () => void;
}

const DEFAULT_CROP: CropTransform = {
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0
};

export const PassportPhotoMaker: React.FC<PassportPhotoMakerProps> = ({
  initialPaperLayout = '4x6',
  initialCopies = 6,
  onBackToPortal,
  onBackToTools
}) => {
  // Source image state (stored strictly in local browser memory only)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [cutoutCanvas, setCutoutCanvas] = useState<HTMLCanvasElement | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  // Background removal settings
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);
  const [bgSensitivity, setBgSensitivity] = useState<number>(0.52);
  const [bgColor, setBgColor] = useState<BackgroundColorOption>('white');

  // Crop & position settings (35 x 45 mm frame)
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);
  const [showFaceGuide, setShowFaceGuide] = useState<boolean>(true);

  // Print layout & copies (Strictly 6, 12, 24; 4x6 or A4)
  const [copies, setCopies] = useState<CopyCount>(initialCopies);
  const [paperLayout, setPaperLayout] = useState<PaperLayout>(initialPaperLayout);
  const [showCutBorders, setShowCutBorders] = useState<boolean>(true);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);

  // Export & preview states
  const [isExportingJpg, setIsExportingJpg] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [printPreviewUrls, setPrintPreviewUrls] = useState<string[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const sheetPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    origOffsetX: 0,
    origOffsetY: 0
  });

  // Sync preset props if launched via preset shortcut
  useEffect(() => {
    setPaperLayout(initialPaperLayout);
    setCopies(initialCopies);
    setActiveSheetIdx(0);
  }, [initialPaperLayout, initialCopies]);

  // Compute exact sheet layout (35x45mm @ 300 DPI)
  const sheetLayout = useMemo(
    () => computeSheetLayout(paperLayout, copies),
    [paperLayout, copies]
  );

  // Keep activeSheetIdx within valid bounds when layout/copies change
  useEffect(() => {
    if (activeSheetIdx >= sheetLayout.totalSheets) {
      setActiveSheetIdx(0);
    }
  }, [activeSheetIdx, sheetLayout.totalSheets]);

  // Revoke object URL on change/unmount so zero temporary data lingers
  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  // Revoke print preview URLs on close/cleanup
  useEffect(() => {
    return () => {
      printPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [printPreviewUrls]);

  // Run automatic local background removal whenever image, toggle, or sensitivity changes
  useEffect(() => {
    if (!loadedImage || !autoRemoveBg) {
      setCutoutCanvas(null);
      setIsRemovingBg(false);
      return;
    }

    let cancelled = false;
    setIsRemovingBg(true);

    const timer = window.setTimeout(async () => {
      try {
        const maskResult = await computePortraitAlphaMask(loadedImage, {
          sensitivity: bgSensitivity,
          featherPasses: 2
        });
        if (cancelled) return;
        const cutout = buildTransparentCutoutCanvas(loadedImage, maskResult);
        if (cancelled) return;
        setCutoutCanvas(cutout);
      } catch (err) {
        console.warn('Local background removal fallback:', err);
        if (!cancelled) {
          setCutoutCanvas(null);
        }
      } finally {
        if (!cancelled) {
          setIsRemovingBg(false);
        }
      }
    }, 60);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadedImage, autoRemoveBg, bgSensitivity]);

  // Render single 35x45mm 300 DPI passport photo canvas
  const singlePhotoCanvas = useMemo(() => {
    if (!loadedImage) return null;
    const activeSource = autoRemoveBg && cutoutCanvas ? cutoutCanvas : loadedImage;
    const hex = BACKGROUND_COLORS[bgColor].hex;
    return renderSinglePassportPhotoCanvas({
      source: activeSource,
      backgroundHex: hex,
      crop
    });
  }, [loadedImage, autoRemoveBg, cutoutCanvas, bgColor, crop]);

  // Paint interactive 35x45mm cropper canvas
  useEffect(() => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    canvas.width = PHOTO_WIDTH_PX;
    canvas.height = PHOTO_HEIGHT_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (singlePhotoCanvas) {
      ctx.drawImage(singlePhotoCanvas, 0, 0);
    } else {
      ctx.fillStyle = BACKGROUND_COLORS[bgColor].hex;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Optional visual face/head alignment guide (NEVER included in exported singlePhotoCanvas)
    if (showFaceGuide && loadedImage) {
      ctx.save();
      ctx.strokeStyle = bgColor === 'white' ? 'rgba(15, 23, 42, 0.35)' : 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);

      // Head oval guide (~60% height centered cleanly for 35x45mm passport specs)
      ctx.beginPath();
      ctx.ellipse(
        PHOTO_WIDTH_PX / 2,
        PHOTO_HEIGHT_PX * 0.42,
        PHOTO_WIDTH_PX * 0.27,
        PHOTO_HEIGHT_PX * 0.28,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Eye-line & shoulder guides
      ctx.beginPath();
      ctx.moveTo(PHOTO_WIDTH_PX * 0.15, PHOTO_HEIGHT_PX * 0.4);
      ctx.lineTo(PHOTO_WIDTH_PX * 0.85, PHOTO_HEIGHT_PX * 0.4);
      ctx.stroke();
      ctx.restore();
    }
  }, [singlePhotoCanvas, showFaceGuide, loadedImage, bgColor]);

  // Paint live print sheet preview canvas
  useEffect(() => {
    const canvas = sheetPreviewCanvasRef.current;
    if (!canvas || !singlePhotoCanvas) return;

    const fullSheet = renderPrintSheetCanvas({
      singlePhotoCanvas,
      layout: sheetLayout,
      sheetIndex: activeSheetIdx,
      showCutBorders
    });

    // Scale preview cleanly for crisp retina display without heavy DOM memory
    const maxPreviewW = 900;
    const scale = Math.min(1, maxPreviewW / fullSheet.width);
    canvas.width = Math.round(fullSheet.width * scale);
    canvas.height = Math.round(fullSheet.height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fullSheet, 0, 0, canvas.width, canvas.height);
  }, [singlePhotoCanvas, sheetLayout, activeSheetIdx, showCutBorders]);

  const handleFileLoad = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      setUploadError(null);
      setStatusNotice(null);

      if (!file.type.startsWith('image/')) {
        setUploadError('कृपया केवल वैध फोटो फ़ाइल (JPG, PNG, या WebP) चुनें।');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setUploadError('फ़ाइल का आकार 20 MB से कम होना चाहिए।');
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (sourceUrl) {
          URL.revokeObjectURL(sourceUrl);
        }
        setSourceUrl(objectUrl);
        setLoadedImage(img);
        setFileName(file.name);
        setCrop(DEFAULT_CROP);
        setActiveSheetIdx(0);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setUploadError('यह फोटो लोड नहीं हो सकी। कृपया कोई अन्य JPG या PNG फोटो चुनें।');
      };
      img.src = objectUrl;
    },
    [sourceUrl]
  );

  const handleClearPhoto = () => {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }
    setSourceUrl(null);
    setLoadedImage(null);
    setCutoutCanvas(null);
    setFileName('');
    setCrop(DEFAULT_CROP);
    setUploadError(null);
    setStatusNotice(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Pointer drag handlers for smooth cropping & positioning on both mobile touch & desktop mouse
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loadedImage) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origOffsetX: crop.offsetX,
      origOffsetY: crop.offsetY
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current.active || !cropCanvasRef.current) return;
    const rect = cropCanvasRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dxNorm = ((e.clientX - dragStateRef.current.startX) / rect.width) * 2;
    const dyNorm = ((e.clientY - dragStateRef.current.startY) / rect.height) * 2;

    setCrop((prev) => ({
      ...prev,
      offsetX: Math.max(-1.5, Math.min(1.5, dragStateRef.current.origOffsetX + dxNorm)),
      offsetY: Math.max(-1.5, Math.min(1.5, dragStateRef.current.origOffsetY + dyNorm))
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragStateRef.current.active) {
      dragStateRef.current.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!loadedImage) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setCrop((prev) => ({
      ...prev,
      zoom: Math.max(0.6, Math.min(3.0, Number((prev.zoom + delta).toFixed(2))))
    }));
  };

  const nudgePosition = (dx: number, dy: number) => {
    setCrop((prev) => ({
      ...prev,
      offsetX: Math.max(-1.5, Math.min(1.5, Number((prev.offsetX + dx).toFixed(3)))),
      offsetY: Math.max(-1.5, Math.min(1.5, Number((prev.offsetY + dy).toFixed(3))))
    }));
  };

  // Download Print-Ready 300 DPI JPG (current sheet or all sheets)
  const handleDownloadJpg = async (downloadAllSheets = false) => {
    if (!singlePhotoCanvas) return;
    setIsExportingJpg(true);
    setStatusNotice(null);
    try {
      const sheetIndices = downloadAllSheets
        ? sheetLayout.sheets.map((_, idx) => idx)
        : [activeSheetIdx];

      for (const idx of sheetIndices) {
        const sheetCanvas = renderPrintSheetCanvas({
          singlePhotoCanvas,
          layout: sheetLayout,
          sheetIndex: idx,
          showCutBorders
        });
        const blob = await canvasTo300DpiJpegBlob(sheetCanvas);
        const sheetSuffix =
          sheetLayout.totalSheets > 1 ? `-sheet-${idx + 1}` : '';
        triggerBlobDownload(
          blob,
          `mp-sarkari-passport-35x45mm-${paperLayout}-${copies}photos${sheetSuffix}-300dpi.jpg`
        );
      }

      setStatusNotice(
        sheetIndices.length > 1
          ? `${sheetIndices.length} शीट (300 DPI JPG) सफलतापूर्वक डाउनलोड हो गईं।`
          : '300 DPI प्रिंट-रेडी JPG शीट डाउनलोड हो गई।'
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'JPG डाउनलोड करने में त्रुटि हुई।'
      );
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Download Single 35x45mm Photo (300 DPI JPG) for online exam forms
  const handleDownloadSinglePhoto = async () => {
    if (!singlePhotoCanvas) return;
    setIsExportingJpg(true);
    try {
      const blob = await canvasTo300DpiJpegBlob(singlePhotoCanvas);
      triggerBlobDownload(blob, 'mp-sarkari-single-passport-35x45mm-300dpi.jpg');
      setStatusNotice('एकल 35×45 mm (300 DPI) पासपोर्ट फोटो डाउनलोड हो गई।');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'फोटो डाउनलोड करने में त्रुटि हुई।');
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Download Print-Ready Exact Millimeter PDF (300 DPI)
  const handleDownloadPdf = async () => {
    if (!singlePhotoCanvas) return;
    setIsExportingPdf(true);
    setStatusNotice(null);
    try {
      exportPassportPdf({
        singlePhotoCanvas,
        layout: sheetLayout,
        showCutBorders,
        filename: `mp-sarkari-passport-35x45mm-${paperLayout}-${copies}photos-300dpi.pdf`
      });
      setStatusNotice(
        `प्रिंट-रेडी PDF (${sheetLayout.totalSheets} पेज, 35×45 mm @ 300 DPI) डाउनलोड हो गई।`
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'PDF निर्माण में त्रुटि हुई।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Build crisp sheet URLs for the Print Preview modal & native browser print
  const handleOpenPrintPreview = async () => {
    if (!singlePhotoCanvas) return;
    const urls: string[] = [];
    for (let i = 0; i < sheetLayout.totalSheets; i++) {
      const sheetCanvas = renderPrintSheetCanvas({
        singlePhotoCanvas,
        layout: sheetLayout,
        sheetIndex: i,
        showCutBorders
      });
      const blob = await canvasTo300DpiJpegBlob(sheetCanvas);
      urls.push(URL.createObjectURL(blob));
    }
    printPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    setPrintPreviewUrls(urls);
    setIsPrintPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Studio Header Bar */}
      <header className="bg-[#BA0000] text-white border-b-4 border-[#001F3F] px-4 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToTools && (
              <button
                type="button"
                onClick={onBackToTools}
                className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ऑनलाइन टूल्स</span>
              </button>
            )}
            {onBackToPortal && (
              <button
                type="button"
                onClick={onBackToPortal}
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
              >
                <span>होमपेज</span>
              </button>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                पासपोर्ट साइज फोटो मेकर (Passport Photo Maker)
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-200 font-semibold">
                MP SARKARI UPDATE ऑनलाइन टूल्स · 35 × 45 mm @ 300 DPI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/95 bg-[#001F3F]/60 px-3 py-1.5 rounded-lg border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>100% लोकल प्रोसेसिंग — आपकी फोटो सर्वर पर सेव नहीं होती</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Spec Bar (Tabular Numerals) */}
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 tabular-nums">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              <strong className="text-slate-900">फोटो साइज:</strong> {PHOTO_WIDTH_MM} × {PHOTO_HEIGHT_MM} mm ({PHOTO_WIDTH_PX} × {PHOTO_HEIGHT_PX} px)
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900">रेजोल्यूशन:</strong> 300 DPI
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900">लेआउट:</strong> {sheetLayout.paperLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="text-slate-900">कुल फोटो:</strong> {copies} ({sheetLayout.totalSheets} शीट)
            </span>
          </div>

          {loadedImage && (
            <button
              type="button"
              onClick={handleClearPhoto}
              className="inline-flex items-center gap-1.5 text-rose-700 hover:text-rose-900 font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>फोटो हटाएं</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {uploadError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {uploadError}
            </span>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-700 hover:text-rose-900 p-1 cursor-pointer"
              aria-label="त्रुटि बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {statusNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {statusNotice}
            </span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
              aria-label="सूचना बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden Shared File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileLoad(e.target.files?.[0])}
          className="hidden"
        />

        {!loadedImage ? (
          /* EMPTY / UPLOAD STATE */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              handleFileLoad(e.dataTransfer.files?.[0]);
            }}
            className={`bg-white border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center transition-colors ${
              isDraggingFile
                ? 'border-[#BA0000] bg-red-50/40'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-[#BA0000] border border-red-200 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-2">
              अपनी पासपोर्ट फोटो अपलोड करें
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed mb-6">
              सीधे मोबाइल कैमरा या गैलरी से फोटो चुनें। ऑटोमैटिक बैकग्राउंड रिमूवल, सफेद/नीला/लाल बैकग्राउंड, क्रॉपिंग और 300 DPI प्रिंट-रेडी PDF व JPG (4×6 या A4) तुरंत तैयार करें।
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-sm transition cursor-pointer min-h-[44px]"
              >
                <Upload className="w-4 h-4" />
                <span>फोटो चुनें (Select Photo)</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-900">1. सटीक 35 × 45 mm साइज</p>
                <p className="mt-0.5">MPESB, MPPSC, SSC व पासपोर्ट फॉर्म के लिए 300 DPI मानक।</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">2. ऑटो बैकग्राउंड बदलाव</p>
                <p className="mt-0.5">सफेद, नीला और लाल बैकग्राउंड विकल्प एक क्लिक में।</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">3. पूर्णतः सुरक्षित (Local)</p>
                <p className="mt-0.5">फोटो कहीं अपलोड या स्टोर नहीं होती, केवल आपके डिवाइस में रहती है।</p>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE WORKSPACE: 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (5 cols): Crop/Position + Background + Layout Settings */}
            <div className="lg:col-span-5 space-y-5">
              {/* Step 1: Interactive 35x45mm Crop & Position Stage */}
              <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      1. फोटो क्रॉप और पोजिशन (35 × 45 mm)
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate max-w-[230px]">
                      {fileName || 'चयनित फोटो'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer whitespace-nowrap shrink-0 min-h-[38px]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>बदलें</span>
                  </button>
                </div>

                {/* Interactive Canvas Frame */}
                <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-[240px] aspect-[35/45] rounded-lg overflow-hidden border-2 border-[#001F3F] shadow-sm bg-slate-100">
                    <canvas
                      ref={cropCanvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onWheel={handleWheelZoom}
                      className="w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
                    />
                    {isRemovingBg && (
                      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
                        <span>बैकग्राउंड हटाया जा रहा है...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    फोटो को खिसकाने के लिए ड्रैग (Drag/Touch) करें और नीचे ज़ूम से एडजस्ट करें
                  </p>
                </div>

                {/* Zoom Slider & Directional Nudge Controls */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCrop((p) => ({ ...p, zoom: Math.max(0.6, Number((p.zoom - 0.1).toFixed(2))) }))
                      }
                      className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                      aria-label="ज़ूम आउट"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min={0.6}
                      max={3.0}
                      step={0.02}
                      value={crop.zoom}
                      onChange={(e) =>
                        setCrop((p) => ({ ...p, zoom: parseFloat(e.target.value) }))
                      }
                      className="flex-1 accent-[#BA0000] cursor-pointer h-2"
                      aria-label="फोटो ज़ूम"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCrop((p) => ({ ...p, zoom: Math.min(3.0, Number((p.zoom + 0.1).toFixed(2))) }))
                      }
                      className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                      aria-label="ज़ूम इन"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-700 tabular-nums w-12 text-right">
                      {Math.round(crop.zoom * 100)}%
                    </span>
                  </div>

                  {/* Position Nudges & Toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => nudgePosition(-0.04, 0)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="बाएं खिसकाएं"
                        aria-label="बाएं खिसकाएं"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgePosition(0, -0.04)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="ऊपर खिसकाएं"
                        aria-label="ऊपर खिसकाएं"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgePosition(0, 0.04)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="नीचे खिसकाएं"
                        aria-label="नीचे खिसकाएं"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => nudgePosition(0.04, 0)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                        title="दाएं खिसकाएं"
                        aria-label="दाएं खिसकाएं"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showFaceGuide}
                          onChange={(e) => setShowFaceGuide(e.target.checked)}
                          className="accent-[#001F3F] w-3.5 h-3.5"
                        />
                        <span>फेस गाइड</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setCrop(DEFAULT_CROP)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>रीसेट</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 2: Background Removal & White / Blue / Red Options */}
              <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    2. बैकग्राउंड विकल्प (Background)
                  </h2>

                  <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRemoveBg}
                      onChange={(e) => setAutoRemoveBg(e.target.checked)}
                      className="accent-[#BA0000] w-4 h-4"
                    />
                    <span>ऑटो बैकग्राउंड हटाएं</span>
                  </label>
                </div>

                {/* White / Blue / Red Options */}
                <div className="grid grid-cols-3 gap-2.5">
                  {(['white', 'blue', 'red'] as BackgroundColorOption[]).map((colorKey) => {
                    const item = BACKGROUND_COLORS[colorKey];
                    const isSelected = bgColor === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => {
                          setBgColor(colorKey);
                          if (!autoRemoveBg) setAutoRemoveBg(true);
                        }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer min-h-[44px] whitespace-nowrap ${
                          isSelected
                            ? 'border-[#001F3F] bg-slate-900 text-white shadow-xs'
                            : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-slate-400 shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span>{item.labelHindi}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Edge / Sensitivity Fine-tuning */}
                {autoRemoveBg && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span>बैकग्राउंड सेंसिटिविटी (Edge Tuning)</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {Math.round(bgSensitivity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={0.85}
                      step={0.03}
                      value={bgSensitivity}
                      onChange={(e) => setBgSensitivity(parseFloat(e.target.value))}
                      className="w-full accent-[#001F3F] cursor-pointer h-2"
                      aria-label="बैकग्राउंड सेंसिटिविटी"
                    />
                  </div>
                )}
              </section>

              {/* Step 3: Copy Count (6, 12, 24) & Print Layout (4x6, A4) */}
              <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  3. फोटो कॉपी और प्रिंट पेपर साइज
                </h2>

                {/* Strictly 3 copy options: 6, 12, 24 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    फोटो संख्या चुनें (Copies)
                  </label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {([6, 12, 24] as CopyCount[]).map((countOption) => (
                      <button
                        key={countOption}
                        type="button"
                        onClick={() => setCopies(countOption)}
                        className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer tabular-nums whitespace-nowrap min-h-[44px] ${
                          copies === countOption
                            ? 'bg-[#BA0000] text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                        }`}
                      >
                        {countOption} फोटो
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Layout: 4x6 inch and A4 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    प्रिंट पेपर लेआउट (Print Layout)
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPaperLayout('4x6')}
                      className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap min-h-[44px] ${
                        paperLayout === '4x6'
                          ? 'bg-[#001F3F] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      4×6 इंच (Photo Paper)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperLayout('a4')}
                      className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap min-h-[44px] ${
                        paperLayout === 'a4'
                          ? 'bg-[#001F3F] text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                      }`}
                    >
                      A4 पेपर (210×297 mm)
                    </button>
                  </div>

                  {paperLayout === '4x6' && copies > 6 && (
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                      नोट: सटीक 35×45 mm साइज बनाए रखने के लिए 4×6 इंच की एक शीट पर 6 फोटो आते हैं — इसलिए {copies} फोटो के लिए कुल <strong>{sheetLayout.totalSheets} शीट</strong> तैयार की जाएंगी।
                    </p>
                  )}
                </div>

                {/* Cut Guide Toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCutBorders}
                    onChange={(e) => setShowCutBorders(e.target.checked)}
                    className="accent-[#001F3F] w-4 h-4"
                  />
                  <Scissors className="w-3.5 h-3.5 text-slate-500" />
                  <span>कटिंग बॉर्डर व क्रॉप मार्क्स दिखाएं (सफेद बैकग्राउंड के लिए उपयोगी)</span>
                </label>
              </section>
            </div>

            {/* RIGHT COLUMN (7 cols): Live Print Sheet Preview & Export Buttons */}
            <div className="lg:col-span-7 space-y-5">
              <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900">
                      प्रिंट शीट लाइव प्रीव्यू (Print Sheet Preview)
                    </h2>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {sheetLayout.paperLabel} · {sheetLayout.paperWidthPx} × {sheetLayout.paperHeightPx} px @ 300 DPI
                    </p>
                  </div>

                  {/* Multi-sheet switcher when 4x6 has 2 or 4 sheets */}
                  {sheetLayout.totalSheets > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 tabular-nums">
                      <button
                        type="button"
                        onClick={() => setActiveSheetIdx((p) => Math.max(0, p - 1))}
                        disabled={activeSheetIdx === 0}
                        className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer"
                        aria-label="पिछली शीट"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 whitespace-nowrap">
                        शीट {activeSheetIdx + 1} / {sheetLayout.totalSheets}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSheetIdx((p) =>
                            Math.min(sheetLayout.totalSheets - 1, p + 1)
                          )
                        }
                        disabled={activeSheetIdx >= sheetLayout.totalSheets - 1}
                        className="p-1.5 rounded bg-white border border-slate-200 disabled:opacity-40 text-slate-700 cursor-pointer"
                        aria-label="अगली शीट"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Sheet Preview Surface */}
                <div className="bg-slate-200/70 rounded-xl p-4 sm:p-6 flex items-center justify-center border border-slate-200 min-h-[340px]">
                  <canvas
                    ref={sheetPreviewCanvasRef}
                    className={`bg-white shadow-lg border border-slate-300 h-auto max-h-[480px] w-auto max-w-full ${
                      paperLayout === '4x6' ? 'aspect-[2/3]' : 'aspect-[210/297]'
                    }`}
                  />
                </div>

                {/* Primary Actions: Print Preview, Download JPG, Download PDF */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenPrintPreview}
                    className="flex items-center justify-center gap-2 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer whitespace-nowrap min-h-[44px]"
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>प्रिंट प्रीव्यू (Preview)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadJpg(false)}
                    disabled={isExportingJpg}
                    className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer whitespace-nowrap min-h-[44px]"
                  >
                    {isExportingJpg ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <Download className="w-4 h-4 shrink-0" />
                    )}
                    <span>JPG डाउनलोड (300 DPI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isExportingPdf}
                    className="flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer whitespace-nowrap min-h-[44px]"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0" />
                    )}
                    <span>PDF डाउनलोड (300 DPI)</span>
                  </button>
                </div>

                {/* Extra Helpful Actions: Single 35x45mm Photo Download + Download All JPG Sheets */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadSinglePhoto}
                    disabled={isExportingJpg}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#001F3F] hover:text-[#BA0000] transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>केवल 1 सिंगल फोटो (35×45 mm @ 300 DPI JPG) डाउनलोड करें (ऑनलाइन फॉर्म हेतु)</span>
                  </button>

                  {sheetLayout.totalSheets > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDownloadJpg(true)}
                      disabled={isExportingJpg}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>सभी {sheetLayout.totalSheets} शीट JPG डाउनलोड करें</span>
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Print Preview Modal (with native @media print support) */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-[#001F3F] text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base font-black">
                  प्रिंट प्रीव्यू — {sheetLayout.paperLabel} ({copies} फोटो · 35×45 mm)
                </h3>
                <p className="text-xs text-slate-300 tabular-nums">
                  कुल {sheetLayout.totalSheets} प्रिंट शीट · 300 DPI प्रिंट-रेडी गुणवत्ता
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer"
                aria-label="प्रिंट प्रीव्यू बंद करें"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-6 space-y-6">
              <div className="passport-print-root space-y-6">
                {printPreviewUrls.map((url, idx) => (
                  <div
                    key={url}
                    className="passport-print-sheet bg-white p-2 rounded-lg shadow-md border border-slate-300 max-w-xl mx-auto"
                  >
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5 text-center tabular-nums print:hidden">
                      शीट {idx + 1} / {printPreviewUrls.length} ({sheetLayout.paperLabel})
                    </p>
                    <img
                      src={url}
                      alt={`Passport Print Sheet ${idx + 1}`}
                      className="w-full h-auto block border border-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-slate-600">
                सुझाव: सटीक साइज के लिए प्रिंट सेटिंग में <strong>Scale: 100% (Actual Size)</strong> चुनें।
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer whitespace-nowrap min-h-[40px]"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF डाउनलोड</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer whitespace-nowrap min-h-[40px]"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रिंट करें (Print)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
