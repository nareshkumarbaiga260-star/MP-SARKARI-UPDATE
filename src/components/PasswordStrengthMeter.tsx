import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Shield
} from 'lucide-react';

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  level: 0 | 1 | 2 | 3 | 4 | 5;
  labelHindi: string;
  labelEnglish: string;
  colorClass: string;
  textColorClass: string;
  bgTintClass: string;
  checks: {
    hasMinLength: boolean;
    hasRecommendedLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    noSpaces: boolean;
    noWeakPatterns: boolean;
  };
  warnings: string[];
  isAcceptable: boolean;
}

const COMMON_WEAK_TOKENS = [
  '123456',
  '12345678',
  '123456789',
  'password',
  'passw0rd',
  'qwerty',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'mpsarkari',
  'sarkari',
  'india123'
];

export function evaluatePasswordStrength(
  password: string,
  adminEmail?: string
): PasswordStrengthResult {
  const hasMinLength = password.length >= 8;
  const hasRecommendedLength = password.length >= 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const noSpaces = password.length > 0 ? !/\s/.test(password) : true;

  const lower = password.toLowerCase();
  const warnings: string[] = [];

  // Detect common weak words/sequences
  const containsWeakToken = COMMON_WEAK_TOKENS.some((token) => lower.includes(token));
  if (password && containsWeakToken) {
    warnings.push('सामान्य या आसानी से अनुमानित शब्द/अंक (जैसे 123456, admin, password) का उपयोग न करें।');
  }

  // Detect email local-part reuse
  const emailLocal = adminEmail ? adminEmail.split('@')[0]?.toLowerCase() : '';
  const containsEmailPart = Boolean(emailLocal && emailLocal.length >= 4 && lower.includes(emailLocal));
  if (password && containsEmailPart) {
    warnings.push('पासवर्ड में अपने ईमेल आईडी का भाग शामिल न करें।');
  }

  // Detect repeated characters (e.g., "aaaa" or "1111")
  const hasRepeatedChars = /(.)\1{3,}/.test(password);
  if (password && hasRepeatedChars) {
    warnings.push('एक ही अक्षर या अंक को लगातार 4 बार दोहराने से बचें।');
  }

  if (password && !noSpaces) {
    warnings.push('पासवर्ड में खाली स्थान (Space) की अनुमति नहीं है।');
  }

  const noWeakPatterns = !containsWeakToken && !containsEmailPart && !hasRepeatedChars;

  if (!password) {
    return {
      score: 0,
      level: 0,
      labelHindi: 'प्रतीक्षारत',
      labelEnglish: 'Pending',
      colorClass: 'bg-slate-300',
      textColorClass: 'text-slate-500',
      bgTintClass: 'bg-slate-50 border-slate-200',
      checks: {
        hasMinLength: false,
        hasRecommendedLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        noSpaces: true,
        noWeakPatterns: true
      },
      warnings: [],
      isAcceptable: false
    };
  }

  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 5;
  if (hasUpperCase) score += 15;
  if (hasLowerCase) score += 15;
  if (hasNumber) score += 15;
  if (hasSpecialChar) score += 15;

  // Penalties for weak patterns or spaces
  if (!noWeakPatterns) score = Math.max(10, score - 35);
  if (!noSpaces) score = Math.max(10, score - 25);
  if (password.length < 8) score = Math.min(score, 25);

  score = Math.max(0, Math.min(100, score));

  let level: 1 | 2 | 3 | 4 | 5 = 1;
  let labelHindi = 'बहुत कमजोर';
  let labelEnglish = 'Very Weak';
  let colorClass = 'bg-rose-600';
  let textColorClass = 'text-rose-700';
  let bgTintClass = 'bg-rose-50/60 border-rose-200';

  if (score >= 90 && noWeakPatterns && noSpaces) {
    level = 5;
    labelHindi = 'अति मजबूत (एडमिन सुरक्षित)';
    labelEnglish = 'Very Strong';
    colorClass = 'bg-emerald-600';
    textColorClass = 'text-emerald-700';
    bgTintClass = 'bg-emerald-50/60 border-emerald-200';
  } else if (score >= 75 && noWeakPatterns && noSpaces) {
    level = 4;
    labelHindi = 'मजबूत (Strong)';
    labelEnglish = 'Strong';
    colorClass = 'bg-blue-600';
    textColorClass = 'text-blue-700';
    bgTintClass = 'bg-blue-50/60 border-blue-200';
  } else if (score >= 55) {
    level = 3;
    labelHindi = 'मध्यम (सुधार आवश्यक)';
    labelEnglish = 'Moderate';
    colorClass = 'bg-amber-500';
    textColorClass = 'text-amber-700';
    bgTintClass = 'bg-amber-50/60 border-amber-200';
  } else if (score >= 35) {
    level = 2;
    labelHindi = 'कमजोर';
    labelEnglish = 'Weak';
    colorClass = 'bg-orange-500';
    textColorClass = 'text-orange-700';
    bgTintClass = 'bg-orange-50/60 border-orange-200';
  }

  const isAcceptable =
    hasMinLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar &&
    noSpaces &&
    noWeakPatterns;

  return {
    score,
    level,
    labelHindi,
    labelEnglish,
    colorClass,
    textColorClass,
    bgTintClass,
    checks: {
      hasMinLength,
      hasRecommendedLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      noSpaces,
      noWeakPatterns
    },
    warnings,
    isAcceptable
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  adminEmail?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  confirmPassword,
  adminEmail
}) => {
  const result = evaluatePasswordStrength(password, adminEmail);
  const { checks, warnings, level, score, labelHindi, colorClass, textColorClass, bgTintClass } = result;
  const isPasswordsMatching = Boolean(password && confirmPassword && password === confirmPassword);

  const criteriaItems = [
    { ok: checks.hasMinLength, label: 'कम से कम 8 अक्षर (अनिवार्य)' },
    { ok: checks.hasUpperCase, label: 'बड़ा अक्षर (A-Z)' },
    { ok: checks.hasLowerCase, label: 'छोटा अक्षर (a-z)' },
    { ok: checks.hasNumber, label: 'संख्या (0-9)' },
    { ok: checks.hasSpecialChar, label: 'विशेष चिह्न (@, #, $, !)' },
    { ok: checks.hasRecommendedLength, label: '12+ अक्षर (सर्वोत्तम सुरक्षा)' }
  ];

  return (
    <div
      className={`p-3.5 rounded-xl border transition-colors duration-200 space-y-2.5 text-[11px] ${bgTintClass}`}
      aria-live="polite"
    >
      {/* Header row with icon, label, and numeric percentage */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          {level >= 4 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : level >= 1 ? (
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span>पासवर्ड मजबूती (Strength):</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-black ${textColorClass}`}>{labelHindi}</span>
          {password && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
              {score}%
            </span>
          )}
        </div>
      </div>

      {/* 5-segment real-time meter bar */}
      <div
        className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden flex gap-1 p-0.5"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Password strength meter"
      >
        {[1, 2, 3, 4, 5].map((segment) => (
          <div
            key={segment}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              level >= segment ? colorClass : 'bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Best-practice criteria checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] text-slate-600 pt-0.5">
        {criteriaItems.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-1.5 transition-colors ${
              item.ok ? 'text-emerald-800 font-bold' : 'text-slate-500'
            }`}
          >
            {item.ok ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-flex items-center justify-center text-[9px] text-slate-400 shrink-0">
                •
              </span>
            )}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      {/* Real-time security warnings for weak patterns */}
      {warnings.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-rose-200/80">
          {warnings.map((warning) => (
            <div key={warning} className="flex items-start gap-1.5 text-[10.5px] font-semibold text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Real-time confirm password match status */}
      {confirmPassword !== undefined && confirmPassword !== '' && (
        <div
          className={`pt-2 border-t border-slate-200/80 font-bold flex items-center gap-1.5 text-[11px] ${
            isPasswordsMatching ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {isPasswordsMatching ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>दोनों पासवर्ड एक समान हैं</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>दोनों पासवर्ड मेल नहीं खा रहे हैं</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
