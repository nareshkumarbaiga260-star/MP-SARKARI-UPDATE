import React from 'react';
import {
  KeyRound,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Post, PostCategory } from '../types';

interface SarkariSecondaryGridProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory: (cat: PostCategory) => void;
}

export const SarkariSecondaryGrid: React.FC<SarkariSecondaryGridProps> = ({
  posts,
  onSelectPost,
  onSelectCategory
}) => {
  // 1. Answer Key Posts
  const answerKeyPosts = posts.filter((p) => p.category === 'answer-key');

  // 2. Syllabus Posts
  const syllabusPosts = posts.filter((p) => p.category === 'syllabus');

  // 3. Admission & Scholarship Posts
  const admissionPosts = posts.filter(
    (p) => p.category === 'admission' || p.category === 'scholarship'
  );

  return (
    <div className="my-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* COLUMN 1: ANSWER KEY */}
        <div className="bg-white rounded-lg border-2 border-sky-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#0369A1] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-sky-900">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Answer Key (उत्तर कुंजी)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {answerKeyPosts.length} कुंजी
              </span>
            </div>

            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {answerKeyPosts.slice(0, 8).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-sky-50 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-sky-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-sky-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    आपत्ति दर्ज
                  </span>
                </li>
              ))}

              {answerKeyPosts.length === 0 && (
                <li className="p-5 text-center text-slate-500 text-xs">
                  कोई उत्तर कुंजी उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('answer-key')}
              className="text-xs font-bold text-sky-800 hover:text-sky-900 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी उत्तर कुंजी देखें &rarr;</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: SYLLABUS */}
        <div className="bg-white rounded-lg border-2 border-indigo-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#4338CA] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Syllabus (पाठ्यक्रम)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {syllabusPosts.length} पाठ्यक्रम
              </span>
            </div>

            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {syllabusPosts.slice(0, 8).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-indigo-50 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-indigo-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-indigo-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    पैटर्न
                  </span>
                </li>
              ))}

              {syllabusPosts.length === 0 && (
                <li className="p-5 text-center text-slate-500 text-xs">
                  कोई पाठ्यक्रम उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('syllabus')}
              className="text-xs font-bold text-indigo-800 hover:text-indigo-900 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी पाठ्यक्रम देखें &rarr;</span>
            </button>
          </div>
        </div>

        {/* COLUMN 3: ADMISSION & SCHOLARSHIP */}
        <div className="bg-white rounded-lg border-2 border-emerald-800 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-[#047857] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
                  Admission / Scholarship
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded">
                {admissionPosts.length} प्रवेश
              </span>
            </div>

            <ul className="divide-y divide-slate-100 text-xs text-slate-800">
              {admissionPosts.slice(0, 8).map((post) => (
                <li
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="px-3 py-2.5 hover:bg-emerald-50 transition cursor-pointer flex items-start justify-between gap-2 group"
                >
                  <div className="flex items-start gap-1.5 flex-1">
                    <span className="text-emerald-700 font-bold text-sm leading-none mt-0.5">•</span>
                    <div>
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {post.department}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {post.category === 'scholarship' ? 'छात्रवृत्ति' : 'प्रवेश'}
                  </span>
                </li>
              ))}

              {admissionPosts.length === 0 && (
                <li className="p-5 text-center text-slate-500 text-xs">
                  कोई प्रवेश/छात्रवृत्ति सूचना उपलब्ध नहीं है।
                </li>
              )}
            </ul>
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => onSelectCategory('admission')}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center justify-center gap-1 w-full cursor-pointer py-1 hover:underline"
            >
              <span>सभी एडमिशन व छात्रवृत्ति देखें &rarr;</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
