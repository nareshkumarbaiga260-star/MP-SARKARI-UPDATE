import React, { useState } from 'react';
import {
  Landmark,
  Flag,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Post, PostCategory } from '../types';

interface SchemeHighlightsProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onFilterSchemes: (cat: PostCategory) => void;
}

export const SchemeHighlights: React.FC<SchemeHighlightsProps> = ({
  posts,
  onSelectPost,
  onFilterSchemes
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mp' | 'central'>('all');

  const mpSchemes = posts.filter((p) => p.category === 'mp-schemes');
  const centralSchemes = posts.filter((p) => p.category === 'central-schemes');

  const displayedSchemes =
    activeTab === 'mp'
      ? mpSchemes
      : activeTab === 'central'
      ? centralSchemes
      : [...mpSchemes, ...centralSchemes].slice(0, 6);

  if (mpSchemes.length === 0 && centralSchemes.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm p-4 sm:p-5 my-6">
      
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-red-700">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#BA0000] text-white rounded-lg shadow-xs">
            <HeartHandshake className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              सरकारी योजनाएँ (Government Welfare Schemes)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              मध्य प्रदेश एवं केंद्र सरकार की प्रमुख जनकल्याणकारी योजनाएं एवं ऑनलाइन आवेदन
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#001F3F] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            सभी योजनाएँ ({mpSchemes.length + centralSchemes.length})
          </button>
          <button
            onClick={() => setActiveTab('mp')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              activeTab === 'mp'
                ? 'bg-[#BA0000] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MP योजनाएँ ({mpSchemes.length})
          </button>
          <button
            onClick={() => setActiveTab('central')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              activeTab === 'central'
                ? 'bg-[#1D4ED8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            केंद्र योजनाएँ ({centralSchemes.length})
          </button>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedSchemes.map((scheme) => (
          <div
            key={scheme.id}
            onClick={() => onSelectPost(scheme)}
            className="bg-slate-50 hover:bg-red-50/40 border border-slate-200 hover:border-red-400 rounded-lg p-3.5 transition-all duration-150 cursor-pointer flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${
                    scheme.category === 'mp-schemes'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}
                >
                  {scheme.category === 'mp-schemes' ? 'मध्य प्रदेश शासन' : 'भारत सरकार'}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> अधिकृत पोर्टल
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 group-hover:text-red-700 transition leading-snug line-clamp-2 mb-1.5">
                {scheme.title}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {scheme.shortDescription}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-amber-800 font-extrabold text-[11px] truncate max-w-[150px]">
                {scheme.totalVacancies || 'पात्र लाभार्थी'}
              </span>
              <span className="bg-[#BA0000] hover:bg-red-800 text-white font-bold px-2.5 py-1 rounded text-[11px] transition shadow-2xs">
                पात्रता व फॉर्म &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
