import React from 'react';
import {
  Briefcase,
  FileText,
  Trophy,
  Landmark,
  Flag,
  KeyRound,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { PostCategory } from '../types';

interface CategoryBoxesProps {
  onSelectCategory: (cat: PostCategory) => void;
  postCounts: Record<string, number>;
}

export const CategoryBoxes: React.FC<CategoryBoxesProps> = ({
  onSelectCategory,
  postCounts
}) => {
  const boxes = [
    {
      id: 'latest-jobs' as PostCategory,
      title: 'नवीनतम नौकरियाँ',
      subtitle: 'Latest Jobs',
      icon: Briefcase,
      color: 'from-blue-600 to-indigo-700',
      badge: 'MP & केंद्र'
    },
    {
      id: 'mp-schemes' as PostCategory,
      title: 'MP सरकारी योजनाएँ',
      subtitle: 'MP Schemes',
      icon: Landmark,
      color: 'from-amber-600 to-orange-700',
      badge: 'लाड़ली बहना/संबल'
    },
    {
      id: 'central-schemes' as PostCategory,
      title: 'केंद्र सरकार योजनाएँ',
      subtitle: 'Central Schemes',
      icon: Flag,
      color: 'from-orange-600 to-red-600',
      badge: 'PM किसान/आवास'
    },
    {
      id: 'admit-card' as PostCategory,
      title: 'प्रवेश पत्र (Admit Card)',
      subtitle: 'Hall Ticket',
      icon: FileText,
      color: 'from-purple-600 to-violet-700',
      badge: 'डाउनलोड'
    },
    {
      id: 'results' as PostCategory,
      title: 'परीक्षा परिणाम',
      subtitle: 'Exam Results',
      icon: Trophy,
      color: 'from-emerald-600 to-teal-700',
      badge: 'घोषित परिणाम'
    },
    {
      id: 'answer-key' as PostCategory,
      title: 'उत्तर कुंजी (Answer Key)',
      subtitle: 'Model Keys',
      icon: KeyRound,
      color: 'from-cyan-600 to-blue-700',
      badge: 'आपत्ति दर्ज'
    },
    {
      id: 'syllabus' as PostCategory,
      title: 'परीक्षा पाठ्यक्रम',
      subtitle: 'Syllabus & Pattern',
      icon: BookOpen,
      color: 'from-fuchsia-600 to-pink-700',
      badge: 'पैटर्न व अंक'
    },
    {
      id: 'application-guide' as PostCategory,
      title: 'फॉर्म एवं आवेदन गाइड',
      subtitle: 'How to Apply',
      icon: HelpCircle,
      color: 'from-teal-600 to-emerald-800',
      badge: 'स्टेप-बाय-स्टेप'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 my-5">
      {boxes.map((box) => {
        const IconComponent = box.icon;
        const count = postCounts[box.id] || 0;
        return (
          <button
            key={box.id}
            onClick={() => onSelectCategory(box.id)}
            className={`group relative overflow-hidden rounded-xl p-3 text-white text-left transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br ${box.color} border border-white/10 cursor-pointer`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs group-hover:scale-110 transition-transform">
                <IconComponent className="w-4 h-4 text-white" />
              </span>
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded text-white backdrop-blur-xs">
                {count > 0 ? `${count}+` : box.badge}
              </span>
            </div>
            
            <h3 className="font-bold text-xs sm:text-sm leading-snug tracking-tight text-white line-clamp-1">
              {box.title}
            </h3>
            <p className="text-[11px] text-white/80 font-medium truncate mt-0.5">
              {box.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
};
