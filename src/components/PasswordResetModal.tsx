import React, { useState, useEffect } from 'react';
import {
  X,
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
  ShieldAlert
} from 'lucide-react';
import { useAuth, AUTHORIZED_ADMIN_EMAIL } from '../context/AuthContext';

interface PasswordResetModalProps {
  isOpen: boolean;
  initialCode?: string | null;
  onClose: () => void;
  onOpenAdminLogin: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  initialCode,
  onClose,
  onOpenAdminLogin
}) => {
  const { verifyResetCode, confirmReset, sendPasswordReset } = useAuth();

  const [oobCode, setOobCode] = useState<string>('');
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

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

  // Initialize and validate when opened or initialCode changes
  useEffect(() => {
    if (isOpen) {
      const codeToUse = initialCode || oobCode;
      if (codeToUse) {
        setOobCode(codeToUse);
        validateCode(codeToUse);
      }
    }
  }, [isOpen, initialCode]);

  const validateCode = async (code: string) => {
    setIsValidatingCode(true);
    setValidationError(null);
    setIsCodeValid(false);
    setIsSuccess(false);

    try {
      const email = await verifyResetCode(code);
      setVerifiedEmail(email);
      setIsCodeValid(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'अमान्य अथवा समाप्त (Expired) पासवर्ड रीसेट कोड।';
      setValidationError(msg);
      setIsCodeValid(false);
    } finally {
      setIsValidatingCode(false);
    }
  };

  // Password Strength Indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordsMatching = newPassword !== '' && newPassword === confirmPassword;

  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newPassword || !confirmPassword) {
      setSubmitError('कृपया दोनों पासवर्ड फ़ील्ड भरें।');
      return;
    }

    if (newPassword.length < 8) {
      setSubmitError('पासवर्ड कम से कम 8 अक्षरों का होना अनिवार्य है।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('दोनों पासवर्ड एक जैसे नहीं हैं। कृपया मिलान की जाँच करें।');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmReset(oobCode, newPassword);
      setIsSuccess(true);
      // Clean up URL parameters so old reset code cannot be accidentally re-used
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'पासवर्ड अपडेट करने में त्रुटि हुई।';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestFreshLink = async () => {
    setIsSendingFreshLink(true);
    setFreshLinkSentMsg(null);
    setValidationError(null);
    try {
      await sendPasswordReset();
      setFreshLinkSentMsg(`एक नया पासवर्ड रीसेट लिंक सफलतापूर्वक ${AUTHORIZED_ADMIN_EMAIL} पर भेज दिया गया है।`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'नया लिंक भेजने में त्रुटि हुई।';
      setValidationError(msg);
    } finally {
      setIsSendingFreshLink(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-[#0B192C] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-lg text-slate-950 font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                एडमिन पासवर्ड रीसेट (Password Reset)
              </h3>
              <p className="text-[11px] text-slate-300">
                Firebase Authentication सुरक्षित सत्यापन
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* STATE 1: SUCCESSFUL RESET */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  पासवर्ड सफलतापूर्वक बदल दिया गया!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  आपका नया एडमिन पासवर्ड सुरक्षित रूप से सक्रिय हो चुका है। अब आप अपने नए पासवर्ड से पोर्टल में लॉगिन कर सकते हैं।
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium">
                खाता: <strong>{AUTHORIZED_ADMIN_EMAIL}</strong>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
              >
                <span>एडमिन लॉगिन पर जाएं</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : isValidatingCode ? (
            /* STATE 2: VALIDATING CODE */
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                पासवर्ड रीसेट लिंक का सत्यापन किया जा रहा है...
              </p>
            </div>
          ) : isCodeValid ? (
            /* STATE 3: VALID CODE - SHOW NEW PASSWORD FORM */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-700 truncate">
                  सत्यापित खाता: <strong className="font-mono text-slate-900">{verifiedEmail || AUTHORIZED_ADMIN_EMAIL}</strong>
                </span>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Field 1: New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  नया पासवर्ड (New Password) *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="नया पासवर्ड दर्ज करें (कम से कम 8 अक्षर)..."
                    className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पासवर्ड दोबारा डालें (Confirm Password) *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="वही पासवर्ड दोबारा दर्ज करें..."
                    className="w-full p-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match & Strength Indicators */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>पासवर्ड मजबूती (Strength):</span>
                  <span className={
                    strengthScore >= 4 ? 'text-emerald-600' : strengthScore >= 2 ? 'text-amber-600' : 'text-rose-600'
                  }>
                    {strengthScore >= 4 ? 'उत्कृष्ट (Strong)' : strengthScore >= 2 ? 'मध्यम (Moderate)' : 'कमजोर (Weak)'}
                  </span>
                </div>

                {/* Strength Meter Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                  <div className={`h-full flex-1 ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 ${strengthScore >= 3 ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                  <div className={`h-full flex-1 ${strengthScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                </div>

                <ul className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                  <li className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-bold' : ''}`}>
                    <span>{hasMinLength ? '✓' : '•'} कम से कम 8 अक्षर</span>
                  </li>
                  <li className={`flex items-center gap-1 ${hasUpperCase ? 'text-emerald-700 font-bold' : ''}`}>
                    <span>{hasUpperCase ? '✓' : '•'} बड़ा अक्षर (A-Z)</span>
                  </li>
                  <li className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-bold' : ''}`}>
                    <span>{hasNumber ? '✓' : '•'} कम से कम एक अंक (0-9)</span>
                  </li>
                  <li className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-700 font-bold' : ''}`}>
                    <span>{hasSpecialChar ? '✓' : '•'} विशेष वर्ण (@, #, $)</span>
                  </li>
                </ul>

                {confirmPassword && (
                  <div className={`pt-1 border-t border-slate-200 font-bold flex items-center gap-1 ${
                    isPasswordsMatching ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {isPasswordsMatching ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>दोनों पासवर्ड एक समान हैं</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>पासवर्ड का मिलान नहीं हो रहा है</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !isPasswordsMatching}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-3 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>नया पासवर्ड सुरक्षित किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>नया पासवर्ड सुरक्षित करें (Save New Password)</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STATE 4: INVALID OR EXPIRED CODE */
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-rose-900 mb-1">
                  पासवर्ड रीसेट लिंक अमान्य या समाप्त हो चुका है
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {validationError || 'यह रीसेट कोड पहले ही उपयोग किया जा चुका है अथवा इसकी समय-सीमा समाप्त हो गई है।'}
                </p>
              </div>

              {freshLinkSentMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{freshLinkSentMsg}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 text-center">
                    चिंता न करें! आप नीचे दिए गए बटन से अपने अधिकृत ईमेल पर एक नया और ताज़ा पासवर्ड रीसेट लिंक भेज सकते हैं:
                  </p>

                  <button
                    onClick={handleRequestFreshLink}
                    disabled={isSendingFreshLink}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
                  >
                    {isSendingFreshLink ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ताज़ा लिंक भेजा जा रहा है...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>नया रीसेट लिंक भेजें (Request Fresh Link)</span>
                      </>
                    )}
                  </button>

                  {/* Manual Code Input fallback */}
                  <div className="pt-3 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      अथवा ईमेल से प्राप्त एक्शन कोड यहाँ पेस्ट करें:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={oobCode}
                        onChange={(e) => setOobCode(e.target.value.trim())}
                        placeholder="oobCode पेस्ट करें..."
                        className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => validateCode(oobCode)}
                        disabled={!oobCode}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs font-bold"
                      >
                        सत्यापित करें
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
              >
                ← एडमिन लॉगिन स्क्रीन पर वापस जाएं
              </button>
            </div>
          )}

        </div>

        {/* Modal Bottom Strip */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>अधिकृत व्यवस्थापक: {AUTHORIZED_ADMIN_EMAIL}</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
          >
            बंद करें
          </button>
        </div>

      </div>
    </div>
  );
};
