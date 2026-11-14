import React, { useState } from 'react';
import {
  BellRing,
  Search,
  Menu,
  X,
  Share2,
  Lock,
  UserCheck,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PostCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentCategory: PostCategory;
  onSelectCategory: (cat: PostCategory) => void;
  onOpenAdmin: () => void;
  onOpenSearch: () => void;
  onOpenOnlineTools?: () => void;
  isOnlineToolsActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  onOpenAdmin,
  onOpenSearch,
  onOpenOnlineTools,
  isOnlineToolsActive = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const { isAdmin } = useAuth();

  // Navigation Items requested by user
  const navItems: { id: PostCategory; label: string; labelEn: string }[] = [
    { id: 'all', label: 'होम', labelEn: 'Home' },
    { id: 'latest-jobs', label: 'लेटेस्ट जॉब्स', labelEn: 'Latest Jobs' },
    { id: 'admit-card', label: 'एडमिट कार्ड', labelEn: 'Admit Card' },
    { id: 'results', label: 'रिजल्ट', labelEn: 'Results' },
    { id: 'admission', label: 'एडमिशन', labelEn: 'Admission' },
    { id: 'syllabus', label: 'सिलेबस', labelEn: 'Syllabus' },
    { id: 'answer-key', label: 'उत्तर कुंजी', labelEn: 'Answer Key' },
    { id: 'mp-schemes', label: 'सरकारी योजना', labelEn: 'Sarkari Yojana' }
  ];

  const moreItems: { id: PostCategory; label: string }[] = [
    { id: 'central-schemes', label: 'केंद्र सरकार योजनाएँ' },
    { id: 'scholarship', label: 'छात्रवृत्ति (Scholarship)' },
    { id: 'application-guide', label: 'ऑनलाइन फॉर्म गाइड' },
    { id: 'govt-updates', label: 'सरकारी आदेश व अपडेट' }
  ];

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* 1. TOP BREAKING ALERT TICKER (Classic Sarkari Portal Ticker) */}
      <div className="bg-[#1e293b] text-slate-200 text-xs py-1.5 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[11px] uppercase tracking-wide shrink-0 animate-pulse">
              <BellRing className="w-3 h-3" /> ताज़ा अपडेट
            </span>
            <div className="text-slate-200 truncate text-xs sm:text-[13px] font-medium">
              🔥 MP पुलिस आरक्षक भर्ती 7500 पद आवेदन शुरू | MPPSC राज्य सेवा परीक्षा 2026 | लाड़ली बहना योजना ₹1500 मासिक किस्त | MP पटवारी नई भर्ती सूचना
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://web.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold px-2.5 py-0.5 rounded text-[11px] transition shadow-xs"
              title="WhatsApp पर सरकारी अलर्ट प्राप्त करें"
            >
              <Share2 className="w-3 h-3" /> WhatsApp
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold px-2.5 py-0.5 rounded text-[11px] transition"
            >
              Telegram
            </a>
          </div>
        </div>
      </div>

      {/* 2. LARGE RED HEADER (Sarkari Result Inspired Red Branding) */}
      <div className="bg-[#BA0000] text-white py-4 sm:py-6 px-4 shadow-inner border-b-2 border-red-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Main Logo & Title */}
          <div
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-3.5 cursor-pointer text-center md:text-left select-none group"
          >
            {/* Emblem / Monogram Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white text-[#BA0000] flex flex-col items-center justify-center p-1 shadow-lg border-2 border-amber-300 shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-[12px] sm:text-[14px] font-black tracking-tighter leading-none bg-red-100 px-1.5 py-0.5 rounded text-[#BA0000]">
                MP
              </span>
              <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
                UPDATE
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-sm font-sans">
                MP SARKARI UPDATE
              </h1>
              <p className="text-amber-200 text-xs sm:text-base font-bold tracking-wide mt-0.5">
                सरकारी नौकरी और सरकारी योजनाओं की जानकारी
              </p>
              <span className="text-[11px] text-red-100 hidden sm:inline-block">
                मध्य प्रदेश एवं केंद्र सरकार की संपूर्ण भर्ती, एडमिट कार्ड, रिजल्ट एवं योजना पोर्टल
              </span>
            </div>
          </div>

          {/* Quick Header Actions: Search & Admin Login */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-3.5 py-2 rounded-lg border border-white/30 text-xs sm:text-sm font-semibold transition cursor-pointer backdrop-blur-xs whitespace-nowrap"
              title="नौकरियाँ व योजनाएँ खोजें"
            >
              <Search className="w-4 h-4 text-amber-300" />
              <span>सर्च करें</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition shadow-md cursor-pointer border whitespace-nowrap ${
                isAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
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

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-red-800 rounded-lg transition"
              aria-label="मेनू खोलें"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. DARK NAVY BLUE NAVIGATION BAR */}
      <nav className="bg-[#001F3F] text-white border-b-2 border-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between">
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center py-1 w-full justify-between gap-2">
            <div className="flex items-center flex-wrap gap-0.5 lg:gap-1">
              {navItems.map((item) => {
                const isActive = !isOnlineToolsActive && currentCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectCategory(item.id)}
                    className={`px-2.5 py-1.5 text-xs lg:text-[13px] font-bold rounded transition-all cursor-pointer whitespace-nowrap flex flex-col items-center ${
                      isActive
                        ? 'bg-[#BA0000] text-white shadow-sm'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-none hidden xl:inline">
                      {item.labelEn}
                    </span>
                  </button>
                );
              })}

              {/* Prominent Dedicated Online Tools Menu Item */}
              {onOpenOnlineTools && (
                <button
                  type="button"
                  onClick={onOpenOnlineTools}
                  className={`px-3 py-1.5 text-xs lg:text-[13px] font-black rounded transition-all cursor-pointer whitespace-nowrap flex flex-col items-center border ${
                    isOnlineToolsActive
                      ? 'bg-[#BA0000] text-white border-amber-300 shadow-sm'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300'
                  }`}
                >
                  <span>ऑनलाइन टूल्स</span>
                  <span
                    className={`text-[10px] font-bold leading-none hidden xl:inline ${
                      isOnlineToolsActive ? 'text-amber-200' : 'text-slate-800'
                    }`}
                  >
                    Online Tools
                  </span>
                </button>
              )}

              {/* 'More / अन्य' Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`px-2.5 py-2 text-xs lg:text-[13px] font-bold rounded transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    moreItems.some((m) => m.id === currentCategory)
                      ? 'bg-[#BA0000] text-white'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>अन्य (More)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {moreDropdownOpen && (
                  <div
                    onMouseLeave={() => setMoreDropdownOpen(false)}
                    className="absolute right-0 mt-1 w-60 bg-[#0B192C] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 animate-fadeIn"
                  >
                    {moreItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(item.id);
                          setMoreDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          currentCategory === item.id
                            ? 'bg-[#BA0000] text-white'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-amber-400'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span>&rarr;</span>
                      </button>
                    ))}
                    {onOpenOnlineTools && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoreDropdownOpen(false);
                          onOpenOnlineTools();
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-amber-300 hover:bg-slate-800 transition flex items-center justify-between border-t border-slate-700 mt-1 pt-2 cursor-pointer"
                      >
                        <span>ऑनलाइन टूल्स (Online Tools)</span>
                        <span>&rarr;</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Live Ticker Indicator Badge on right */}
            <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-amber-300 font-bold px-2 py-1 bg-slate-900/80 rounded border border-slate-700 shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>लाइव अपडेट्स 2026</span>
            </div>
          </div>

          {/* Mobile Bar Quick Info + Direct Online Tools Button */}
          <div className="md:hidden py-2 px-1 flex items-center justify-between gap-2 w-full text-xs text-slate-200">
            <span className="font-bold text-amber-400 truncate">
              {navItems.find((n) => n.id === currentCategory)?.label || 'सभी सूचनाएँ'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {onOpenOnlineTools && (
                <button
                  type="button"
                  onClick={onOpenOnlineTools}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2.5 py-1 rounded text-[11px] whitespace-nowrap cursor-pointer"
                >
                  ऑनलाइन टूल्स (Tools)
                </button>
              )}
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                {new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A1931] border-t border-slate-800 px-4 py-3 space-y-2">
            {onOpenOnlineTools && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOnlineTools();
                }}
                className="w-full text-left px-3 py-2.5 rounded text-xs font-black bg-amber-400 text-slate-950 flex items-center justify-between cursor-pointer"
              >
                <span>ऑनलाइन टूल्स (Online Tools — फोटो, PDF, आधार, आयु)</span>
                <span>&rarr;</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map((item) => {
                const isActive = currentCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#BA0000] text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{item.labelEn}</div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider pt-2 border-t border-slate-800">
              अन्य सेवाएँ (More Sections)
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {moreItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-3 py-1.5 rounded text-xs font-semibold ${
                    currentCategory === item.id
                      ? 'bg-[#BA0000] text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
