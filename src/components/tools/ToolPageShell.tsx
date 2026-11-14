import React from 'react';
import { ArrowLeft, Home, ShieldCheck } from 'lucide-react';

interface ToolPageShellProps {
  titleHindi: string;
  subtitleHindi: string;
  onBackToTools: () => void;
  onBackToPortal: () => void;
  children: React.ReactNode;
}

export const ToolPageShell: React.FC<ToolPageShellProps> = ({
  titleHindi,
  subtitleHindi,
  onBackToTools,
  onBackToPortal,
  children
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Shared Tool Header */}
      <header className="bg-[#BA0000] text-white border-b-4 border-[#001F3F] px-4 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToTools}
              className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ऑनलाइन टूल्स</span>
            </button>

            <button
              type="button"
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Home className="w-3.5 h-3.5" />
              <span>होमपेज</span>
            </button>

            <div className="pl-1">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-white">
                {titleHindi}
              </h1>
              <p className="text-[11px] sm:text-xs text-amber-200 font-semibold">
                {subtitleHindi}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/95 bg-[#001F3F]/60 px-3 py-1.5 rounded-lg border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>100% लोकल प्रोसेसिंग — कोई फाइल सर्वर पर सेव नहीं होती</span>
          </div>
        </div>
      </header>

      {/* Main Tool Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#001F3F] text-slate-300 text-center py-3 px-4 text-xs mt-8">
        © 2026 <strong className="text-white">MP SARKARI UPDATE</strong> — ऑनलाइन टूल्स पोर्टल
      </footer>
    </div>
  );
};
