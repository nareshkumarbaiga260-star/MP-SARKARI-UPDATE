import React from 'react';
import {
  X,
  ExternalLink,
  FileText,
  Calendar,
  CreditCard,
  GraduationCap,
  Users,
  ShieldCheck,
  Share2,
  Printer,
  Globe,
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Post } from '../types';
import { CATEGORIES } from '../data/categories';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  if (!post) return null;

  const categoryMeta = CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[1];

  const handleShare = () => {
    const shareText = `*${post.title}*\n\nविभाग: ${post.department}\nकुल पद: ${post.totalVacancies || 'अधिसूचना देखें'}\nयोग्यता: ${post.qualification || 'विवरण देखें'}\nअंतिम तिथि: ${post.lastDate || 'जल्द देखें'}\n\nऑनलाइन आवेदन करें व ऑफिशियल PDF डाउनलोड करें:\n${window.location.origin}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        
        {/* Top Header Strip */}
        <div className="sticky top-0 z-10 bg-[#0B192C] text-white p-4 sm:p-5 flex items-start justify-between gap-4 border-b border-slate-700">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeColor}`}>
                {categoryMeta.nameHindi}
              </span>
              <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> {post.department}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold leading-snug text-white">
              {post.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0 cursor-pointer"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* Quick Notice Bar */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs sm:text-sm text-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                प्रामाणिक सरकारी सूचना (MP SARKARI UPDATE)
              </p>
              <p className="text-slate-600 text-xs">
                आवेदन करने से पहले कृपया विभागीय नियम पुस्तिका (Rulebook PDF) का सावधानीपूर्वक अध्ययन करें।
              </p>
            </div>
          </div>

          {/* 2-Column Info Grid: Important Dates & Application Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Important Dates Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3 border-b border-slate-200 pb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>महत्वपूर्ण तिथियाँ (Important Dates)</span>
              </div>
              <dl className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-600">आवेदन प्रारंभ तिथि:</dt>
                  <dd className="font-bold text-slate-800">{post.startDate || 'शीघ्र उपलब्ध'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-600">आवेदन की अंतिम तिथि:</dt>
                  <dd className="font-bold text-rose-600">{post.lastDate || 'अधिसूचना अनुसार'}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-600">परीक्षा तिथि (Exam Date):</dt>
                  <dd className="font-bold text-slate-800">{post.examDate || 'यथासमय घोषित होगी'}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-slate-600">प्रवेश पत्र (Admit Card):</dt>
                  <dd className="font-bold text-emerald-700">परीक्षा से 7 दिन पूर्व</dd>
                </div>
              </dl>
            </div>

            {/* Application Fee Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3 border-b border-slate-200 pb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>आवेदन शुल्क (Application Fee)</span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm">
                <p className="text-slate-700 leading-relaxed font-medium">
                  {post.applicationFee || 'सामान्य: ₹500/-, SC/ST/OBC: ₹250/- (नियम पुस्तिका अनुसार)'}
                </p>
                <div className="mt-3 bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-500">
                  💡 भुगतान माध्यम: एमपी ऑनलाइन कियोस्क, नेट बैंकिंग, यूपीआई (UPI), डेबिट/क्रेडिट कार्ड के माध्यम से।
                </div>
              </div>
            </div>
          </div>

          {/* Vacancy & Eligibility Summary Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <span>पद विवरण, पात्रता एवं आयु सीमा (Eligibility & Age Limit)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">कुल पद संख्या</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{post.totalVacancies || 'अधिसूचना देखें'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">अनिवार्य शैक्षणिक योग्यता</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">{post.qualification || 'नियम अनुसार'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 text-[11px] block">आयु सीमा (Age Limit)</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 block">{post.ageLimit || '18-40 वर्ष (छूट सहित)'}</span>
              </div>
            </div>
          </div>

          {/* Full Detailed Description / Guide */}
          <div>
            <h4 className="font-bold text-base text-slate-900 mb-2">
              विस्तृत विवरण एवं भर्ती दिशा-निर्देश:
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans">
              {post.fullDescription || post.shortDescription}
            </div>
          </div>

          {/* Important Official Direct Links Section */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 rounded-xl border-2 border-amber-500/30 p-4 sm:p-5">
            <h4 className="font-black text-sm sm:text-base text-slate-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-600" />
              <span>महत्वपूर्ण आधिकारिक लिंक्स (Important Official Links)</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {post.applyOnlineUrl && (
                <a
                  href={post.applyOnlineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm shadow-sm transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>ऑनलाइन आवेदन करें</span>
                </a>
              )}

              {post.notificationPdfUrl && (
                <a
                  href={post.notificationPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-rose-700 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm border-2 border-rose-300 transition"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>नोटिफिकेशन PDF डाउनलोड</span>
                </a>
              )}

              <a
                href={post.officialWebsiteUrl || 'https://esb.mp.gov.in'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#0B192C] hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm transition"
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>आधिकारिक वेबसाइट</span>
              </a>
            </div>
          </div>

          {/* MP Rojgar Portal Advisory */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>मध्य प्रदेश की भर्तियों हेतु MP रोजगार पंजीयन (mprojgar.gov.in) जीवित होना अनिवार्य है।</span>
            </div>
            <a
              href="https://mprojgar.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-blue-700 hover:text-blue-900"
            >
              रोजगार पंजीयन पोर्टल खोलें &rarr;
            </a>
          </div>

        </div>

        {/* Modal Bottom Actions Strip */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>व्हाट्सएप पर शेयर करें</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2 rounded-lg text-xs border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">प्रिंट / सेव करें</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
