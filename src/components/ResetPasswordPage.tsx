import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
  Info
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';
import { PasswordStrengthMeter, evaluatePasswordStrength } from './PasswordStrengthMeter';

interface ResetPasswordPageProps {
  oobCode: string | null;
  apiKey?: string | null;
  continueUrl?: string | null;
  mode?: string | null;
  onBackToHome: () => void;
  onGoToAdminLogin: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  oobCode: initialOobCode,
  apiKey,
  continueUrl,
  mode,
  onBackToHome,
  onGoToAdminLogin
}) => {
  const { verifyResetCode, confirmReset, sendPasswordReset } = useAuth();

  const [oobCode, setOobCode] = useState<string>(initialOobCode || '');
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(Boolean(initialOobCode));
  const [isCodeValid, setIsCodeValid] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProviderDisabledError, setIsProviderDisabledError] = useState<boolean>(false);

  // Form Fields
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSendingFreshLink, setIsSendingFreshLink] = useState<boolean>(false);
  const [freshLinkSentMsg, setFreshLinkSentMsg] = useState<string | null>(null);

  // Prevent duplicate verifyPasswordResetCode calls during strict re-renders
  const lastVerifiedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialOobCode) {
      setIsValidatingCode(false);
      setIsCodeValid(false);
      return;
    }

    setOobCode(initialOobCode);

    // Avoid duplicate verification for the exact same code
    if (lastVerifiedCodeRef.current === initialOobCode) {
      return;
    }
    lastVerifiedCodeRef.current = initialOobCode;

    // Validate mode if provided
    if (mode && mode !== 'resetPassword') {
      setIsValidatingCode(false);
      setIsCodeValid(false);
      setValidationError(`अमान्य एक्शन मोड (${mode})। यह पृष्ठ केवल पासवर्ड रीसेट (resetPassword) के लिए है।`);
      return;
    }

    // Validate apiKey if provided in URL against active project config
    if (apiKey && apiKey !== firebaseConfig.apiKey) {
      setIsValidatingCode(false);
      setIsCodeValid(false);
      setValidationError(
        `यह लिंक किसी अन्य Firebase प्रोजेक्ट की API कुंजी का है। वर्तमान प्रोजेक्ट: ${firebaseConfig.projectId}`
      );
      return;
    }

    validateCode(initialOobCode);
  }, [initialOobCode, apiKey, mode]);

  const validateCode = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) {
      setValidationError('रीसेट कोड (oobCode) खाली है। कृपया नया पासवर्ड रीसेट लिंक अनुरोध करें।');
      setIsCodeValid(false);
      setIsValidatingCode(false);
      return;
    }

    setIsValidatingCode(true);
    setValidationError(null);
    setIsProviderDisabledError(false);
    setIsCodeValid(false);
    setIsSuccess(false);

    try {
      // Uses Firebase verifyPasswordResetCode(auth, code) - never consumes or invalidates the code!
      const email = await verifyResetCode(cleanCode);
      setVerifiedEmail(email);
      setIsCodeValid(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'अमान्य अथवा समाप्त (Expired) पासवर्ड रीसेट लिंक।';
      setValidationError(msg);
      if (msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('Email/Password')) {
        setIsProviderDisabledError(true);
      }
      setIsCodeValid(false);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Real-time password strength evaluation
  const passwordStrength = evaluatePasswordStrength(newPassword, verifiedEmail || AUTHORIZED_ADMIN_EMAIL);
  const isPasswordsMatching = newPassword !== '' && newPassword === confirmPassword;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newPassword || !confirmPassword) {
      setSubmitError('कृपया दोनों पासवर्ड फ़ील्ड भरें।');
      return;
    }

    if (!passwordStrength.isAcceptable) {
      setSubmitError(
        passwordStrength.warnings[0] ||
          'कृपया सुरक्षा मानकों के अनुसार कम से कम 8 अक्षर, बड़ा अक्षर (A-Z), छोटा अक्षर (a-z), संख्या (0-9) और विशेष चिह्न वाला मजबूत पासवर्ड चुनें।'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('दोनों पासवर्ड एक जैसे नहीं हैं। कृपया पुनः जाँच करें।');
      return;
    }

    setIsSubmitting(true);
    try {
      // confirmPasswordReset() is ONLY called here upon explicit user submission
      await confirmReset(oobCode, newPassword);
      setIsSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      // Remove oobCode and query params from URL immediately after consumption
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, '/reset-password');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'पासवर्ड बदलने में त्रुटि हुई।';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestFreshLink = async () => {
    setIsSendingFreshLink(true);
    setFreshLinkSentMsg(null);
    setSubmitError(null);
    try {
      await sendPasswordReset();
      setFreshLinkSentMsg(
        `एक नया और ताज़ा पासवर्ड रीसेट ईमेल सफलतापूर्वक ${AUTHORIZED_ADMIN_EMAIL} पर भेज दिया गया है। कृपया अपना Gmail इनबॉक्स देखें और केवल नवीनतम ईमेल का लिंक ही खोलें।`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'नया लिंक भेजने में त्रुटि हुई।';
      setValidationError(msg);
      if (msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('Email/Password')) {
        setIsProviderDisabledError(true);
      }
    } finally {
      setIsSendingFreshLink(false);
    }
  };

  const handleReturnToAdminLogin = () => {
    // Clean URL before navigating back to main site / Admin Login
    if (window.history.replaceState) {
      let targetUrl = '/';
      if (continueUrl && continueUrl.startsWith(window.location.origin) && !continueUrl.includes('oobCode=')) {
        try {
          const parsed = new URL(continueUrl);
          if (!parsed.pathname.startsWith('/reset-password') && !parsed.pathname.startsWith('/__/auth/action')) {
            targetUrl = `${parsed.pathname}${parsed.search}` || '/';
          }
        } catch {
          targetUrl = '/';
        }
      }
      window.history.replaceState({}, document.title, targetUrl);
    }
    onGoToAdminLogin();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top MP SARKARI UPDATE Red Header */}
      <header className="bg-[#BA0000] text-white py-4 px-4 shadow-md border-b-4 border-[#001F3F]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div
            onClick={onBackToHome}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-lg bg-white text-[#BA0000] flex flex-col items-center justify-center font-black shadow border border-amber-300">
              <span className="text-xs leading-none">MP</span>
              <span className="text-[8px] text-slate-900 leading-none mt-0.5">GOVT</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase">
                MP SARKARI UPDATE
              </h1>
              <p className="text-xs text-amber-200 font-semibold">
                सरकारी नौकरी और सरकारी योजनाओं की जानकारी
              </p>
            </div>
          </div>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 bg-[#001F3F] hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>मुख्य पृष्ठ (Home)</span>
          </button>
        </div>
      </header>

      {/* Main Centered Password Reset Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
          
          {/* Card Header */}
          <div className="bg-[#001F3F] text-white p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                एडमिन पासवर्ड रीसेट (Admin Password Reset)
              </h2>
              <p className="text-xs text-slate-300">
                केवल अधिकृत व्यवस्थापक हेतु सुरक्षित सत्यापन
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Authorized Owner Info Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  अधिकृत व्यवस्थापक ईमेल (Authorized Admin)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                  {AUTHORIZED_ADMIN_EMAIL}
                </span>
              </div>
            </div>

            {/* STATE 1: SUCCESS */}
            {isSuccess ? (
              <div className="text-center py-3 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    पासवर्ड सफलतापूर्वक बदल दिया गया!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    आपका नया पासवर्ड Firebase Authentication में सुरक्षित रूप से अपडेट हो चुका है। अब आप नए पासवर्ड के साथ एडमिन पैनल में लॉगिन कर सकते हैं।
                  </p>
                </div>

                <button
                  onClick={handleReturnToAdminLogin}
                  className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 text-white font-bold px-4 py-3 rounded-xl text-sm shadow transition cursor-pointer"
                >
                  <span>एडमिन लॉगिन पर जाएं (Go to Admin Login)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : isValidatingCode ? (
              /* STATE 2: VALIDATING CODE */
              <div className="py-10 text-center space-y-3">
                <Loader2 className="w-9 h-9 text-[#BA0000] animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  रीसेट लिंक का सत्यापन किया जा रहा है...
                </p>
                <p className="text-xs text-slate-500">
                  verifyPasswordResetCode() द्वारा लिंक की वैधता जाँची जा रही है
                </p>
              </div>
            ) : isCodeValid ? (
              /* STATE 3: VALID CODE - SHOW RESET FORM */
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    लिंक सत्यापित! खाता: <strong className="font-mono">{verifiedEmail}</strong>
                  </span>
                </div>

                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* नया पासवर्ड */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    नया पासवर्ड *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="नया मजबूत पासवर्ड दर्ज करें (कम से कम 8 अक्षर)..."
                      className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#BA0000] focus:border-[#BA0000] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label={showNewPassword ? 'पासवर्ड छिपाएं' : 'पासवर्ड देखें'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* पासवर्ड दोबारा डालें */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    पासवर्ड दोबारा डालें *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="वही नया पासवर्ड दोबारा दर्ज करें..."
                      className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-[#BA0000] focus:border-[#BA0000] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label={showConfirmPassword ? 'पासवर्ड छिपाएं' : 'पासवर्ड देखें'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Real-Time Password Strength Meter & Match Panel */}
                <PasswordStrengthMeter
                  password={newPassword}
                  confirmPassword={confirmPassword}
                  adminEmail={verifiedEmail || AUTHORIZED_ADMIN_EMAIL}
                />

                {/* Save New Password Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !passwordStrength.isAcceptable || !isPasswordsMatching}
                  className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl text-sm shadow transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>नया पासवर्ड सेव हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>नया पासवर्ड सेव करें (Save New Password)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* STATE 4: EXPIRED, INVALID, MISSING CODE OR PROVIDER DISABLED */
              <div className="space-y-4">
                {validationError ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm text-rose-900">
                          {isProviderDisabledError
                            ? 'Firebase Console में Email/Password लॉगिन बंद है'
                            : 'पासवर्ड रीसेट लिंक समाप्त या अमान्य है'}
                        </h3>
                        <p className="text-xs text-rose-800 leading-relaxed mt-1">
                          {validationError}
                        </p>
                      </div>
                    </div>

                    {isProviderDisabledError && (
                      <div className="bg-white border border-rose-200 rounded-lg p-3 text-[11px] text-slate-700 space-y-1 mt-2">
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                          <span>इसे कैसे ठीक करें (Firebase Console सेटिंग):</span>
                        </p>
                        <ol className="list-decimal pl-4 space-y-0.5">
                          <li>Firebase Console में प्रोजेक्ट <strong>{firebaseConfig.projectId}</strong> खोलें।</li>
                          <li><strong>Authentication → Sign-in method</strong> पर जाएं।</li>
                          <li><strong>Email/Password</strong> प्रदाता को <strong>Enable</strong> करके Save करें।</li>
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
                    नया पासवर्ड रीसेट लिंक प्राप्त करने के लिए नीचे क्लिक करें। लिंक केवल अधिकृत ईमेल <strong>{AUTHORIZED_ADMIN_EMAIL}</strong> पर भेजा जाएगा।
                  </div>
                )}

                {freshLinkSentMsg ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{freshLinkSentMsg}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestFreshLink}
                    disabled={isSendingFreshLink}
                    className="w-full flex items-center justify-center gap-2 bg-[#BA0000] hover:bg-red-800 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-xl text-sm shadow transition cursor-pointer"
                  >
                    {isSendingFreshLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ताज़ा रीसेट ईमेल भेजा जा रहा है...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>नया रीसेट ईमेल भेजें (Request Fresh Reset Email)</span>
                      </>
                    )}
                  </button>
                )}

                {/* Manual oobCode input if admin copies code from URL */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700">
                    यदि आपके पास नया oobCode है तो यहाँ पेस्ट कर सत्यापित करें:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={oobCode}
                      onChange={(e) => setOobCode(e.target.value)}
                      placeholder="oobCode पेस्ट करें..."
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => validateCode(oobCode)}
                      disabled={!oobCode.trim()}
                      className="px-3.5 py-2 bg-[#001F3F] hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      सत्यापित करें
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleReturnToAdminLogin}
                    className="font-bold text-[#001F3F] hover:underline cursor-pointer"
                  >
                    ← एडमिन लॉगिन पर जाएं
                  </button>
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    मुख्य पृष्ठ
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#001F3F] text-slate-300 text-center py-3 px-4 text-xs">
        © 2026 <strong>MP SARKARI UPDATE</strong> — सुरक्षित एडमिन पासवर्ड रीसेट पोर्टल
      </footer>
    </div>
  );
};
