import React from 'react';
import { Landmark, CheckCircle, ExternalLink, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Post } from '../types';

interface SchemeHighlightsProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onFilterSchemes: () => void;
}

export const SchemeHighlights: React.FC<SchemeHighlightsProps> = ({
  posts,
  onSelectPost,
  onFilterSchemes
}) => {
  // Extract scheme posts
  const schemePosts = posts
    .filter((p) => p.category === 'mp-schemes' || p.category === 'central-schemes')
    .slice(0, 4);

  if (schemePosts.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-[#0B192C] text-white rounded-2xl p-5 sm:p-6 mb-8 shadow-lg border border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-xl shadow-md">
            <HeartHandshake className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
              लोकप्रिय सरकारी योजनाएँ (Popular Govt Schemes)
            </h3>
            <p className="text-xs text-slate-300">
              मध्य प्रदेश एवं केंद्र शासन की प्रमुख जनकल्याणकारी योजनाएं एवं सीधे आवेदन लिंक
            </p>
          </div>
        </div>

        <button
          onClick={onFilterSchemes}
          className="text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
        >
          सभी योजनाएँ देखें <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {schemePosts.map((scheme) => (
          <div
            key={scheme.id}
            onClick={() => onSelectPost(scheme)}
            className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  scheme.category === 'mp-schemes'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}>
                  {scheme.category === 'mp-schemes' ? 'मध्य प्रदेश योजना' : 'केंद्र सरकार'}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> प्रामाणिक
                </span>
              </div>

              <h4 className="font-bold text-sm text-white group-hover:text-amber-400 transition line-clamp-2 leading-snug mb-2">
                {scheme.title}
              </h4>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {scheme.shortDescription}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold text-[11px] truncate max-w-[140px]">
                {scheme.totalVacancies || 'पात्र नागरिक'}
              </span>
              <span className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded text-xs transition">
                विवरण व फॉर्म
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
