import React, { useState } from 'react';
import {
  BellRing,
  Search,
  Shield,
  Menu,
  X,
  Share2,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { PostCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';

interface HeaderProps {
  currentCategory: PostCategory;
  onSelectCategory: (cat: PostCategory) => void;
  onOpenAdmin: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onOpenAdmin,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-md border-b border-slate-200">
      {/* Top Tiranga Gradient Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Breaking / Top Alert Strip */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide animate-pulse">
              <BellRing className="w-3 h-3" /> ताज़ा अपडेट
            </span>
            <div className="text-slate-300 truncate text-xs sm:text-[13px]">
              MP पुलिस आरक्षक भर्ती 2026 आवेदन प्रारंभ | लाड़ली बहना योजना ₹1500 किस्त जारी | MPPSC राज्य सेवा परीक्षा सूचना
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0 text-slate-300">
            <span className="hidden sm:inline text-xs text-slate-400">
              दिनांक: {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded font-medium text-xs transition"
              title="व्हाट्सएप पर सरकारी जॉब अलर्ट प्राप्त करें"
            >
              <Share2 className="w-3 h-3" /> WhatsApp अलर्ट
            </a>
          </div>
        </div>
      </div>

      {/* Main Branding Section */}
      <div className="bg-[#0B192C] text-white py-3.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Portal Identity */}
          <div 
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            {/* Emblem / Badge */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center shadow-lg border-2 border-amber-300/40 p-1 shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full border border-amber-100/50 rounded flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold tracking-tighter leading-none text-slate-900 bg-amber-200 px-1 rounded-xs">MP</span>
                <span className="text-[9px] font-black tracking-tight text-white leading-tight mt-0.5">GOVT</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white font-sans flex items-center gap-1.5">
                  <span className="text-amber-400">MP</span> SARKARI <span className="text-orange-500">UPDATE</span>
                </h1>
                <span className="hidden md:inline-block bg-amber-400/20 text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  मध्य प्रदेश पोर्टल
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-[13px] font-medium leading-tight">
                मध्य प्रदेश एवं केंद्र सरकार की सभी नौकरियों व योजनाओं का विश्वसनीय सूचना मंच
              </p>
            </div>
          </div>

          {/* Action Buttons: Search & Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg border border-slate-700 text-sm font-medium transition cursor-pointer"
              title="सूचनाएँ खोजें"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline text-xs">सर्च करें...</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer border ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400'
              }`}
            >
              {isAdmin ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>एडमिन डैशबोर्ड</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>एडमिन लॉगिन</span>
                </>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition"
              aria-label="मेनू खोलें"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar (Desktop) */}
      <nav className="hidden lg:block bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex items-center overflow-x-auto scrollbar-none py-1">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`shrink-0 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap mx-0.5 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.nameHindi}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
            श्रेणी चयन (Categories)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = currentCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {cat.nameHindi}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
