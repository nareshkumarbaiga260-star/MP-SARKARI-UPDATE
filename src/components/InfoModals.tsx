import React, { useState } from 'react';
import { X, ShieldCheck, Mail, MapPin, Phone, Send, CheckCircle2 } from 'lucide-react';

export type InfoModalType = 'about' | 'contact' | 'privacy' | 'disclaimer' | 'terms' | null;

interface InfoModalsProps {
  type: InfoModalType;
  onClose: () => void;
}

export const InfoModals: React.FC<InfoModalsProps> = ({ type, onClose }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', query: '' });

  if (!type) return null;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-[#0B192C] text-white p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-700 sticky top-0 z-10">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            {type === 'about' && 'हमारे बारे में (About MP SARKARI UPDATE)'}
            {type === 'contact' && 'संपर्क करें (Contact Us & Support)'}
            {type === 'privacy' && 'गोपनीयता नीति (Privacy Policy)'}
            {type === 'disclaimer' && 'अस्वीकरण (Disclaimer)'}
            {type === 'terms' && 'नियम व शर्तें (Terms & Conditions)'}
          </h3>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
          
          {/* 1. ABOUT US */}
          {type === 'about' && (
            <div className="space-y-4">
              <p className="font-medium text-slate-900 text-sm sm:text-base">
                <strong>MP SARKARI UPDATE</strong> मध्य प्रदेश एवं केंद्र सरकार की समस्त प्रतियोगी परीक्षाओं, सरकारी नौकरियों, योजनाओं, एडमिट कार्ड और परीक्षा परिणामों का एक समर्पित एवं निःशुल्क सूचना पोर्टल है।
              </p>
              
              <h4 className="font-bold text-slate-900 text-sm">हमारा मुख्य उद्देश्य:</h4>
              <p>
                मध्य प्रदेश के ग्रामीण एवं दूरदराज के अंचलों के युवाओं, छात्र-छात्राओं और नागरिकों तक सरकारी भर्तियों, योजनाओं एवं शासकीय आदेशों की प्रामाणिक व सटीक जानकारी सरल हिंदी भाषा में त्वरित गति से पहुँचाना।
              </p>

              <h4 className="font-bold text-slate-900 text-sm">पोर्टल की प्रमुख विशेषताएँ:</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>मध्य प्रदेश कर्मचारी चयन मंडल (MPESB / व्यापमं) की सभी परीक्षाओं की विस्तृत सूचना।</li>
                <li>MPPSC (मध्य प्रदेश लोक सेवा आयोग) की राज्य सेवा व वन सेवा परीक्षाओं का संपूर्ण कवरेज।</li>
                <li>लाड़ली बहना, संबल 2.0, सीखो कमाओ, किसान कल्याण जैसी जनकल्याणकारी योजनाओं की चरणबद्ध गाइड।</li>
                <li>केवल सत्यापित एवं आधिकारिक शासकीय वेबसाइट्स के सीधे आवेदन लिंक।</li>
                <li>फास्ट, मोबाइल-फ्रेंडली एवं विज्ञापन-मुक्त सहज अनुभव।</li>
              </ul>
            </div>
          )}

          {/* 2. CONTACT US */}
          {type === 'contact' && (
            <div className="space-y-5">
              <p>
                यदि आपके पास किसी भर्ती, योजना या पोर्टल से संबंधित कोई प्रश्न, सुझाव या शिकायत है, तो आप हमारी सहायता टीम से संपर्क कर सकते हैं:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <MapPin className="w-5 h-5 text-amber-600 mb-1" />
                  <span className="font-bold text-slate-900 block text-xs">कार्यालय पता:</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    एमपी नगर जोन-1, प्रेस कॉम्प्लेक्स, भोपाल (म.प्र.) 462011
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <Mail className="w-5 h-5 text-blue-600 mb-1" />
                  <span className="font-bold text-slate-900 block text-xs">ईमेल सहायता:</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    support@mpsarkariupdate.in
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <Phone className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="font-bold text-slate-900 block text-xs">सहायता समय:</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    सोमवार से शनिवार (सुबह 10:00 से शाम 6:00 बजे तक)
                  </p>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>धन्यवाद! आपका संदेश प्राप्त हो गया है। हमारी टीम शीघ्र ही आपसे संपर्क करेगी।</span>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">त्वरित संदेश भेजें (Quick Inquiry Form):</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="आपका नाम (Full Name)"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    />
                    <input
                      type="email"
                      required
                      placeholder="ईमेल पता (Email)"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                    />
                  </div>

                  <textarea
                    required
                    rows={3}
                    placeholder="आपका प्रश्न, सुझाव अथवा भर्ती से जुड़ी पूछताछ..."
                    value={contactForm.query}
                    onChange={(e) => setContactForm({ ...contactForm, query: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs text-slate-800"
                  />

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>संदेश भेजें</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-3">
              <p>
                <strong>MP SARKARI UPDATE</strong> अपने पाठकों एवं उपयोगकर्ताओं की निजता का पूर्ण सम्मान करता है। हम किसी भी उपयोगकर्ता की व्यक्तिगत पहचान संबंधी संवेदनशील जानकारी (जैसे पासवर्ड, बैंक विवरण या आधार नंबर) संग्रहीत नहीं करते हैं।
              </p>
              <h4 className="font-bold text-slate-900 text-sm">कुकीज़ (Cookies) एवं तकनीकी लॉग:</h4>
              <p>
                पोर्टल के प्रदर्शन को बेहतर बनाने और ब्राउज़िंग अनुभव को तेज़ बनाने हेतु सामान्य कुकीज़ का उपयोग किया जा सकता है। उपयोगकर्ता अपने वेब ब्राउज़र की सेटिंग्स में जाकर कुकीज़ को अक्षम कर सकते हैं।
              </p>
              <h4 className="font-bold text-slate-900 text-sm">तृतीय-पक्ष लिंक्स:</h4>
              <p>
                हमारी वेबसाइट में विभिन्न शासकीय विभागों (जैसे esb.mp.gov.in, mppsc.mp.gov.in आदि) की बाह्य लिंक्स शामिल हैं। उन वेबसाइटों की अपनी स्वतंत्र गोपनीयता नीतियां हैं, जिनके लिए वे स्वयं उत्तरदायी हैं।
              </p>
            </div>
          )}

          {/* 4. DISCLAIMER (CRITICAL FOR SARKARI PORTAL) */}
          {type === 'disclaimer' && (
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <div className="font-bold text-rose-800 text-sm">
                महत्वपूर्ण कानूनी अस्वीकरण (Disclaimer):
              </div>
              <p className="font-semibold text-slate-900">
                1. MP SARKARI UPDATE (mpsarkariupdate.in) एक स्वतंत्र सूचनात्मक एवं शैक्षणिक पोर्टल है। यह किसी भी केंद्रीय अथवा राज्य सरकार, मंत्रालय या शासकीय संस्था का आधिकारिक पोर्टल नहीं है।
              </p>
              <p>
                2. इस पोर्टल पर प्रकाशित सभी जानकारियाँ, नियम, तिथियाँ एवं पीडीएफ केवल परीक्षार्थियों एवं आम जनता की त्वरित सूचना व सुविधा हेतु शासकीय विज्ञप्तियों एवं समाचार पत्रों से संकलित की जाती हैं।
              </p>
              <p>
                3. यद्यपि हम जानकारी की शुद्धता एवं प्रामाणिकता का पूरा ध्यान रखते हैं, फिर भी किसी भी पद हेतु ऑनलाइन आवेदन करने अथवा परीक्षा शुल्क जमा करने से पूर्व संबंधित विभाग की मूल आधिकारिक वेबसाइट (जैसे MPESB, MPPSC, SSC आदि) पर जाकर नियम पुस्तिका (Official Rulebook) का मिलान अवश्य करें।
              </p>
              <p>
                4. अनजाने में हुई किसी मुद्रण अथवा तकनीकी त्रुटि के लिए यह पोर्टल किसी भी प्रकार के वित्तीय अथवा कानूनी नुकसान के लिए उत्तरदायी नहीं होगा।
              </p>
            </div>
          )}

          {/* 5. TERMS & CONDITIONS */}
          {type === 'terms' && (
            <div className="space-y-3">
              <p>
                इस वेबसाइट का उपयोग करके आप निम्नलिखित नियमों एवं शर्तों से बाध्य होने की सहमति देते हैं:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>इस पोर्टल पर उपलब्ध सामग्री का उपयोग केवल व्यक्तिगत, गैर-व्यावसायिक एवं सूचनात्मक उद्देश्यों के लिए किया जा सकता है।</li>
                <li>पोर्टल के सुरक्षित संचालन में बाधा डालना, सुरक्षा परीक्षण करना या अनाधिकृत डेटा संकलन करना पूर्णतः वर्जित है।</li>
                <li>प्रशासक को बिना किसी पूर्व सूचना के पोर्टल की सामग्री या नियमों में संशोधन करने का पूर्ण अधिकार है।</li>
                <li>सभी विवाद मध्य प्रदेश क्षेत्राधिकार के न्यायालयों के अधीन होंगे।</li>
              </ul>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
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
