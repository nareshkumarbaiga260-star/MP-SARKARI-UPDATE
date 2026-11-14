import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Files,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  AlertCircle,
  Check
} from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';
import { triggerBlobDownload } from '../../utils/passportExport';

interface PdfMergerToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

interface PdfEntry {
  id: string;
  name: string;
  sizeKb: number;
  pageCount: number;
  bytes: Uint8Array;
}

export const PdfMergerTool: React.FC<PdfMergerToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const [pdfs, setPdfs] = useState<PdfEntry[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const added: PdfEntry[] = [];
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
        added.push({
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          sizeKb: Math.round((file.size / 1024) * 10) / 10,
          pageCount: doc.getPageCount(),
          bytes
        });
      } catch {
        setErrorMsg(`"${file.name}" को पढ़ा नहीं जा सका (संभवतः पासवर्ड से सुरक्षित PDF है)।`);
      }
    }

    if (added.length > 0) {
      setPdfs((prev) => [...prev, ...added]);
    }
  };

  const movePdf = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= pdfs.length) return;
    const copy = [...pdfs];
    const tmp = copy[idx];
    copy[idx] = copy[next];
    copy[next] = tmp;
    setPdfs(copy);
  };

  const handleMergeDownload = async () => {
    if (pdfs.length < 2) {
      setErrorMsg('मर्ज करने के लिए कम से कम 2 PDF फाइलें जोड़ें।');
      return;
    }

    setIsMerging(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const mergedPdf = await PDFDocument.create();
      for (const entry of pdfs) {
        const srcDoc = await PDFDocument.load(entry.bytes);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      }

      const mergedBytes = await mergedPdf.save();
      const safeArrayBuffer = new ArrayBuffer(mergedBytes.byteLength);
      new Uint8Array(safeArrayBuffer).set(mergedBytes);
      const blob = new Blob([safeArrayBuffer], { type: 'application/pdf' });
      triggerBlobDownload(blob, `mp-sarkari-merged-${mergedPdf.getPageCount()}-pages.pdf`);
      setSuccessMsg(
        `${pdfs.length} PDF फाइलें (कुल ${mergedPdf.getPageCount()} पेज) सफलतापूर्वक मर्ज और डाउनलोड हो गईं।`
      );
    } catch {
      setErrorMsg('PDF मर्ज करने में त्रुटि हुई। कृपया फाइलों की जाँच करें।');
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = pdfs.reduce((sum, p) => sum + p.pageCount, 0);

  return (
    <ToolPageShell
      titleHindi="PDF मर्जर (Merge Multiple PDFs)"
      subtitleHindi="अंकसूची, प्रमाण पत्र व अन्य PDF फाइलों को ब्राउज़र में सुरक्षित रूप से एक PDF में जोड़ें"
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
        accept="application/pdf,.pdf"
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
              <Files className="w-5 h-5 text-[#BA0000]" />
              <span>चयनित PDF फाइलें ({pdfs.length} फाइलें · {totalPages} कुल पेज)</span>
            </h2>
            <p className="text-xs text-slate-500">
              फाइलें 100% आपके डिवाइस पर मर्ज होती हैं, किसी सर्वर पर नहीं भेजी जातीं।
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer min-h-[40px]"
          >
            <Upload className="w-4 h-4" />
            <span>PDF फाइल जोड़ें</span>
          </button>
        </div>

        {pdfs.length === 0 ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">
              मर्ज करने के लिए 2 या अधिक PDF फाइलें चुनें
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-5 py-3 rounded-xl text-xs sm:text-sm cursor-pointer min-h-[44px]"
            >
              <Upload className="w-4 h-4" />
              <span>PDF चुनें</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pdfs.map((entry, idx) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {idx + 1}. {entry.name}
                  </p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {entry.pageCount} पेज · {entry.sizeKb} KB
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => movePdf(idx, -1)}
                    disabled={idx === 0}
                    className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                    aria-label="ऊपर"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePdf(idx, 1)}
                    disabled={idx === pdfs.length - 1}
                    className="p-2 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                    aria-label="नीचे"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfs((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    aria-label="हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pdfs.length > 0 && (
          <button
            type="button"
            disabled={isMerging || pdfs.length < 2}
            onClick={handleMergeDownload}
            className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-sm cursor-pointer min-h-[46px]"
          >
            <Download className="w-4 h-4" />
            <span>
              {isMerging
                ? 'PDF मर्ज हो रही है...'
                : `सभी PDF मर्ज करें (${totalPages} पेज)`}
            </span>
          </button>
        )}
      </div>
    </ToolPageShell>
  );
};
