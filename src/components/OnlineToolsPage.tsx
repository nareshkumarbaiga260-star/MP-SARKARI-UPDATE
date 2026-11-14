import React, { useState, useMemo, useEffect } from 'react';
import {
  Camera,
  CreditCard,
  Calendar,
  Minimize2,
  PenTool,
  FileImage,
  Files,
  ClipboardCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import {
  TOOL_CATEGORIES,
  ONLINE_TOOLS,
  ToolCategoryId,
  ToolId,
  OnlineToolItem
} from '../data/onlineTools';

interface OnlineToolsPageProps {
  onSelectTool: (toolId: ToolId) => void;
  onBackToHome: () => void;
  initialCategory?: ToolCategoryId;
}

export function renderToolIcon(iconName: OnlineToolItem['iconName'], className = 'w-6 h-6') {
  switch (iconName) {
    case 'camera':
      return <Camera className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
    case 'minimize':
      return <Minimize2 className={className} />;
    case 'pen-tool':
      return <PenTool className={className} />;
    case 'file-image':
      return <FileImage className={className} />;
    case 'files':
      return <Files className={className} />;
    case 'clipboard-check':
      return <ClipboardCheck className={className} />;
  }
}

export const OnlineToolsPage: React.FC<OnlineToolsPageProps> = ({
  onSelectTool,
  onBackToHome,
  initialCategory = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategoryId>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ONLINE_TOOLS.filter((tool) => {
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        tool.titleHindi.toLowerCase().includes(q) ||
        tool.titleEn.toLowerCase().includes(q) ||
        tool.descriptionHindi.toLowerCase().includes(q) ||
        tool.categoryLabelEn.toLowerCase().includes(q) ||
        tool.specs.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* MP SARKARI UPDATE Online Tools Header */}
      <header className="bg-[#BA0000] text-white border-b-4 border-[#001F3F] px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>मुख्य पृष्ठ (Home)</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                MP SARKARI UPDATE — ऑनलाइन टूल्स (Online Tools)
              </h1>
              <p className="text-xs text-amber-200 font-semibold">
                पासपोर्ट फोटो, PDF, आधार प्रिंट, इमेज रिसाइज़र व सरकारी फॉर्म टूल्स
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/95 bg-[#001F3F]/60 px-3 py-1.5 rounded-lg border border-white/15">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>100% ब्राउज़र-आधारित और सुरक्षित</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Search & Category Filters */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="टूल खोजें (जैसे Passport Photo, PDF, Aadhaar, Age, Image KB)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-[#BA0000] focus:outline-none"
              />
            </div>

            <div className="text-xs font-bold text-slate-600 tabular-nums whitespace-nowrap">
              {filteredTools.length} टूल्स उपलब्ध
            </div>
          </div>

          {/* 6 Requested Tool Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {TOOL_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap min-h-[38px] ${
                    isActive
                      ? 'bg-[#001F3F] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.labelHindi} ({cat.labelEn})
                </button>
              );
            })}
          </div>
        </section>

        {/* Tool Cards Grid */}
        {filteredTools.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              आपकी खोज के अनुसार कोई टूल नहीं मिला
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1.5 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>सभी टूल्स दिखाएं</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                className="group text-left bg-white border border-slate-200 hover:border-[#BA0000] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-2xs hover:shadow-md transition cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${tool.accentBg} text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      {renderToolIcon(tool.iconName, 'w-6 h-6')}
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 text-right">
                      {tool.categoryLabelEn}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-black text-slate-900 group-hover:text-[#BA0000] transition-colors">
                      {tool.titleHindi}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                      {tool.descriptionHindi}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-500 tabular-nums">
                    {tool.specs}
                  </span>
                  <span className="inline-flex items-center gap-1 font-black text-[#BA0000]">
                    <span>टूल खोलें</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#001F3F] text-slate-300 text-center py-3.5 px-4 text-xs mt-8">
        © 2026 <strong className="text-white">MP SARKARI UPDATE</strong> — ऑनलाइन टूल्स एवं सरकारी सूचना पोर्टल
      </footer>
    </div>
  );
};
