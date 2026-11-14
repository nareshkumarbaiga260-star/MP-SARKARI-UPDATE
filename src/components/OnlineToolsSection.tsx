import React from 'react';
import { ArrowRight, ShieldCheck, Wrench } from 'lucide-react';
import {
  ONLINE_TOOLS,
  TOOL_CATEGORIES,
  ToolCategoryId,
  ToolId
} from '../data/onlineTools';
import { renderToolIcon } from './OnlineToolsPage';

interface OnlineToolsSectionProps {
  onOpenOnlineTools: (category?: ToolCategoryId) => void;
  onSelectTool: (toolId: ToolId) => void;
}

export const OnlineToolsSection: React.FC<OnlineToolsSectionProps> = ({
  onOpenOnlineTools,
  onSelectTool
}) => {
  const categoryButtons = TOOL_CATEGORIES.filter((cat) => cat.id !== 'all');

  return (
    <section
      id="online-tools-section"
      className="my-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Navy & Red Portal Header */}
      <div className="bg-[#001F3F] text-white px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#BA0000]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#BA0000] text-white shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
              MP SARKARI UPDATE ऑनलाइन टूल्स (Online Tools)
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300">
              पासपोर्ट फोटो, PDF, आधार प्रिंट, इमेज रिसाइज़र, आयु कैलकुलेटर व सरकारी फॉर्म सेवाएँ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% लोकल व सुरक्षित</span>
          </span>

          <button
            type="button"
            onClick={() => onOpenOnlineTools('all')}
            className="inline-flex items-center gap-1.5 bg-[#BA0000] hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm transition cursor-pointer whitespace-nowrap min-h-[38px]"
          >
            <span>सभी ऑनलाइन टूल्स खोलें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Quick Jump Strip (All 6 Requested Categories) */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-700 mr-1 whitespace-nowrap">
          श्रेणियाँ:
        </span>
        {categoryButtons.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onOpenOnlineTools(cat.id)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#001F3F] hover:text-white border border-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer whitespace-nowrap"
          >
            {cat.labelHindi} ({cat.labelEn})
          </button>
        ))}
      </div>

      {/* Clickable Tool Cards Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ONLINE_TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool(tool.id)}
            className="group text-left bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-[#BA0000] rounded-xl p-4 flex flex-col justify-between gap-3 transition shadow-2xs hover:shadow-md cursor-pointer"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-10 h-10 rounded-lg ${tool.accentBg} text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {renderToolIcon(tool.iconName, 'w-5 h-5')}
                </div>
                <span className="text-[10px] font-bold text-slate-500 text-right leading-tight">
                  {tool.categoryLabelEn}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#BA0000] transition-colors leading-snug">
                  {tool.titleHindi}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 line-clamp-2">
                  {tool.descriptionHindi}
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums truncate">
                {tool.specs}
              </span>
              <span className="inline-flex items-center gap-1 font-black text-[#BA0000] shrink-0 whitespace-nowrap">
                <span>खोलें</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
