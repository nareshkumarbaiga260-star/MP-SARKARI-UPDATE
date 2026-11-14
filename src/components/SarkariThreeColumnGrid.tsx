import React from 'react';
import {
  Trophy,
  FileText,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Post, PostCategory } from '../types';

interface SarkariThreeColumnGridProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory: (cat: PostCategory) => void;
}

export const SarkariThreeColumnGrid: React.FC<SarkariThreeColumnGridProps> = ({
  posts,
  onSelectPost,
  onSelectCategory
}) => {
  // 1. Results Posts
  const resultsPosts = posts.filter((p) => p.category === 'results');

  // 2. Admit Card Posts
  const admitCardPosts = posts.filter((p) => p.category === 'admit-card');

  // 3. Latest Jobs Posts
  const latestJobsPosts = posts.filter((p) => p.category === 'latest-jobs');

  return (
    <div className="my-6">
      {/* Three Column Container (Iconic Sarkari Result Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* COLUMN 1: RESULTS */}
        <div className="bg-white rounded-lg border-2 border-red-700 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Column Header */}
            <div className="bg-[#BA0000] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-red-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Result (रिजल्ट)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {resultsPosts.length} अपडेट
              </span>
            </div>

            {/* Posts List */}
            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {resultsPosts.slice(0, 10).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-red-50/70 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-red-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-red-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {post.lastDate || 'घोषित'}
                  </span>
                </li>
              ))}

              {resultsPosts.length === 0 && (
                <li className="p-6 text-center text-slate-500 text-xs">
                  कोई परिणाम उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          {/* Column Footer: View More */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('results')}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी रिजल्ट देखें (View More Results)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 2: ADMIT CARD */}
        <div className="bg-white rounded-lg border-2 border-blue-900 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Column Header */}
            <div className="bg-[#001F3F] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-blue-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Admit Card (प्रवेश पत्र)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {admitCardPosts.length} अपडेट
              </span>
            </div>

            {/* Posts List */}
            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {admitCardPosts.slice(0, 10).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-blue-50/70 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-blue-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {post.examDate || 'डाउनलोड'}
                  </span>
                </li>
              ))}

              {admitCardPosts.length === 0 && (
                <li className="p-6 text-center text-slate-500 text-xs">
                  कोई एडमिट कार्ड उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          {/* Column Footer: View More */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('admit-card')}
              className="text-xs font-bold text-blue-900 hover:text-blue-800 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी एडमिट कार्ड देखें (View More Admit Card)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* COLUMN 3: LATEST JOBS */}
        <div className="bg-white rounded-lg border-2 border-red-700 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            {/* Column Header */}
            <div className="bg-[#BA0000] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-red-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Latest Jobs (लेटेस्ट जॉब्स)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {latestJobsPosts.length} नौकरियाँ
              </span>
            </div>

            {/* Posts List */}
            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {latestJobsPosts.slice(0, 10).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-red-50/70 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-red-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-red-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.totalVacancies || post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    अंतिम: {post.lastDate || 'जल्द देखें'}
                  </span>
                </li>
              ))}

              {latestJobsPosts.length === 0 && (
                <li className="p-6 text-center text-slate-500 text-xs">
                  कोई भर्ती उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          {/* Column Footer: View More */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('latest-jobs')}
              className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी लेटेस्ट नौकरियाँ देखें (View More Jobs)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
