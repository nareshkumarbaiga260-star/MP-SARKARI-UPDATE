import React, { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { ToolPageShell } from './ToolPageShell';

interface AgeCalculatorToolProps {
  onBackToTools: () => void;
  onBackToPortal: () => void;
}

type CategoryKey = 'general' | 'obc' | 'scst' | 'female-mp' | 'pwd';

const CATEGORY_LIMITS: Record<
  CategoryKey,
  { label: string; baseMax: number; relaxation: number; note: string }
> = {
  general: {
    label: 'अनारक्षित (General / UR)',
    baseMax: 40,
    relaxation: 0,
    note: 'मध्य प्रदेश की अधिकांश भर्तियों (MPESB/MPPSC) में सामान्य अधिकतम आयु 40 वर्ष (या पद अनुसार 28/33 वर्ष)।'
  },
  obc: {
    label: 'अन्य पिछड़ा वर्ग (MP OBC)',
    baseMax: 40,
    relaxation: 5,
    note: 'मध्य प्रदेश मूल निवासी OBC अभ्यर्थियों को अधिकतम आयु में 5 वर्ष की छूट (कुल 45 वर्ष तक)।'
  },
  scst: {
    label: 'अनुसूचित जाति / जनजाति (MP SC/ST)',
    baseMax: 40,
    relaxation: 5,
    note: 'मध्य प्रदेश मूल निवासी SC/ST अभ्यर्थियों को अधिकतम आयु में 5 वर्ष की छूट (कुल 45 वर्ष तक)।'
  },
  'female-mp': {
    label: 'महिला अभ्यर्थी (MP मूल निवासी)',
    baseMax: 40,
    relaxation: 5,
    note: 'MP की सभी श्रेणी की महिला अभ्यर्थियों को 5 वर्ष की विशेष आयु छूट (कुल 45 वर्ष तक)।'
  },
  pwd: {
    label: 'दिव्यांगजन (PwD)',
    baseMax: 40,
    relaxation: 10,
    note: 'दिव्यांग अभ्यर्थियों को नियमानुसार अधिकतम 10 वर्ष तक की आयु छूट।'
  }
};

function computeExactAge(dobStr: string, targetStr: string) {
  if (!dobStr || !targetStr) return null;
  const dob = new Date(`${dobStr}T00:00:00`);
  const target = new Date(`${targetStr}T00:00:00`);
  if (Number.isNaN(dob.getTime()) || Number.isNaN(target.getTime())) return null;
  if (dob > target) {
    return { invalidOrder: true as const };
  }

  let years = target.getFullYear() - dob.getFullYear();
  let months = target.getMonth() - dob.getMonth();
  let days = target.getDate() - dob.getDate();

  if (days < 0) {
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalDays = Math.floor((target.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
  const totalMonths = years * 12 + months;

  // Next birthday from target date
  let nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBday < target) {
    nextBday = new Date(target.getFullYear() + 1, dob.getMonth(), dob.getDate());
  }
  const daysToNextBday = Math.ceil(
    (nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    invalidOrder: false as const,
    years,
    months,
    days,
    totalDays,
    totalMonths,
    daysToNextBday
  };
}

export const AgeCalculatorTool: React.FC<AgeCalculatorToolProps> = ({
  onBackToTools,
  onBackToPortal
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [dob, setDob] = useState<string>('2000-06-15');
  const [targetDate, setTargetDate] = useState<string>('2026-01-01');
  const [category, setCategory] = useState<CategoryKey>('general');
  const [minRequiredAge, setMinRequiredAge] = useState<number>(18);
  const [baseMaxAge, setBaseMaxAge] = useState<number>(40);

  const ageResult = useMemo(() => computeExactAge(dob, targetDate), [dob, targetDate]);
  const catMeta = CATEGORY_LIMITS[category];
  const effectiveMaxAge = baseMaxAge + catMeta.relaxation;

  const isEligible =
    ageResult &&
    !ageResult.invalidOrder &&
    ageResult.years >= minRequiredAge &&
    (ageResult.years < effectiveMaxAge ||
      (ageResult.years === effectiveMaxAge && ageResult.months === 0 && ageResult.days === 0));

  return (
    <ToolPageShell
      titleHindi="सरकारी भर्ती आयु कैलकुलेटर (Age Calculator)"
      subtitleHindi="MPESB, MPPSC, SSC व रेलवे परीक्षा कट-ऑफ तिथि अनुसार सटीक आयु गणना"
      onBackToTools={onBackToTools}
      onBackToPortal={onBackToPortal}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Form */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#BA0000]" />
              <span>तिथि एवं श्रेणी विवरण दर्ज करें</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setDob('2000-06-15');
                setTargetDate('2026-01-01');
                setCategory('general');
                setMinRequiredAge(18);
                setBaseMaxAge(40);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                जन्मतिथि (Date of Birth) *
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#BA0000] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-bold text-slate-800">
                  आयु गणना तिथि / कट-ऑफ तिथि (Age As On) *
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTargetDate('2026-01-01')}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    01 Jan 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate('2026-07-01')}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    01 Jul 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDate(todayIso)}
                    className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    आज
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#BA0000] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                अभ्यर्थी की श्रेणी (MP आयु छूट नियम अनुसार)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#001F3F] focus:outline-none"
              >
                {Object.entries(CATEGORY_LIMITS).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label} (+{meta.relaxation} वर्ष छूट)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  न्यूनतम आयु सीमा (वर्ष)
                </label>
                <input
                  type="number"
                  min={14}
                  max={35}
                  value={minRequiredAge}
                  onChange={(e) => setMinRequiredAge(Number(e.target.value) || 18)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सामान्य अधिकतम आयु (वर्ष)
                </label>
                <input
                  type="number"
                  min={20}
                  max={62}
                  value={baseMaxAge}
                  onChange={(e) => setBaseMaxAge(Number(e.target.value) || 40)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Results Card */}
        <section className="lg:col-span-6 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-200">
              गणना परिणाम (Exact Age Result)
            </h2>

            {!ageResult ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                कृपया सही जन्मतिथि और गणना तिथि चुनें।
              </p>
            ) : ageResult.invalidOrder ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>जन्मतिथि, कट-ऑफ तिथि से बड़ी नहीं हो सकती।</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 text-center tabular-nums">
                  <div className="bg-[#001F3F] text-white rounded-xl p-4">
                    <span className="text-3xl sm:text-4xl font-black block">{ageResult.years}</span>
                    <span className="text-xs text-amber-300 font-bold mt-1 block">वर्ष (Years)</span>
                  </div>
                  <div className="bg-[#BA0000] text-white rounded-xl p-4">
                    <span className="text-3xl sm:text-4xl font-black block">{ageResult.months}</span>
                    <span className="text-xs text-amber-200 font-bold mt-1 block">माह (Months)</span>
                  </div>
                  <div className="bg-slate-800 text-white rounded-xl p-4">
                    <span className="text-3xl sm:text-4xl font-black block">{ageResult.days}</span>
                    <span className="text-xs text-slate-300 font-bold mt-1 block">दिन (Days)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 tabular-nums">
                  <div>
                    <span className="text-slate-500 block">कुल महीने (Total Months)</span>
                    <strong className="text-sm text-slate-900">{ageResult.totalMonths} माह, {ageResult.days} दिन</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">कुल दिन (Total Days)</span>
                    <strong className="text-sm text-slate-900">{ageResult.totalDays.toLocaleString('en-IN')} दिन</strong>
                  </div>
                </div>

                {/* Eligibility Verification */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    isEligible
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {isEligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <p className="font-black text-sm">
                      {isEligible
                        ? `आयु पात्रता: योग्य (${minRequiredAge} से ${effectiveMaxAge} वर्ष के भीतर)`
                        : `आयु पात्रता: सीमा से बाहर (${minRequiredAge}–${effectiveMaxAge} वर्ष आवश्यक)`}
                    </p>
                    <p className="leading-relaxed">{catMeta.note}</p>
                    <p className="text-[11px] font-semibold pt-1">
                      अगले जन्मदिन में शेष दिन: {ageResult.daysToNextBday} दिन
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </ToolPageShell>
  );
};
