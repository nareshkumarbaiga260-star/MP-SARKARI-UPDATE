import React, { useState } from 'react';
import {
  ClipboardCheck,
  CheckSquare,
  Square,
  RotateCcw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';
import { ToolId } from '../../data/onlineTools';

interface GovtFormToolsPageProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
  onSelectTool: (toolId: ToolId) => void;
}

const CHECKLIST_ITEMS = [
  { id: 'samagra', label: 'समग्र ID एवं ई-KYC पूर्ण (आधार से लिंक)' },
  { id: 'rojgar', label: 'मध्य प्रदेश रोजगार पंजीयन (जीवित एवं नवीनीकृत)' },
  { id: 'esb-profile', label: 'MPESB प्रोफाइल पंजीयन (नवीनतम फोटो व स्व-हस्ताक्षरित घोषणा सहित)' },
  { id: 'photo', label: 'पासपोर्ट साइज फोटो (35×45 mm, सफेद बैकग्राउंड, स्पष्ट चेहरा)' },
  { id: 'signature', label: 'हस्ताक्षर (सफेद कागज़ पर काली/नीली स्याही, 20–50 KB JPG)' },
  { id: 'marksheet', label: '10वीं / 12वीं / स्नातक अंकसूची (PDF/JPG स्कैन कॉपी)' },
  { id: 'domicile', label: 'मध्य प्रदेश मूल निवासी एवं डिजिटल जाति/आय प्रमाण पत्र (यदि लागू हो)' },
  { id: 'aadhaar-mobile', label: 'आधार से लिंक सक्रिय मोबाइल नंबर (OTP सत्यापन हेतु)' }
];

export const GovtFormToolsPage: React.FC<GovtFormToolsPageProps> = ({
  onBackToTools,
  onBackToPortal,
  onSelectTool
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progressPct = Math.round((checkedIds.length / CHECKLIST_ITEMS.length) * 100);

  return (
    <ToolPageShell
      titleHindi="सरकारी फॉर्म दस्तावेज़ चेकलिस्ट एवं प्रोफाइल हेल्पर"
      subtitleHindi="MPESB, MPPSC, लाड़ली बहना व संबल आवेदन से पूर्व आवश्यक दस्तावेज़ और साइज गाइड"
      onBackToTools={onBackToTools}
      onBackToPortal={onBackToPortal}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Checklist */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#BA0000]" />
                <span>आवेदन पूर्व दस्तावेज़ चेकलिस्ट</span>
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                तैयार दस्तावेज़: {checkedIds.length} / {CHECKLIST_ITEMS.length} ({progressPct}%)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCheckedIds([])}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs sm:text-sm font-semibold ${isChecked ? 'line-through opacity-80' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Quick Form Preparation Tool Links & Official Portals */}
        <div className="lg:col-span-5 space-y-5">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">
              फाइल व फोटो तैयार करने वाले उपयोगी टूल्स
            </h2>

            {[
              { id: 'passport-photo-maker' as ToolId, label: 'पासपोर्ट साइज फोटो (35×45 mm @ 300 DPI)' },
              { id: 'image-compressor' as ToolId, label: 'फोटो को 20–50 KB में बदलें' },
              { id: 'signature-cleaner' as ToolId, label: 'हस्ताक्षर (Signature) बैकग्राउंड साफ़ करें' },
              { id: 'image-to-pdf' as ToolId, label: 'मार्कशीट/प्रमाण पत्र से PDF बनाएं' }
            ].map((shortcut) => (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => onSelectTool(shortcut.id)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50/50 hover:border-[#BA0000] text-xs font-bold text-slate-900 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <span>{shortcut.label}</span>
                <ArrowRight className="w-4 h-4 text-[#BA0000] shrink-0" />
              </button>
            ))}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">
              आधिकारिक पंजीयन पोर्टल्स
            </h2>
            <ul className="space-y-2 text-xs">
              {[
                { name: 'MPESB प्रोफाइल पंजीयन', url: 'https://esb.mponline.gov.in' },
                { name: 'MP रोजगार पंजीयन पोर्टल', url: 'https://mprojgar.gov.in' },
                { name: 'समग्र पोर्टल (e-KYC)', url: 'https://samagra.gov.in' },
                { name: 'MPPSC आवेदन पोर्टल', url: 'https://mppsc.mp.gov.in' }
              ].map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-[#001F3F]"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ToolPageShell>
  );
};
