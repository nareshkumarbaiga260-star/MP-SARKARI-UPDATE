import React from 'react';
import { Shield, ExternalLink, Heart, ArrowUp, Mail, Share2 } from 'lucide-react';
import { PostCategory } from '../types';
import { CATEGORIES } from '../data/categories';
import { InfoModalType } from './InfoModals';

interface FooterProps {
  onSelectCategory: (cat: PostCategory) => void;
  onOpenModal: (type: InfoModalType) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenModal,
  onOpenAdmin
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0B192C] text-slate-300 text-xs pt-10 pb-6 border-t border-slate-800 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Main 4-column footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
          
          {/* Col 1: About Portal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                MP
              </div>
              <span className="text-base font-black text-white tracking-wide">
                <span className="text-amber-400">MP</span> SARKARI <span className="text-orange-500">UPDATE</span>
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              मध्य प्रदेश एवं भारत सरकार की सभी शासकीय भर्तियों, प्रतियोगी परीक्षाओं, सरकारी योजनाओं, एडमिट कार्ड एवं रिजल्ट की प्रामाणिक सूचना का समर्पित मंच।
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://web.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp ग्रुप जुड़ें</span>
              </a>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-slate-700 pb-1.5 flex items-center justify-between">
              <span>मुख्य श्रेणियाँ</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {CATEGORIES.slice(1, 7).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      onSelectCategory(c.id);
                      scrollToTop();
                    }}
                    className="hover:text-amber-400 transition text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-amber-500">›</span> {c.nameHindi}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Official Portals */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-slate-700 pb-1.5">
              महत्वपूर्ण शासकीय पोर्टल्स (Official)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://esb.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>MPESB (कर्मचारी चयन मंडल, भोपाल)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://mppsc.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>MPPSC (लोक सेवा आयोग, इंदौर)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://mponline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>MPOnline नागरिक सेवा पोर्टल</span>
                </a>
              </li>
              <li>
                <a
                  href="https://mprojgar.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>मध्य प्रदेश रोजगार पोर्टल (Rojgar)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://cmladlibahna.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>लाड़ली बहना आधिकारिक पोर्टल</span>
                </a>
              </li>
              <li>
                <a
                  href="https://sambal.mp.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>संबल 2.0 जनकल्याण पोर्टल</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 border-b border-slate-700 pb-1.5">
              महत्वपूर्ण नीतियां एवं सूचना
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenModal('about')}
                  className="hover:text-amber-400 transition text-left cursor-pointer"
                >
                  हमारे बारे में (About Us)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('contact')}
                  className="hover:text-amber-400 transition text-left cursor-pointer"
                >
                  संपर्क करें (Contact & Grievance)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('privacy')}
                  className="hover:text-amber-400 transition text-left cursor-pointer"
                >
                  गोपनीयता नीति (Privacy Policy)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('disclaimer')}
                  className="hover:text-amber-400 font-semibold text-amber-300 text-left cursor-pointer"
                >
                  अस्वीकरण (Disclaimer)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenModal('terms')}
                  className="hover:text-amber-400 transition text-left cursor-pointer"
                >
                  नियम व शर्तें (Terms & Conditions)
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800">
                <button
                  onClick={onOpenAdmin}
                  className="text-amber-400 hover:text-amber-300 font-bold transition text-left cursor-pointer"
                >
                  🔒 एडमिन लॉगिन पोर्टल
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed mb-6">
          <strong className="text-amber-400">अस्वीकरण (Disclaimer):</strong> MP SARKARI UPDATE एक गैर-सरकारी सूचनात्मक पोर्टल है। इस पोर्टल पर प्रदर्शित समस्त जानकारियाँ, परिणाम, तिथियाँ एवं आधिकारिक लिंक्स केवल परीक्षार्थियों एवं नागरिकों की सुविधा व सहायता हेतु शासकीय स्रोतों से संकलित की जाती हैं। किसी भी आवेदन अथवा भुगतान से पूर्व संबंधित विभाग की आधिकारिक नियम पुस्तिका का मिलान अवश्य करें।
        </div>

        {/* Bottom Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-slate-400 text-xs">
          <p>
            © 2026 <strong className="text-white">MP SARKARI UPDATE</strong>. सर्वाधिकार सुरक्षित।
          </p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <span>शीर्ष पर जाएं</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
