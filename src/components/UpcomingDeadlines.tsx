import React from 'react';
import { Calendar, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Post } from '../types';

interface UpcomingDeadlinesProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export const UpcomingDeadlines: React.FC<UpcomingDeadlinesProps> = ({
  posts,
  onSelectPost
}) => {
  // Filter posts that have a valid lastDate or isUrgent
  const deadlinePosts = posts
    .filter((p) => p.lastDate && p.lastDate !== 'लागू नहीं')
    .slice(0, 5);

  if (deadlinePosts.length === 0) return null;

  return (
    <div className="bg-red-50/40 rounded-xl border border-red-200 p-4 mb-6 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-red-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-[#BA0000] text-white rounded-lg shadow-xs">
            <AlertCircle className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
              अंतिम तिथि न चूकें (Upcoming Deadlines)
            </h3>
            <p className="text-[11px] text-slate-600">
              शीघ्र समाप्त होने वाली ऑनलाइन आवेदन तिथियाँ
            </p>
          </div>
        </div>
        <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full border border-red-200">
          ताज़ा अलर्ट
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {deadlinePosts.map((post) => (
          <div
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="bg-white rounded-lg p-3 border border-slate-200 hover:border-red-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span className="truncate max-w-[160px] font-medium text-slate-700">
                  {post.department}
                </span>
                <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0">
                  अंतिम तिथि: {post.lastDate}
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-amber-700 transition line-clamp-2 leading-tight">
                {post.title}
              </h4>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium">
                {post.totalVacancies || 'अधिसूचना देखें'}
              </span>
              <span className="text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px]">
                विवरण देखें <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
