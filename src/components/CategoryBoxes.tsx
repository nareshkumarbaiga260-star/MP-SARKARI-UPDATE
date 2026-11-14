import React from 'react';
import {
  Briefcase,
  Flag,
  Landmark,
  FileText,
  Trophy,
  KeyRound,
  Award,
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
  // 8 Vibrant Category Boxes inspired by Sarkari Result
  const boxes = [
    {
      id: 'latest-jobs' as PostCategory,
      title: 'MP Government Jobs',
      hindiTitle: 'मध्य प्रदेश सरकारी नौकरी',
      icon: Briefcase,
      color: 'bg-[#B91C1C] hover:bg-[#991B1B] border-red-700',
      badge: 'MPESB/MPPSC'
    },
    {
      id: 'central-schemes' as PostCategory,
      title: 'Central Govt Jobs',
      hindiTitle: 'केंद्र सरकार नौकरियाँ',
      icon: Flag,
      color: 'bg-[#1D4ED8] hover:bg-[#1E40AF] border-blue-700',
      badge: 'SSC/Railway'
    },
    {
      id: 'mp-schemes' as PostCategory,
      title: 'MP Sarkari Yojana',
      hindiTitle: 'MP सरकारी योजना',
      icon: Landmark,
      color: 'bg-[#EA580C] hover:bg-[#C2410C] border-orange-700',
      badge: 'लाड़ली बहना/संबल'
    },
    {
      id: 'admit-card' as PostCategory,
      title: 'Admit Card',
      hindiTitle: 'प्रवेश पत्र (Admit Card)',
      icon: FileText,
      color: 'bg-[#7C3AED] hover:bg-[#6D28D9] border-purple-700',
      badge: 'डाउनलोड'
    },
    {
      id: 'results' as PostCategory,
      title: 'Results',
      hindiTitle: 'परीक्षा परिणाम (Results)',
      icon: Trophy,
      color: 'bg-[#059669] hover:bg-[#047857] border-emerald-700',
      badge: 'घोषित रिजल्ट'
    },
    {
      id: 'answer-key' as PostCategory,
      title: 'Answer Key',
      hindiTitle: 'उत्तर कुंजी (Answer Key)',
      icon: KeyRound,
      color: 'bg-[#0284C7] hover:bg-[#0369A1] border-sky-700',
      badge: 'मॉडल कुंजी'
    },
    {
      id: 'scholarship' as PostCategory,
      title: 'Scholarship',
      hindiTitle: 'छात्रवृत्ति (Scholarship)',
      icon: Award,
      color: 'bg-[#C026D3] hover:bg-[#A21CAF] border-fuchsia-700',
      badge: 'मेधावी/पोस्ट मैट्रिक'
    },
    {
      id: 'application-guide' as PostCategory,
      title: 'Online Forms',
      hindiTitle: 'ऑनलाइन फॉर्म एवं गाइड',
      icon: HelpCircle,
      color: 'bg-[#0F766E] hover:bg-[#115E59] border-teal-700',
      badge: 'फॉर्म व दिशा-निर्देश'
    }
  ];

  return (
    <div className="my-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {boxes.map((box) => {
          const IconComponent = box.icon;
          const count = postCounts[box.id] || 0;
          return (
            <button
              key={box.id}
              onClick={() => onSelectCategory(box.id)}
              className={`group relative rounded-lg p-2.5 sm:p-3 text-white text-center transition-all duration-150 transform hover:-translate-y-0.5 hover:shadow-md ${box.color} border shadow-xs cursor-pointer flex flex-col items-center justify-between min-h-[92px]`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="p-1 rounded bg-white/20 group-hover:scale-110 transition-transform">
                  <IconComponent className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-[10px] font-black bg-white/25 px-1.5 py-0.2 rounded text-white tracking-wide">
                  {count > 0 ? `${count}+` : 'NEW'}
                </span>
              </div>

              <div className="w-full text-center">
                <h3 className="font-extrabold text-[12px] sm:text-[13px] leading-tight text-white line-clamp-1">
                  {box.title}
                </h3>
                <p className="text-[11px] text-white/90 font-medium truncate mt-0.5">
                  {box.hindiTitle}
                </p>
              </div>

              <span className="text-[9px] text-amber-200 font-bold block mt-1 tracking-tight truncate w-full">
                {box.badge} &rarr;
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
