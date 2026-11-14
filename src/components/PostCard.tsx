import React from 'react';
import {
  Calendar,
  GraduationCap,
  Users,
  ExternalLink,
  FileText,
  Share2,
  ChevronRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { Post } from '../types';
import { CATEGORIES } from '../data/categories';

interface PostCardProps {
  post: Post;
  onSelect: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onSelect }) => {
  const categoryMeta = CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[1];

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `*${post.title}*\n\nविभाग: ${post.department}\nपद: ${post.totalVacancies || 'अधिसूचना अनुसार'}\nयोग्यता: ${post.qualification || 'विवरण देखें'}\nअंतिम तिथि: ${post.lastDate || 'जल्द देखें'}\n\nपूरी जानकारी व ऑनलाइन आवेदन लिंक:\n${window.location.origin}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.applyOnlineUrl) {
      window.open(post.applyOnlineUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelect(post);
    }
  };

  const handlePdfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.notificationPdfUrl) {
      window.open(post.notificationPdfUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelect(post);
    }
  };

  return (
    <div
      onClick={() => onSelect(post)}
      className="bg-white rounded-xl border border-slate-200 hover:border-red-600/80 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden flex flex-col justify-between group"
    >
      <div className="p-4 sm:p-5">
        {/* Top Badges: Category, Department, Urgent/Featured */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeColor}`}
            >
              {categoryMeta.nameHindi}
            </span>
            {post.isFeatured && (
              <span className="inline-flex items-center gap-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" /> मुख्य भर्ती
              </span>
            )}
            {post.isUrgent && (
              <span className="inline-flex items-center gap-0.5 bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                अंतिम तिथि निकट
              </span>
            )}
          </div>

          <button
            onClick={handleShare}
            className="text-slate-400 hover:text-emerald-600 p-1 rounded-md hover:bg-slate-50 transition"
            title="व्हाट्सएप पर शेयर करें"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Department Name */}
        <p className="text-xs font-semibold text-slate-500 mb-1">
          {post.department}
        </p>

        {/* Post Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-red-700 transition leading-snug line-clamp-2 mb-3">
          {post.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {post.shortDescription}
        </p>

        {/* Key Metrics Grid: Vacancies, Qualification, Last Date */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700">
          {post.totalVacancies && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block leading-none">कुल पद:</span>
                <span className="font-bold text-slate-800 text-[11px]">{post.totalVacancies}</span>
              </div>
            </div>
          )}

          {post.qualification && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block leading-none">योग्यता:</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{post.qualification}</span>
              </div>
            </div>
          )}

          {post.lastDate && (
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block leading-none">अंतिम तिथि:</span>
                <span className="font-bold text-rose-700 text-[11px]">{post.lastDate}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Bottom Strip */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {post.applyOnlineUrl && (
            <button
              onClick={handleApplyClick}
              className="inline-flex items-center gap-1 bg-[#BA0000] hover:bg-[#991B1B] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ऑनलाइन आवेदन</span>
            </button>
          )}

          {post.notificationPdfUrl && (
            <button
              onClick={handlePdfClick}
              className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">नोटिफिकेशन PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}
        </div>

        <span className="text-xs font-semibold text-red-700 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
          पूर्ण विवरण <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
